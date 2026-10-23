/**
 * Page ↔ Service Worker bridge for location.
 * SW cannot read GPS; it queues samples and asks open clients to ping.
 */

import type { GeoPosition } from "@/lib/geo";

const SW_PATH = "/firebase-messaging-sw.js";

export async function getLocationSwRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  try {
    return await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch {
    return navigator.serviceWorker.ready.catch(() => null);
  }
}

/** Enqueue via SW (offline-safe) + SW will try POST immediately. */
export async function enqueueLocationViaSw(
  position: GeoPosition,
  loadId?: string | null,
) {
  const reg = await getLocationSwRegistration();
  const worker = reg?.active || navigator.serviceWorker?.controller;
  if (!worker) return false;

  worker.postMessage({
    type: "LOCATION_ENQUEUE",
    sample: {
      lat: position.lat,
      lng: position.lng,
      accuracyM: position.accuracyM,
      speedMps: position.speedMps,
      headingDeg: position.headingDeg,
      altitudeM: position.altitudeM,
      source: position.source || "pwa-sw",
      recordedAt: position.recordedAt,
      loadId: loadId || null,
    },
  });
  return true;
}

export async function flushLocationQueueViaSw() {
  const reg = await getLocationSwRegistration();
  const worker = reg?.active || navigator.serviceWorker?.controller;
  worker?.postMessage({ type: "LOCATION_FLUSH" });
}

/** Chrome/Android installed PWA: periodic wake → SW asks clients for GPS. */
export async function registerLocationPeriodicSync() {
  const reg = await getLocationSwRegistration();
  if (!reg) return { ok: false as const, reason: "no-sw" };

  const anyReg = reg as ServiceWorkerRegistration & {
    periodicSync?: {
      register: (tag: string, opts: { minInterval: number }) => Promise<void>;
      getTags?: () => Promise<string[]>;
    };
    sync?: { register: (tag: string) => Promise<void> };
  };

  try {
    if (anyReg.sync) {
      await anyReg.sync.register("flush-locations");
    }
  } catch {
    /* Background Sync may need permission / support */
  }

  try {
    if (!anyReg.periodicSync) {
      return { ok: false as const, reason: "no-periodicsync" };
    }
    const status = await navigator.permissions?.query({
      name: "periodic-background-sync" as PermissionName,
    });
    if (status && status.state === "denied") {
      return { ok: false as const, reason: "denied" };
    }
    // Browser chooses real interval; minInterval is a hint (ms).
    await anyReg.periodicSync.register("location-ping", {
      minInterval: 15 * 60 * 1000,
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "register-failed" };
  }
}

/**
 * Listen for SW LOCATION_PING → read GPS in the page → report.
 * Returns unsubscribe.
 */
export function onServiceWorkerLocationPing(
  handler: () => void | Promise<void>,
) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => undefined;
  }

  const listener = (event: MessageEvent) => {
    if (event.data?.type === "LOCATION_PING") {
      void handler();
    }
  };
  navigator.serviceWorker.addEventListener("message", listener);
  return () => {
    navigator.serviceWorker.removeEventListener("message", listener);
  };
}
