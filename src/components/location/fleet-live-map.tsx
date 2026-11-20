"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { LiveMap, type LiveMapMarker } from "@/components/location/live-map";
import { Button } from "@/components/ui/button";
import { useLivePoll } from "@/hooks/use-live-poll";

type FleetResponse = {
  locations?: Array<{
    userId: string;
    fullName: string;
    vehicleLabel: string | null;
    lat: number;
    lng: number;
    recordedAt: string;
    source: string;
  }>;
  error?: string;
};

export function FleetLiveMap({ className }: { className?: string }) {
  const { data, error, loading, refresh } = useLivePoll<FleetResponse>(
    "/api/location/fleet",
    { intervalMs: 8000 },
  );

  const markers: LiveMapMarker[] = useMemo(
    () =>
      (data?.locations || []).map((l) => ({
        id: l.userId,
        lat: l.lat,
        lng: l.lng,
        label: l.fullName,
        sublabel: [l.vehicleLabel, l.source].filter(Boolean).join(" · "),
        recordedAt: l.recordedAt,
      })),
    [data],
  );

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-bold tracking-wider text-foreground uppercase">
            Live fleet map
          </h2>
          <p className="text-[11px] text-muted-foreground">
            OSM · ~8s poll · Traccar Client (closed-app) or TBD open
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>
      {error ? (
        <p className="mb-2 text-xs text-destructive">{error}</p>
      ) : null}
      <LiveMap markers={markers} height={360} />
    </div>
  );
}
