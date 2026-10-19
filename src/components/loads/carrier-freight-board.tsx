"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Lock,
  Search,
  Shield,
  Scale,
  Timer,
  Zap,
} from "lucide-react";
import { ApplyButton } from "@/components/loads/apply-button";
import { formatMoney, formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CarrierBoardLoad = {
  id: string;
  reference: string | null;
  status: string;
  pickupCity: string;
  pickupZip: string;
  pickupCountry: string;
  pickupCompany: string | null;
  pickupStreet: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  deliveryCity: string;
  deliveryZip: string;
  deliveryCountry: string;
  deliveryCompany: string | null;
  deliveryStreet: string;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  cargoDescription: string;
  weightKg: number;
  palletCount: number | null;
  hazardous: boolean;
  requiredVehicleClass: string;
  suggestedBudgetEur: string | null;
  createdAt: string;
  offerCount: number;
  lowestBid: number | null;
  shipperName: string | null;
  alreadyApplied: boolean;
};

type SortKey = "departure" | "rate" | "created";

const PAGE_SIZE = 4;

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hoursUntil(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}

export function CarrierFreightBoard({ loads }: { loads: CarrierBoardLoad[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("departure");
  const [mode, setMode] = useState<"all" | "ftl" | "ltl">("all");
  const [adrOnly, setAdrOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = [...loads];
    if (query) {
      rows = rows.filter((l) =>
        [
          l.reference,
          l.pickupCity,
          l.deliveryCity,
          l.pickupZip,
          l.deliveryZip,
          l.cargoDescription,
          l.shipperName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }
    if (adrOnly) rows = rows.filter((l) => l.hazardous);
    if (mode === "ftl") rows = rows.filter((l) => l.weightKg >= 10000);
    if (mode === "ltl") rows = rows.filter((l) => l.weightKg < 10000);

    rows.sort((a, b) => {
      if (sort === "rate") {
        const ar = a.suggestedBudgetEur ? Number(a.suggestedBudgetEur) : 0;
        const br = b.suggestedBudgetEur ? Number(b.suggestedBudgetEur) : 0;
        return br - ar;
      }
      if (sort === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (
        new Date(a.pickupWindowStart).getTime() -
        new Date(b.pickupWindowStart).getTime()
      );
    });
    return rows;
  }, [loads, q, sort, mode, adrOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-12">
          <div className="relative flex items-center md:col-span-5">
            <Search className="absolute left-3 size-5 text-outline" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg bg-surface-low pr-4 pl-10 text-sm outline-none transition-all placeholder:text-outline focus:bg-card focus:ring-2 focus:ring-primary"
              placeholder="Search origin, destination, postal code..."
              type="search"
            />
          </div>
          <div className="flex items-center rounded-lg bg-surface-low p-1 md:col-span-3">
            {(
              [
                ["all", "All"],
                ["ftl", "FTL"],
                ["ltl", "LTL"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  setPage(1);
                }}
                className={cn(
                  "flex-1 rounded py-1 text-center text-xs",
                  mode === key
                    ? "bg-card font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="md:col-span-4">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                setPage(1);
              }}
              className="h-10 w-full cursor-pointer rounded-lg bg-surface-low px-3 text-sm font-medium outline-none"
            >
              <option value="departure">Departure (Earliest First)</option>
              <option value="rate">Highest Target Rate (€)</option>
              <option value="created">Recently Posted</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] tracking-wider text-muted-foreground uppercase">
              Board:
            </span>
            <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-semibold text-on-primary-container">
              All loads ({filtered.length})
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={adrOnly}
              onChange={(e) => {
                setAdrOnly(e.target.checked);
                setPage(1);
              }}
              className="size-4 rounded accent-[var(--brand-dark)]"
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              ADR Compliant Only
            </span>
          </label>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {!pageRows.length ? (
          <div className="rounded-xl bg-card p-10 text-center shadow-sm">
            <p className="text-sm font-semibold">No open spot loads match</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New shipper consignments appear here when published.
            </p>
          </div>
        ) : null}

        {pageRows.map((load) => {
          const ref =
            load.reference || `TB-${load.id.slice(0, 8).toUpperCase()}`;
          const target = load.suggestedBudgetEur
            ? Number(load.suggestedBudgetEur)
            : null;
          const urgent = hoursUntil(load.pickupWindowStart) < 24;
          const route = `${load.pickupCity} → ${load.deliveryCity}`;

          return (
            <article
              key={load.id}
              className="relative flex flex-col gap-6 overflow-hidden rounded-xl bg-card p-6 shadow-sm transition-all hover:shadow-md xl:flex-row"
            >
              <div
                className={cn(
                  "absolute top-0 bottom-0 left-0 w-1.5",
                  urgent ? "bg-primary-container" : "bg-primary",
                )}
              />

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold tracking-tight">
                      {ref}
                    </span>
                    <span className="rounded bg-surface-high px-2 py-0.5 text-[11px] font-semibold">
                      {formatStatus(load.requiredVehicleClass)}
                    </span>
                    {load.shipperName ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success-container/50 px-2 py-0.5 text-[11px] font-semibold text-success">
                        <Building2 className="size-3.5" />
                        {load.shipperName}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {urgent ? (
                      <span className="flex items-center gap-1 rounded-full bg-error-container px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
                        <span className="size-1.5 animate-ping rounded-full bg-destructive" />
                        Urgent loading
                      </span>
                    ) : null}
                    <span className="text-[11px] text-muted-foreground">
                      Posted {timeAgo(load.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 items-center gap-4 py-1 md:grid-cols-12">
                  <div className="flex items-start gap-2 md:col-span-4">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-high text-xs font-bold text-primary">
                      A
                    </div>
                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-lg font-bold">
                          {load.pickupCity}
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase">
                          {load.pickupCountry}-{load.pickupZip}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {load.pickupCompany || load.pickupStreet}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-primary">
                        Pickup: {formatWhen(load.pickupWindowStart)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center px-1 text-center md:col-span-4">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {load.weightKg.toLocaleString("de-DE")} kg ·{" "}
                      {load.hazardous ? "ADR" : "Standard"}
                    </span>
                    <div className="my-1 flex w-full items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full bg-primary" />
                      <div className="relative flex h-0.5 flex-1 items-center justify-center bg-outline">
                        <span className="bg-card px-2 text-[11px] text-muted-foreground">
                          Spot corridor
                        </span>
                      </div>
                      <span className="size-2.5 shrink-0 rounded-full bg-primary-container" />
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                      <FileText className="size-3.5" />
                      e-CMR Ready
                    </span>
                  </div>

                  <div className="flex items-start gap-2 md:col-span-4">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
                      B
                    </div>
                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-lg font-bold">
                          {load.deliveryCity}
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase">
                          {load.deliveryCountry}-{load.deliveryZip}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {load.deliveryCompany || load.deliveryStreet}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        Delivery: {formatWhen(load.deliveryWindowEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1 text-[11px]">
                    <Scale className="size-4" />
                    <strong>{load.weightKg.toLocaleString("de-DE")} kg</strong>
                  </span>
                  {load.palletCount != null ? (
                    <span className="rounded-md bg-surface-container px-2.5 py-1 text-[11px]">
                      <strong>{load.palletCount}</strong> pallets
                    </span>
                  ) : null}
                  <span className="rounded-md bg-surface-container px-2.5 py-1 text-[11px]">
                    {load.cargoDescription.slice(0, 40)}
                    {load.cargoDescription.length > 40 ? "…" : ""}
                  </span>
                  <span className="rounded-md bg-surface-high px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase">
                    {load.hazardous ? "ADR" : "No ADR"}
                  </span>
                </div>
              </div>

              {/* Rate box */}
              <div className="flex w-full shrink-0 flex-col justify-between gap-4 rounded-xl bg-surface-low p-4 xl:w-80">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Shipper Target Rate</span>
                    <span className="flex items-center gap-0.5 font-semibold text-success">
                      <Lock className="size-3.5" />
                      Escrow Protected
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold md:text-[32px] md:leading-10">
                        {target != null ? formatMoney(target) : "—"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        net
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between rounded-lg bg-card p-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-muted-foreground">
                        Current Lowest Bid
                      </span>
                      <span
                        className={cn(
                          "text-base font-bold",
                          load.lowestBid != null
                            ? "text-destructive"
                            : "text-foreground",
                        )}
                      >
                        {load.lowestBid != null
                          ? formatMoney(load.lowestBid)
                          : "No bids yet"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="size-2 rounded-full bg-primary" />
                        {load.offerCount} bids
                      </span>
                      {urgent ? (
                        <div className="flex items-center justify-end gap-0.5 text-[11px] font-semibold text-destructive">
                          <Timer className="size-3.5" />
                          Urgent
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {load.alreadyApplied ? (
                    <div className="flex h-11 items-center justify-center rounded-lg bg-success-container/50 text-sm font-bold text-success">
                      Bid submitted
                    </div>
                  ) : (
                    <ApplyButton
                      loadId={load.id}
                      defaultPrice={target}
                      routeLabel={route}
                      loadRef={ref}
                      label={
                        load.offerCount === 0 && target != null
                          ? `Submit First Bid @ ${formatMoney(target)}`
                          : "Place Bid / Counter Quote"
                      }
                    />
                  )}
                  <Link
                    href={`/c/loads`}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-card text-xs font-medium transition-colors hover:bg-surface-high"
                  >
                    <Eye className="size-[18px]" />
                    View on board
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-card p-4 shadow-sm sm:flex-row">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            Live Board Sync Active
          </span>
          <span className="h-3 w-px bg-outline" />
          <span>
            Showing <strong>{pageRows.length}</strong> of{" "}
            <strong>{filtered.length}</strong> available spot loads
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-9 items-center gap-1 rounded-lg bg-surface-low px-3 text-[11px] font-medium disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
            (n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "size-9 rounded-lg text-[11px] font-bold",
                  n === safePage
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "bg-surface-low hover:bg-surface-high",
                )}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-9 items-center gap-1 rounded-lg bg-surface-low px-3 text-[11px] font-medium disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Trust strip */}
      <div className="grid grid-cols-1 gap-4 py-1 md:grid-cols-3">
        {[
          {
            icon: Building2,
            title: "BaFin Regulated Escrow",
            body: "Shipper capital locked into segregated escrow on award. Discharge release on digital POD.",
          },
          {
            icon: Shield,
            title: "UN/ECE Geneva e-CMR",
            body: "Digital proof-of-delivery signatures across European jurisdictions.",
          },
          {
            icon: Zap,
            title: "EU Cabotage Compliant",
            body: "Tracking under Regulation (EC) 1072/2009 with audit-ready logs.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-2 rounded-xl bg-surface-low p-4"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
              <item.icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
