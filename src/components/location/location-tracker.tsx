"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  getCurrentPosition,
  postLocation,
  requestLocationPermission,
  startAlwaysOnTracking,
} from "@/lib/geo";
import {
  flushLocationQueueViaSw,
  onServiceWorkerLocationPing,
  registerLocationPeriodicSync,
} from "@/lib/location-sw-client";

/**
 * PWA + Service Worker location reporter.
 * - Page reads GPS (SW cannot).
 * - SW queues samples offline and flushes on Background Sync.
 * - Periodic Sync / push "location.ping" asks open clients to report again.
 */
export function LocationTracker({ enabled }: { enabled: boolean }) {
  const stopRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"off" | "asking" | "live" | "denied">(
    "off",
  );
  const [lastAt, setLastAt] = useState<Date | null>(null);
  const [swAssist, setSwAssist] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      return;
    }

    let cancelled = false;
    setStatus("asking");

    async function reportOnce(source = "pwa-sw-ping") {
      const pos = await getCurrentPosition();
      if (!pos || cancelled) return;
      await postLocation({ ...pos, source });
      setLastAt(new Date());
      setStatus("live");
    }

    void (async () => {
      const ok = await requestLocationPermission();
      if (cancelled) return;
      if (!ok) {
        setStatus("denied");
        return;
      }

      const sync = await registerLocationPeriodicSync();
      if (!cancelled) setSwAssist(sync.ok);
      void flushLocationQueueViaSw();

      stopRef.current = await startAlwaysOnTracking(async (pos) => {
        if (cancelled) return;
        try {
          await postLocation(pos);
          setLastAt(new Date());
          setStatus("live");
        } catch {
          /* SW queue will retry when online */
        }
      });
      if (!cancelled) setStatus("live");
    })();

    const unsub = onServiceWorkerLocationPing(() => {
      void reportOnce("sw-ping");
    });

    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
      unsub();
    };
  }, [enabled]);

  if (!enabled || status === "off") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 md:bottom-4">
      <div
        className={
          status === "denied"
            ? "pointer-events-auto flex max-w-md items-start gap-2 rounded-lg border border-destructive/30 bg-card px-3 py-2 text-xs shadow-md"
            : "flex max-w-md items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-md backdrop-blur"
        }
      >
        <MapPin
          className={
            status === "live"
              ? "size-3.5 shrink-0 text-success"
              : status === "denied"
                ? "size-3.5 shrink-0 text-destructive"
                : "size-3.5 shrink-0 text-muted-foreground"
          }
        />
        {status === "asking" ? (
          <span className="text-muted-foreground">Requesting location…</span>
        ) : status === "denied" ? (
          <span>
            Location blocked. Enable it in Settings so your fleet can see you
            while TBD is open.
          </span>
        ) : (
          <span className="text-muted-foreground">
            Live GPS on
            {lastAt
              ? ` · updated ${lastAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : ""}
            <span className="hidden sm:inline">
              {swAssist
                ? " · SW queue + periodic sync"
                : " · SW queue when offline"}
              {" · keep app open"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
