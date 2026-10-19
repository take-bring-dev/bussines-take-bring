"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/realtime/live-indicator";
import { ApplyButton } from "@/components/loads/apply-button";
import { RouteWaypoint } from "@/components/loads/route-waypoint";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLivePoll } from "@/hooks/use-live-poll";
import { formatStatus, formatWindow } from "@/lib/format";
import { cn } from "@/lib/utils";

type LoadRow = {
  id: string;
  reference: string | null;
  pickupCity: string;
  deliveryCity: string;
  weightKg: number;
  status: string;
  requiredVehicleClass: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  _count?: { applications: number };
};

type Mode = "shipper" | "carrier";

export function LiveLoadsList({ mode }: { mode: Mode }) {
  const { data, updatedAt, loading, error } = useLivePoll<{ loads: LoadRow[] }>(
    "/api/loads",
    { intervalMs: 7000 },
  );
  const loads = data?.loads ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <LiveIndicator updatedAt={updatedAt} />
        {mode === "shipper" ? (
          <Button
            asChild
            size="sm"
            className="hidden border border-[#b7d336] bg-primary-container text-foreground hover:bg-secondary-container md:inline-flex"
          >
            <Link href="/s/loads/new">New load</Link>
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && !loads.length ? (
        <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Loading loads…
        </p>
      ) : null}

      {!loading && !loads.length ? (
        <div className="rounded-lg border border-border bg-card px-4 py-10 text-center">
          <p className="text-sm font-semibold">
            {mode === "shipper" ? "No loads yet" : "No open loads right now"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "shipper"
              ? "Post a load — carriers apply with a price, you award one."
              : "New jobs appear here live when shippers publish."}
          </p>
          {mode === "shipper" ? (
            <Button asChild className="mt-4 bg-primary-container text-foreground hover:bg-secondary-container" size="sm">
              <Link href="/s/loads/new">Create first load</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {loads.map((l, i) => {
          const ref = l.reference || `#${l.id.slice(0, 8).toUpperCase()}`;
          const offers = l._count?.applications ?? 0;
          const highlight = i === 0 && offers > 0;
          return (
            <article
              key={l.id}
              className={cn(
                "relative overflow-hidden rounded-lg border bg-card p-3 shadow-[0_1px_3px_rgba(26,31,22,0.06)]",
                highlight ? "border-2 border-primary-container" : "border-border",
              )}
            >
              {highlight ? (
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary-container" />
              ) : null}

              <div className={cn("flex items-center justify-between gap-2", highlight && "pl-1")}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight">{ref}</span>
                  <span className="rounded border border-border bg-surface-low px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {formatStatus(l.requiredVehicleClass)}
                  </span>
                </div>
                <StatusBadge status={l.status} />
              </div>

              <div className={cn("mt-3", highlight && "pl-1")}>
                <RouteWaypoint
                  from={l.pickupCity}
                  to={l.deliveryCity}
                  fromMeta={formatWindow(l.pickupWindowStart, l.pickupWindowEnd)}
                  toMeta={`${l.weightKg} kg`}
                />
              </div>

              {mode === "shipper" ? (
                <div className={cn("mt-3", highlight && "pl-1")}>
                  <div className="flex items-center justify-between rounded border border-border bg-surface-low p-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Carrier offers
                      </p>
                      <p className="text-sm font-semibold">
                        {offers} {offers === 1 ? "offer" : "offers"} received
                      </p>
                    </div>
                    <Link
                      href={`/s/loads/${l.id}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded border border-border bg-primary-container px-3 text-sm font-semibold text-foreground hover:bg-secondary-container"
                    >
                      {offers > 0 ? `Review ${offers} Offers` : "View"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Payload
                    </p>
                    <p className="text-sm font-bold tabular-nums">{l.weightKg} kg</p>
                  </div>
                  <ApplyButton loadId={l.id} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
