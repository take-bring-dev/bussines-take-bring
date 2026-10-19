"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Gavel,
  LayoutList,
  Lock,
  MapPin,
  Navigation,
  PlusCircle,
  Radio,
  Route,
  Scale,
  Search,
  ShieldCheck,
  TableProperties,
  Timer,
  Truck,
} from "lucide-react";
import { formatMoney, formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ShipperLoadCard = {
  id: string;
  reference: string | null;
  status: string;
  pickupCity: string;
  pickupZip: string;
  pickupCountry: string;
  pickupCompany: string | null;
  pickupStreet: string;
  pickupWindowStart: string;
  deliveryCity: string;
  deliveryZip: string;
  deliveryCountry: string;
  deliveryCompany: string | null;
  deliveryStreet: string;
  deliveryWindowEnd: string;
  cargoDescription: string;
  weightKg: number;
  palletCount: number | null;
  hazardous: boolean;
  requiredVehicleClass: string;
  suggestedBudgetEur: string | null;
  createdAt: string;
  publishedAt: string | null;
  offerCount: number;
  lowestBid: number | null;
  lowestBidder: string | null;
  acceptedPrice: number | null;
  acceptedCarrier: string | null;
};

type FilterKey = "all" | "bidding" | "award" | "assigned" | "transit";
type SortKey = "urgency" | "lowest" | "offers" | "created";

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

function isBidding(l: ShipperLoadCard) {
  return (
    l.status === "PUBLISHED" ||
    l.status === "RECEIVING_OFFERS" ||
    (l.offerCount > 0 && !["ASSIGNED", "IN_TRANSIT", "DELIVERED"].includes(l.status))
  );
}

function matchesFilter(l: ShipperLoadCard, filter: FilterKey) {
  switch (filter) {
    case "bidding":
      return isBidding(l) && l.offerCount === 0;
    case "award":
      return isBidding(l) && l.offerCount > 0;
    case "assigned":
      return l.status === "ASSIGNED" || l.status === "OFFER_SELECTED";
    case "transit":
      return l.status === "IN_TRANSIT";
    default:
      return true;
  }
}

function statusMeta(l: ShipperLoadCard) {
  if (l.status === "IN_TRANSIT") {
    return {
      label: "IN TRANSIT (GPS LIVE)",
      bar: "bg-brand-light",
      chip: "bg-primary-container/40 text-on-primary-container",
      live: true,
    };
  }
  if (l.status === "ASSIGNED" || l.status === "OFFER_SELECTED") {
    return {
      label: "CARRIER ASSIGNED",
      bar: "bg-success",
      chip: "bg-success-container/50 text-success",
      live: false,
    };
  }
  if (l.offerCount > 0) {
    return {
      label: `RECEIVING OFFERS (${l.offerCount} BIDS)`,
      bar: "bg-primary-container",
      chip: "bg-primary-container/30 text-on-primary-container",
      live: true,
    };
  }
  if (l.status === "PUBLISHED" || l.status === "RECEIVING_OFFERS") {
    return {
      label: "BROADCASTING TO CARRIERS",
      bar: "bg-outline",
      chip: "bg-surface-high text-muted-foreground",
      live: true,
    };
  }
  return {
    label: formatStatus(l.status).toUpperCase(),
    bar: "bg-outline",
    chip: "bg-surface-high text-muted-foreground",
    live: false,
  };
}

const PAGE_SIZE = 5;

export function ShipperMyLoads({ loads }: { loads: ShipperLoadCard[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("urgency");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"cards" | "dense">("cards");

  const counts = useMemo(() => {
    return {
      all: loads.length,
      bidding: loads.filter((l) => matchesFilter(l, "bidding")).length,
      award: loads.filter((l) => matchesFilter(l, "award")).length,
      assigned: loads.filter((l) => matchesFilter(l, "assigned")).length,
      transit: loads.filter((l) => matchesFilter(l, "transit")).length,
    };
  }, [loads]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = loads.filter((l) => matchesFilter(l, filter));
    if (query) {
      rows = rows.filter((l) => {
        const hay = [
          l.reference,
          l.id,
          l.pickupCity,
          l.deliveryCity,
          l.pickupZip,
          l.deliveryZip,
          l.cargoDescription,
          l.lowestBidder,
          l.acceptedCarrier,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }
    rows = [...rows].sort((a, b) => {
      if (sort === "lowest") {
        const av = a.lowestBid ?? a.acceptedPrice ?? Number.POSITIVE_INFINITY;
        const bv = b.lowestBid ?? b.acceptedPrice ?? Number.POSITIVE_INFINITY;
        return av - bv;
      }
      if (sort === "offers") return b.offerCount - a.offerCount;
      if (sort === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // urgency: earliest pickup
      return (
        new Date(a.pickupWindowStart).getTime() -
        new Date(b.pickupWindowStart).getTime()
      );
    });
    return rows;
  }, [loads, filter, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function exportCsv() {
    const header = [
      "reference",
      "status",
      "pickup",
      "delivery",
      "weightKg",
      "offers",
      "lowestBid",
      "acceptedPrice",
    ];
    const lines = [
      header.join(","),
      ...filtered.map((l) =>
        [
          l.reference || l.id,
          l.status,
          `${l.pickupCountry}-${l.pickupZip} ${l.pickupCity}`,
          `${l.deliveryCountry}-${l.deliveryZip} ${l.deliveryCity}`,
          l.weightKg,
          l.offerCount,
          l.lowestBid ?? "",
          l.acceptedPrice ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `take-bring-loads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pills: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All Loads", count: counts.all },
    { key: "bidding", label: "Open for Bidding", count: counts.bidding },
    { key: "award", label: "Award Pending", count: counts.award },
    { key: "assigned", label: "Assigned", count: counts.assigned },
    { key: "transit", label: "In Transit", count: counts.transit },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar actions (export + publish live in page header too) */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-card px-3 text-sm font-medium shadow-sm transition-all hover:bg-surface-container"
        >
          <Download className="size-[18px] text-muted-foreground" />
          Export Manifest (CSV)
        </button>
        <Link
          href="/s/loads/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-container px-3 text-sm font-semibold text-on-primary-container shadow-sm transition-all hover:bg-brand-light"
        >
          <PlusCircle className="size-[18px]" />
          Publish New Spot Load
        </Link>
      </div>

      {/* Filter & search */}
      <div className="flex flex-col gap-4 rounded-lg bg-card p-4 shadow-sm">
        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <div className="relative w-full md:w-96">
            <Search className="absolute top-2.5 left-3 size-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg bg-surface-low pr-4 pl-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-primary"
              placeholder="Search by Load REF, city, postal code, commodity..."
              type="search"
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end">
            <div className="flex items-center gap-1 rounded-lg bg-surface-low p-1">
              <button
                type="button"
                onClick={() => setView("cards")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold",
                  view === "cards"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutList className="size-4" />
                <span className="hidden sm:inline">Cards View</span>
              </button>
              <button
                type="button"
                onClick={() => setView("dense")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium",
                  view === "dense"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TableProperties className="size-4" />
                <span className="hidden sm:inline">Dense Grid</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                className="h-10 cursor-pointer rounded-lg bg-surface-low px-3 text-xs outline-none"
              >
                <option value="urgency">Urgency / Earliest Pickup</option>
                <option value="lowest">Lowest Bid Amount</option>
                <option value="offers">Most Offers Pending</option>
                <option value="created">Recently Created</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="mr-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Status:
          </span>
          {pills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setFilter(p.key);
                setPage(1);
              }}
              className={cn(
                "flex h-7 items-center gap-1 rounded-full px-3 text-[11px] transition-colors",
                filter === p.key
                  ? "bg-primary-container font-bold text-on-primary-container shadow-sm"
                  : "bg-surface-low font-medium text-muted-foreground hover:bg-surface-container",
              )}
            >
              <span>{p.label}</span>
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
      </div>

      {/* Cards */}
      <div className={cn("flex flex-col gap-4", view === "dense" && "gap-2")}>
        {!pageRows.length ? (
          <div className="rounded-lg bg-card p-10 text-center shadow-sm">
            <p className="text-sm font-semibold">No consignments match this filter</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish a spot load or clear filters to see your board.
            </p>
            <Link
              href="/s/loads/new"
              className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary-container"
            >
              <PlusCircle className="size-4" />
              Publish New Spot Load
            </Link>
          </div>
        ) : null}

        {pageRows.map((load) => {
          const meta = statusMeta(load);
          const ref =
            load.reference || `TB-${load.id.slice(0, 8).toUpperCase()}`;
          const isAssigned =
            load.status === "ASSIGNED" || load.status === "OFFER_SELECTED";
          const isTransit = load.status === "IN_TRANSIT";
          const isOpen = !isAssigned && !isTransit;
          const target = load.suggestedBudgetEur
            ? Number(load.suggestedBudgetEur)
            : null;
          const bid = load.lowestBid;
          const delta =
            target != null && bid != null ? bid - target : null;

          return (
            <article
              key={load.id}
              className={cn(
                "relative flex flex-col items-stretch justify-between gap-6 overflow-hidden rounded-lg bg-card shadow-sm transition-all hover:shadow-md lg:flex-row",
                view === "dense" ? "p-4" : "p-6",
              )}
            >
              <div className={cn("absolute top-0 bottom-0 left-0 w-1.5", meta.bar)} />

              <div className="flex flex-1 flex-col justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-[11px] font-bold">
                    {ref}
                  </span>
                  <span className="rounded bg-surface-low px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {formatStatus(load.requiredVehicleClass)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      meta.chip,
                    )}
                  >
                    {meta.live ? (
                      <span className="size-2 animate-ping rounded-full bg-primary" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    {meta.label}
                  </span>
                  {isAssigned ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-success">
                      <Lock className="size-3.5" /> Escrow Secured
                    </span>
                  ) : null}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    Created {timeAgo(load.createdAt)}
                  </span>
                </div>

                {!isTransit ? (
                  <div className="grid grid-cols-1 gap-4 rounded-lg bg-surface-low/50 p-4 md:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                        <Radio className="size-[18px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold">
                          {load.pickupCountry}-{load.pickupZip} {load.pickupCity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {load.pickupCompany || load.pickupStreet}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <Timer className="size-3.5" />
                          Pickup: {formatWhen(load.pickupWindowStart)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-success">
                        <MapPin className="size-[18px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold">
                          {load.deliveryCountry}-{load.deliveryZip}{" "}
                          {load.deliveryCity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {load.deliveryCompany || load.deliveryStreet}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-success">
                          <Calendar className="size-3.5" />
                          Delivery: {formatWhen(load.deliveryWindowEnd)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 rounded-lg bg-surface-low/60 p-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold">
                        {load.pickupCountry}-{load.pickupZip} {load.pickupCity}
                      </span>
                      <span className="font-mono font-bold">
                        {load.deliveryCountry}-{load.deliveryZip}{" "}
                        {load.deliveryCity}
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-high">
                      <div className="h-2.5 rounded-full bg-primary" style={{ width: "55%" }} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">In transit · GPS live</span>
                      <span className="flex items-center gap-1 font-semibold text-success">
                        <Timer className="size-3.5" />
                        ETA: {formatWhen(load.deliveryWindowEnd)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Scale className="size-4" />
                    {load.weightKg.toLocaleString("de-DE")} kg
                  </span>
                  {load.palletCount ? (
                    <span className="flex items-center gap-1">
                      <LayoutList className="size-4" />
                      {load.palletCount} pallets
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <FileText className="size-4" />
                    {load.cargoDescription.slice(0, 48)}
                    {load.cargoDescription.length > 48 ? "…" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-4" />
                    ADR: {load.hazardous ? "Yes" : "None"}
                  </span>
                  {isAssigned ? (
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <CheckCircle2 className="size-4 text-success" />
                      {load.acceptedCarrier
                        ? `Assigned: ${load.acceptedCarrier}`
                        : "e-CMR ready"}
                    </span>
                  ) : null}
                  {isOpen && load.offerCount === 0 ? (
                    <span className="flex items-center gap-1">
                      <Route className="size-4" />0 bids · matching carriers
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Commercial box */}
              <div className="flex w-full shrink-0 flex-col justify-between rounded-lg bg-surface-low p-4 lg:w-80">
                {isOpen ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      {target != null ? (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Target Benchmark Rate</span>
                          <span className="font-mono line-through">
                            {formatMoney(target)}
                          </span>
                        </div>
                      ) : null}
                      {bid != null ? (
                        <div className="flex flex-col gap-1 rounded-lg bg-card p-2 shadow-sm">
                          <span className="text-[11px] font-semibold tracking-wider text-success uppercase">
                            Lowest Active Bid
                          </span>
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono text-xl font-bold">
                              {formatMoney(bid)}
                            </span>
                            {delta != null ? (
                              <span className="rounded bg-success-container px-1.5 py-0.5 text-[11px] font-bold text-success">
                                {delta <= 0 ? "" : "+"}
                                {formatMoney(delta)}
                              </span>
                            ) : null}
                          </div>
                          {load.lowestBidder ? (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {load.lowestBidder}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Target Indication
                          </span>
                          <span className="font-mono text-xl font-bold">
                            {target != null ? formatMoney(target) : "—"}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Carriers are reviewing your corridor specs.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5">
                      <Link
                        href={`/s/loads/${load.id}`}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 text-sm font-bold text-on-primary-container shadow-sm transition-all hover:bg-brand-light"
                      >
                        {load.offerCount > 0
                          ? `Review & Award Bids (${load.offerCount})`
                          : "Open Load Details"}
                        <ArrowRight className="size-[18px]" />
                      </Link>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Link
                          href={`/s/loads/${load.id}`}
                          className="inline-flex h-8 items-center justify-center rounded bg-surface-container text-xs font-medium transition-colors hover:bg-surface-high"
                        >
                          Load Details
                        </Link>
                        <Link
                          href={`/s/loads/new`}
                          className="inline-flex h-8 items-center justify-center rounded bg-surface-container text-xs font-medium transition-colors hover:bg-surface-high"
                        >
                          New Similar
                        </Link>
                      </div>
                    </div>
                  </>
                ) : null}

                {isAssigned || isTransit ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {isTransit ? "Contract Total Value" : "Contracted Fixed Rate"}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xl font-bold">
                          {load.acceptedPrice != null
                            ? formatMoney(load.acceptedPrice)
                            : target != null
                              ? formatMoney(target)
                              : "—"}
                        </span>
                        <span className="text-[11px] font-semibold text-success">
                          {isTransit
                            ? "Escrow Payout On Delivery"
                            : "Locked in Escrow"}
                        </span>
                      </div>
                      {!isTransit ? (
                        <div className="mt-1 flex items-center gap-1.5 rounded bg-success-container/30 px-2 py-1 text-[11px] text-success">
                          <Truck className="size-4" />
                          Loading bay / dispatch ready
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5">
                      <Link
                        href={`/s/loads/${load.id}`}
                        className={cn(
                          "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold shadow-sm transition-all",
                          isTransit
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "bg-card text-foreground hover:bg-surface-container",
                        )}
                      >
                        {isTransit ? (
                          <>
                            <Radio className="size-[18px]" />
                            Live Telematics & Geofence
                          </>
                        ) : (
                          <>
                            <FileText className="size-[18px] text-success" />
                            Track Consignment & e-CMR
                          </>
                        )}
                      </Link>
                      <Link
                        href={`/s/loads/${load.id}`}
                        className="inline-flex h-8 w-full items-center justify-center gap-1 rounded bg-surface-container text-xs font-medium transition-colors hover:bg-surface-high"
                      >
                        {isTransit ? "View Waybill" : "Carrier Contact"}
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-1 flex flex-col items-center justify-between gap-4 rounded-lg bg-card p-4 shadow-sm sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{pageRows.length}</strong> of{" "}
            <strong className="text-foreground">{filtered.length}</strong> consignments
          </span>
          <span className="text-outline">•</span>
          <span className="font-mono text-[12px]">
            Page {safePage} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-9 items-center gap-1 rounded-lg bg-surface-low px-3 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-[18px]" />
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 5)
            .map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "size-9 rounded-lg text-xs font-bold",
                  n === safePage
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "bg-surface-low text-foreground hover:bg-surface-container",
                )}
              >
                {n}
              </button>
            ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-9 items-center gap-1 rounded-lg bg-surface-low px-3 text-xs transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            Next
            <ChevronRight className="size-[18px]" />
          </button>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-low px-4 py-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-success" />
            EU Cabotage Regulation Compliant (EC 1072/2009)
          </span>
          <span className="hidden text-outline md:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Gavel className="size-4 text-success" />
            Escrow Backed by BaFin Guidelines
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" />
          <span>Frankfurt Cloud Dispatch Sync Active</span>
          <Navigation className="size-3.5 opacity-50" />
        </div>
      </div>
    </div>
  );
}
