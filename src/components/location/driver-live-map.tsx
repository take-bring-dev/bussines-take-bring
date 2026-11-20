"use client";

import { useMemo } from "react";
import { LiveMap } from "@/components/location/live-map";
import { useLivePoll } from "@/hooks/use-live-poll";

type LocResponse = {
  latest: {
    lat: number;
    lng: number;
    recordedAt: string;
    source: string;
  } | null;
  points?: Array<{ lat: number; lng: number }>;
};

export function DriverLiveMap({
  userId,
  loadId,
  label,
  className,
}: {
  userId: string;
  loadId?: string;
  label?: string;
  className?: string;
}) {
  const url = useMemo(() => {
    const qs = new URLSearchParams({ trail: "1" });
    if (loadId) qs.set("loadId", loadId);
    return `/api/location/${userId}?${qs}`;
  }, [userId, loadId]);

  const { data } = useLivePoll<LocResponse>(url, { intervalMs: 8000 });

  const markers = useMemo(
    () =>
      data?.latest
        ? [
            {
              id: userId,
              lat: data.latest.lat,
              lng: data.latest.lng,
              label: label || "Driver",
              sublabel: data.latest.source,
              recordedAt: data.latest.recordedAt,
            },
          ]
        : [],
    [data, userId, label],
  );

  const trail = data?.points || [];

  return (
    <div className={className}>
      <h2 className="mb-2 text-[11px] font-bold tracking-wider uppercase">
        Live location
      </h2>
      <LiveMap markers={markers} trail={trail} height={280} />
    </div>
  );
}
