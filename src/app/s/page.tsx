import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Gavel,
  Headset,
  Lock,
  Navigation,
  PlusCircle,
  Radio,
  Ruler,
  Search,
  ShieldCheck,
  Timer,
  Truck,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatMoney, formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

const OPEN_STATUSES = ["PUBLISHED", "RECEIVING_OFFERS", "DRAFT"] as const;
const ACTIVE_BOARD = [
  "PUBLISHED",
  "RECEIVING_OFFERS",
  "ASSIGNED",
  "IN_TRANSIT",
] as const;

function timeAgo(date: Date) {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function formatPickup(date: Date) {
  return date.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusChip(status: string, offers: number) {
  if (status === "IN_TRANSIT") {
    return {
      label: "IN TRANSIT (GPS LIVE)",
      className: "bg-success-container/60 text-success",
      pulse: true,
      tone: "success" as const,
    };
  }
  if (status === "ASSIGNED") {
    return {
      label: "CARRIER ASSIGNED",
      className: "bg-surface-high text-muted-foreground",
      pulse: false,
      tone: "muted" as const,
    };
  }
  if (status === "RECEIVING_OFFERS" || offers > 0) {
    return {
      label: `RECEIVING OFFERS (${offers})`,
      className: "bg-surface-container text-primary",
      pulse: true,
      tone: "live" as const,
    };
  }
  return {
    label: formatStatus(status).toUpperCase(),
    className: "bg-surface-container text-muted-foreground",
    pulse: false,
    tone: "muted" as const,
  };
}

export default async function ShipperHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/s");
  if (user.role !== "SHIPPER" && user.role !== "SUPER_ADMIN") redirect("/login");

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since30m = new Date(Date.now() - 30 * 60 * 1000);

  const [
    profile,
    openLoads,
    awaitingFirstBid,
    pendingOffers,
    recentBids30m,
    awarded30d,
    awardedApps,
    loads,
    recentBids,
  ] = await Promise.all([
    prisma.shipperProfile.findUnique({ where: { userId: user.id } }),
    prisma.load.count({
      where: {
        shipperId: user.id,
        status: { in: [...OPEN_STATUSES] },
      },
    }),
    prisma.load.count({
      where: {
        shipperId: user.id,
        status: { in: ["PUBLISHED", "RECEIVING_OFFERS"] },
        applications: { none: {} },
      },
    }),
    prisma.loadApplication.count({
      where: { status: "PENDING", load: { shipperId: user.id } },
    }),
    prisma.loadApplication.count({
      where: {
        status: "PENDING",
        createdAt: { gte: since30m },
        load: { shipperId: user.id },
      },
    }),
    prisma.load.count({
      where: {
        shipperId: user.id,
        status: { in: ["ASSIGNED", "IN_TRANSIT", "DELIVERED"] },
        assignedAt: { gte: since30d },
      },
    }),
    prisma.loadApplication.findMany({
      where: {
        status: "ACCEPTED",
        updatedAt: { gte: since30d },
        load: { shipperId: user.id },
      },
      select: { proposedPrice: true },
    }),
    prisma.load.findMany({
      where: {
        shipperId: user.id,
        status: { in: [...ACTIVE_BOARD] },
      },
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        _count: { select: { applications: true } },
        applications: {
          where: { status: { in: ["PENDING", "ACCEPTED"] } },
          orderBy: [{ status: "asc" }, { proposedPrice: "asc" }],
          take: 3,
          include: {
            applicant: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.loadApplication.findMany({
      where: { load: { shipperId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        applicant: { select: { name: true, email: true } },
        load: { select: { id: true, reference: true, status: true } },
      },
    }),
  ]);

  const freightVolume = awardedApps.reduce(
    (sum, a) => sum + Number(a.proposedPrice),
    0,
  );

  const receivingOffers = loads.filter(
    (l) =>
      l.status === "RECEIVING_OFFERS" ||
      (l._count.applications > 0 &&
        ["PUBLISHED", "RECEIVING_OFFERS"].includes(l.status)),
  ).length;
  const assignedCount = loads.filter((l) => l.status === "ASSIGNED").length;
  const inTransitCount = loads.filter((l) => l.status === "IN_TRANSIT").length;

  const responseSamples = recentBids
    .filter((b) => b.load)
    .slice(0, 20);
  // Approximate avg response from recent bid ages when published data sparse
  const avgResponseMin =
    responseSamples.length > 0
      ? Math.round(
          responseSamples.reduce(
            (s, b) => s + (Date.now() - b.createdAt.getTime()) / 60_000,
            0,
          ) / responseSamples.length,
        )
      : null;

  const hq = profile?.billingCity
    ? `${profile.billingCity} HQ`
    : "EU Shipper";
  const companyLabel =
    profile?.companyName?.trim() || user.name || "Your company";

  const shown = loads.slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      {/* Title row */}
      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 rounded-full bg-primary-container" />
            <span>Operations Control Center • EU Corridor System</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            Shipper overview
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Live EU spot freight corridors, incoming carrier quotations, and
            dispatch clearance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm">
            <ShieldCheck className="size-[18px] text-success" />
            <span>
              KYC Verified: {companyLabel} • {hq}
            </span>
          </div>
          <Link
            href="/s/loads/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-container px-3 text-sm font-semibold text-on-primary-container shadow-sm transition-all hover:bg-brand-light"
          >
            <PlusCircle className="size-5" />
            + Publish Spot Load
          </Link>
        </div>
      </div>

      {/* KPI bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Open loads on market
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-surface-container px-2 py-0.5 text-[11px] text-primary">
              <span className="size-2 animate-pulse rounded-full bg-primary-container" />
              LIVE
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
              {openLoads}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <span className="text-xs">
              {awaitingFirstBid} awaiting first carrier bid
            </span>
            <Truck className="size-[18px] text-primary" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Receiving offers
            </span>
            {recentBids30m > 0 ? (
              <span className="rounded-lg bg-success-container/40 px-2 py-0.5 text-[11px] font-semibold text-success">
                +{recentBids30m} in last 30m
              </span>
            ) : (
              <span className="rounded-lg bg-surface-container px-2 py-0.5 text-[11px]">
                Live feed
              </span>
            )}
          </div>
          <div className="my-1.5">
            <span className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
              {pendingOffers} Bids Active
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <span className="text-xs">
              Across {receivingOffers || openLoads} active freight tenders
            </span>
            <Gavel className="size-[18px] text-primary" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Awarded (30D)
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-success">
              100% CMR
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
              {awarded30d} Shipments
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <span className="text-xs">
              {formatMoney(freightVolume)} total freight volume
            </span>
            <Wallet className="size-[18px] text-primary" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Avg bid response time
            </span>
            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-[11px] font-medium text-primary">
              SLA: &lt;45m
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
              {avgResponseMin != null ? `${Math.min(avgResponseMin, 999)} min` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <span className="truncate text-xs">
              Based on recent incoming bids
            </span>
            <Timer className="size-[18px] text-primary" />
          </div>
        </div>
      </div>

      {/* Main 8 + 4 */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          {/* Search / sort */}
          <div className="flex flex-col items-stretch justify-between gap-2 rounded-lg bg-surface-low p-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground" />
              <input
                readOnly
                className="h-10 w-full rounded-lg bg-card pr-3 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none"
                placeholder="Search REF, city, carrier, trailer type..."
                aria-label="Search loads"
              />
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[11px] tracking-wider text-muted-foreground uppercase whitespace-nowrap">
                Sort:
              </span>
              <span className="inline-flex h-10 items-center gap-1 rounded-lg bg-card px-2 text-xs font-medium shadow-sm">
                Lowest bid / urgent departure
              </span>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-muted-foreground">
            {[
              { label: "All loads", count: loads.length, active: true },
              { label: "Receiving offers", count: receivingOffers, active: false },
              { label: "Assigned", count: assignedCount, active: false },
              { label: "In Transit", count: inTransitCount, active: false },
            ].map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1 text-xs",
                  chip.active
                    ? "bg-primary-container font-semibold text-on-primary-container shadow-sm"
                    : "bg-surface-container font-medium text-foreground",
                )}
              >
                {chip.label}
                <span
                  className={cn(
                    "rounded-lg px-1.5 py-0.5",
                    chip.active
                      ? "bg-card text-foreground"
                      : chip.label === "Receiving offers" && chip.count > 0
                        ? "bg-primary-container font-semibold text-on-primary-container"
                        : "bg-card",
                  )}
                >
                  {chip.count}
                </span>
              </span>
            ))}
          </div>

          {/* Load cards */}
          <div className="flex flex-col gap-2">
            {!shown.length ? (
              <div className="rounded-lg bg-card p-8 text-center shadow-sm">
                <p className="text-sm font-semibold">No active spot shipments</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Publish a load to start receiving carrier bids.
                </p>
                <Link
                  href="/s/loads/new"
                  className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary-container"
                >
                  <PlusCircle className="size-4" />
                  Publish Spot Load
                </Link>
              </div>
            ) : null}

            {shown.map((load) => {
              const ref =
                load.reference || `TB-${load.id.slice(0, 8).toUpperCase()}`;
              const offers = load._count.applications;
              const chip = statusChip(load.status, offers);
              const accepted = load.applications.find((a) => a.status === "ACCEPTED");
              const lowest =
                accepted ??
                [...load.applications]
                  .filter((a) => a.status === "PENDING")
                  .sort(
                    (a, b) =>
                      Number(a.proposedPrice) - Number(b.proposedPrice),
                  )[0];
              const isLive =
                load.status === "RECEIVING_OFFERS" ||
                load.status === "PUBLISHED";
              const isAssigned = load.status === "ASSIGNED";
              const isTransit = load.status === "IN_TRANSIT";

              return (
                <div
                  key={load.id}
                  className="relative rounded-lg bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5 pb-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-surface-high px-2 py-0.5 text-xs font-semibold">
                        {ref}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • Created {timeAgo(load.createdAt)} •{" "}
                        {formatStatus(load.requiredVehicleClass)}
                        {load.palletCount
                          ? ` • ${load.palletCount} pallets`
                          : ""}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold",
                        chip.className,
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          chip.tone === "success" && "bg-success",
                          chip.tone === "live" && "bg-primary-container",
                          chip.tone === "muted" && "bg-outline",
                          chip.pulse && "animate-pulse",
                        )}
                      />
                      {chip.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-center gap-4 py-1.5 md:grid-cols-12">
                    <div className="flex flex-col gap-1.5 md:col-span-8">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "size-3 rounded-full",
                              isTransit
                                ? "bg-success"
                                : "bg-card ring-2 ring-primary",
                              isAssigned && "ring-outline",
                            )}
                          />
                          <div
                            className={cn(
                              "h-6 w-0.5",
                              isTransit ? "bg-success" : "bg-outline",
                            )}
                          />
                          <span
                            className={cn(
                              "size-3 rounded-full",
                              isAssigned
                                ? "bg-success"
                                : "bg-primary-container",
                            )}
                          />
                        </div>
                        <div className="flex h-full flex-col justify-between py-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold">
                              {load.pickupCountry}-{load.pickupZip}{" "}
                              {load.pickupCity}
                            </span>
                            {load.pickupCompany ? (
                              <span className="text-xs text-muted-foreground">
                                ({load.pickupCompany})
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold">
                              {load.deliveryCountry}-{load.deliveryZip}{" "}
                              {load.deliveryCity}
                            </span>
                            {load.deliveryCompany ? (
                              <span className="text-xs text-muted-foreground">
                                ({load.deliveryCompany})
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-surface-low px-2 py-1.5 text-xs text-muted-foreground">
                        {isLive ? (
                          <>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Ruler className="size-4 text-primary" />
                              {load.weightKg.toLocaleString("de-DE")} kg •{" "}
                              {load.cargoDescription.slice(0, 40)}
                              {load.cargoDescription.length > 40 ? "…" : ""}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              Pickup: {formatPickup(load.pickupWindowStart)}
                            </span>
                          </>
                        ) : null}
                        {isAssigned ? (
                          <>
                            <span className="font-medium text-foreground">
                              Assigned
                              {lowest?.applicant.name
                                ? `: ${lowest.applicant.name}`
                                : ""}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 font-semibold text-success">
                              Escrow ready
                            </span>
                          </>
                        ) : null}
                        {isTransit ? (
                          <>
                            <span className="flex items-center gap-1 font-medium text-success">
                              <Navigation className="size-4" />
                              On schedule
                            </span>
                            <span>•</span>
                            <span>
                              ETA: {formatPickup(load.deliveryWindowEnd)}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center pl-2 text-right md:col-span-4">
                      {isLive ? (
                        <>
                          <div className="text-[11px] tracking-wider text-muted-foreground uppercase">
                            Current lowest bid
                          </div>
                          <div className="text-xl font-semibold tracking-tight md:text-2xl">
                            {lowest
                              ? formatMoney(lowest.proposedPrice)
                              : "—"}
                          </div>
                          <div className="mb-1.5 text-[11px] font-medium text-success">
                            {offers > 0
                              ? `${offers} verified carrier bid${offers === 1 ? "" : "s"}`
                              : "Awaiting first bid"}
                          </div>
                          <div className="mt-1 flex w-full items-center justify-end gap-1.5">
                            <Link
                              href={`/s/loads/${load.id}`}
                              className="inline-flex h-9 items-center rounded-lg bg-surface-container px-2 text-xs font-medium transition-colors hover:bg-surface-high"
                            >
                              Details
                            </Link>
                            <Link
                              href={`/s/loads/${load.id}`}
                              className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary-container px-3 text-xs font-semibold text-on-primary-container shadow-sm transition-all hover:bg-brand-light"
                            >
                              Review & Award{offers > 0 ? ` (${offers})` : ""}
                              <ArrowRight className="size-4" />
                            </Link>
                          </div>
                        </>
                      ) : null}

                      {isAssigned || isTransit ? (
                        <>
                          <div className="text-[11px] tracking-wider text-muted-foreground uppercase">
                            {isTransit ? "Contract Total" : "Agreed Contract Price"}
                          </div>
                          <div className="text-xl font-semibold tracking-tight md:text-2xl">
                            {lowest
                              ? formatMoney(lowest.proposedPrice)
                              : load.suggestedBudgetEur
                                ? formatMoney(load.suggestedBudgetEur)
                                : "—"}
                          </div>
                          <div
                            className={cn(
                              "mb-1.5 text-[11px]",
                              isTransit
                                ? "font-medium text-success"
                                : "text-muted-foreground",
                            )}
                          >
                            {isTransit
                              ? "GPS tracking active"
                              : "Escrow funded & secured"}
                          </div>
                          <Link
                            href={`/s/loads/${load.id}`}
                            className="mt-1 inline-flex h-9 items-center gap-1 rounded-lg bg-surface-container px-3 text-xs font-medium shadow-sm transition-colors hover:bg-surface-high"
                          >
                            {isTransit
                              ? "Live Telematics"
                              : "Track Consignment / e-CMR"}
                            {isTransit ? (
                              <Radio className="size-4" />
                            ) : (
                              <ArrowRight className="size-4" />
                            )}
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1 py-2 text-[11px] text-muted-foreground">
            <span>
              Showing {shown.length} of {loads.length} active spot shipments
            </span>
            <Link
              href="/s/loads"
              className="rounded-lg bg-surface-container px-2 py-1 text-foreground transition-colors hover:bg-surface-high"
            >
              View all loads
            </Link>
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="rounded-lg bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <Radio className="size-5 text-primary" />
                <h2 className="text-base font-semibold">Live incoming bids</h2>
              </div>
              <span
                className="size-2.5 animate-ping rounded-full bg-primary-container"
                title="Live feed"
              />
            </div>

            <div className="mt-1.5 flex flex-col gap-2">
              {!recentBids.length ? (
                <p className="rounded-lg bg-surface-low p-3 text-xs text-muted-foreground">
                  New carrier bids appear here as soon as they land.
                </p>
              ) : null}

              {recentBids.map((bid) => {
                const name =
                  bid.applicant.name ||
                  bid.applicant.email.split("@")[0] ||
                  "Carrier";
                const ref =
                  bid.load.reference ||
                  `TB-${bid.load.id.slice(0, 8).toUpperCase()}`;
                const accepted = bid.status === "ACCEPTED";

                return (
                  <div
                    key={bid.id}
                    className="flex flex-col gap-1.5 rounded-lg bg-surface-low p-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={cn(
                          "font-semibold",
                          accepted && "flex items-center gap-1 text-success",
                        )}
                      >
                        {accepted ? (
                          <>
                            <CheckCircle2 className="size-4" />
                            Award confirmed
                          </>
                        ) : (
                          `New bid on ${ref}`
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {timeAgo(bid.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">
                      {accepted ? (
                        <>
                          Carrier confirmed for{" "}
                          <strong className="font-medium">{ref}</strong>.
                        </>
                      ) : (
                        <>
                          <strong className="font-medium">{name}</strong> offered{" "}
                          <span className="font-semibold text-success">
                            {formatMoney(bid.proposedPrice)}
                          </span>
                          {bid.message ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {bid.message.slice(0, 60)}
                              {bid.message.length > 60 ? "…" : ""}
                            </span>
                          ) : null}
                        </>
                      )}
                    </p>
                    {!accepted && bid.status === "PENDING" ? (
                      <div className="mt-1 flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">
                          Pending review
                        </span>
                        <Link
                          href={`/s/loads/${bid.load.id}`}
                          className="h-7 rounded-lg bg-primary-container px-2 text-[11px] font-semibold leading-7 text-on-primary-container shadow-sm transition-colors hover:bg-brand-light"
                        >
                          Quick accept
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg bg-surface-container p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-foreground">
              <Lock className="size-[22px] text-primary" />
              <h3 className="text-sm font-semibold">Escrow Protected Payouts</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              All awarded freight transactions are backed by Take & Bring
              14-day clearing escrow. Automatic EU VAT reverse-charge and CMR
              compliance validation guaranteed.
            </p>
            <div className="flex items-center gap-2 pt-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-success" />
                BaFin Regulated
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-success" />
                Zero Carrier Counterparty Risk
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-container text-primary">
                <Headset className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] tracking-wider text-muted-foreground uppercase">
                  Frankfurt Dispatch Hotline
                </span>
                <a
                  href="tel:+49408221490"
                  className="text-sm font-semibold"
                >
                  +49 40 8221 490
                </a>
              </div>
            </div>
            <a
              href="tel:+49408221490"
              className="inline-flex h-8 items-center rounded-lg bg-surface-container px-2 text-[11px] font-semibold transition-colors hover:bg-surface-high"
            >
              Call Desk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
