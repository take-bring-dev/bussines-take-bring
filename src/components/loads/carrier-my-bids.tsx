"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Package,
  XCircle,
} from "lucide-react";
import { CarrierLoadStatusActions } from "@/components/loads/carrier-load-status-actions";
import { formatMoney, formatStatus, formatWindow } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CarrierBidRow = {
  id: string;
  status: string;
  proposedPrice: number;
  currency: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  load: {
    id: string;
    reference: string | null;
    status: string;
    pickupCity: string;
    pickupCountry: string;
    pickupZip: string;
    deliveryCity: string;
    deliveryCountry: string;
    deliveryZip: string;
    pickupWindowStart: string;
    pickupWindowEnd: string;
    deliveryWindowStart: string;
    deliveryWindowEnd: string;
    weightKg: number;
    cargoDescription: string;
    requiredVehicleClass: string;
    shipperName: string | null;
  };
};

type FilterKey = "accepted" | "pending" | "rejected" | "all";

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function CarrierMyBids({ bids }: { bids: CarrierBidRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("accepted");

  const counts = useMemo(
    () => ({
      all: bids.length,
      accepted: bids.filter((b) => b.status === "ACCEPTED").length,
      pending: bids.filter((b) => b.status === "PENDING").length,
      rejected: bids.filter((b) => b.status === "REJECTED").length,
    }),
    [bids],
  );

  const rows = useMemo(() => {
    const list =
      filter === "all"
        ? bids
        : bids.filter((b) => b.status === filter.toUpperCase());
    return [...list].sort((a, b) => {
      if (a.status === "ACCEPTED" && b.status !== "ACCEPTED") return -1;
      if (b.status === "ACCEPTED" && a.status !== "ACCEPTED") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [bids, filter]);

  const pills: { key: FilterKey; label: string; count: number }[] = [
    { key: "accepted", label: "Accepted / Won", count: counts.accepted },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "rejected", label: "Not selected", count: counts.rejected },
    { key: "all", label: "All bids", count: counts.all },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setFilter(p.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
              filter === p.key
                ? "bg-primary-container font-bold text-on-primary-container shadow-sm"
                : "bg-surface-low font-medium text-muted-foreground hover:bg-surface-high",
            )}
          >
            {p.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px]",
                filter === p.key ? "bg-card/80" : "bg-surface-high",
              )}
            >
              {p.count}
            </span>
          </button>
        ))}
      </div>

      {!rows.length ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
          <Package className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">
            {filter === "accepted"
              ? "No accepted offers yet"
              : filter === "pending"
                ? "No pending bids"
                : "No bids in this filter"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "accepted"
              ? "When a shipper awards your quote, it shows up here."
              : "Submit bids from the Open Freight Board."}
          </p>
          <Link
            href="/c"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary-container"
          >
            Browse open loads
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((bid) => {
          const ref =
            bid.load.reference ||
            `TB-${bid.load.id.slice(0, 8).toUpperCase()}`;
          const won = bid.status === "ACCEPTED";
          const pending = bid.status === "PENDING";
          const rejected = bid.status === "REJECTED";

          return (
            <article
              key={bid.id}
              className={cn(
                "rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
                won && "border-2 border-success",
                pending && "border-border",
                rejected && "border-border opacity-80",
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold">{ref}</span>
                    {won ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-container/60 px-2.5 py-0.5 text-[11px] font-bold text-success">
                        <CheckCircle2 className="size-3.5" />
                        {bid.load.status === "DELIVERED"
                          ? "DELIVERED"
                          : bid.load.status === "IN_TRANSIT"
                            ? "IN TRANSIT"
                            : "ACCEPTED · AWARDED TO YOU"}
                      </span>
                    ) : null}
                    {pending ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/40 px-2.5 py-0.5 text-[11px] font-bold text-on-primary-container">
                        <Clock className="size-3.5" />
                        PENDING REVIEW
                      </span>
                    ) : null}
                    {rejected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-high px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                        <XCircle className="size-3.5" />
                        NOT SELECTED
                      </span>
                    ) : null}
                    <span className="rounded bg-surface-low px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Load: {formatStatus(bid.load.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {bid.load.pickupCountry}-{bid.load.pickupZip}{" "}
                      {bid.load.pickupCity}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-semibold">
                      {bid.load.deliveryCountry}-{bid.load.deliveryZip}{" "}
                      {bid.load.deliveryCity}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {bid.load.shipperName ? (
                      <span>Shipper: {bid.load.shipperName}</span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      Pickup {formatWindow(
                        bid.load.pickupWindowStart,
                        bid.load.pickupWindowEnd,
                      )}
                    </span>
                    <span>
                      {bid.load.weightKg.toLocaleString("de-DE")} kg ·{" "}
                      {formatStatus(bid.load.requiredVehicleClass)}
                    </span>
                    <span className="truncate max-w-xs">
                      {bid.load.cargoDescription}
                    </span>
                  </div>

                  {bid.message ? (
                    <p className="text-xs text-muted-foreground">
                      Your note: {bid.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2 border-t border-border pt-3 sm:w-48 sm:border-t-0 sm:pt-0 sm:text-right lg:items-end">
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Your bid
                  </p>
                  <p className="font-mono text-2xl font-bold">
                    {formatMoney(bid.proposedPrice, bid.currency)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {won
                      ? `Awarded ${timeAgo(bid.updatedAt)}`
                      : `Submitted ${timeAgo(bid.createdAt)}`}
                  </p>
                  <Link
                    href={`/c/loads/${bid.load.id}`}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold shadow-sm transition-colors",
                      won &&
                        (bid.load.status === "ASSIGNED" ||
                          bid.load.status === "IN_TRANSIT")
                        ? "border border-border bg-card text-foreground hover:bg-surface-low"
                        : "bg-primary-container text-on-primary-container hover:bg-brand-light",
                    )}
                  >
                    <Eye className="size-4" />
                    View details
                  </Link>
                  {won ? (
                    <CarrierLoadStatusActions
                      loadId={bid.load.id}
                      loadStatus={bid.load.status}
                      bidAccepted
                      className="w-full sm:w-48"
                    />
                  ) : pending ? (
                    <span className="rounded-lg bg-surface-low px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                      Waiting on shipper
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
