import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Headset,
  MapPin,
  Package,
  Pencil,
  Route,
  ShieldCheck,
  Timer,
  Trash2,
  Truck,
} from "lucide-react";
import { AcceptOfferButton } from "@/components/loads/accept-offer-button";
import { EscrowPanel } from "@/components/loads/escrow-panel";
import { RejectOfferButton } from "@/components/loads/reject-offer-button";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { isStripeMock } from "@/lib/stripe";
import { formatMoney, formatStatus, formatWindow } from "@/lib/format";
import { cn } from "@/lib/utils";

function timeAgo(date: Date) {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "C"
  );
}

export default async function ShipperLoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const load = await prisma.load.findUnique({
    where: { id },
    include: {
      escrow: true,
      applications: {
        orderBy: { proposedPrice: "asc" },
        include: {
          applicant: { select: { name: true, email: true, role: true } },
          vehicle: {
            select: {
              plateNumber: true,
              label: true,
              vehicleClass: true,
            },
          },
          driver: { select: { fullName: true } },
        },
      },
    },
  });

  if (!load || (load.shipperId !== user.id && user.role !== "SUPER_ADMIN")) {
    notFound();
  }

  const ref = load.reference || `TB-${load.id.slice(0, 8).toUpperCase()}`;
  const pending = load.applications.filter((a) => a.status === "PENDING");
  const accepted = load.applications.find((a) => a.status === "ACCEPTED");
  const ranked = [...load.applications].sort((a, b) => {
    const rank = (s: string) =>
      s === "PENDING" ? 0 : s === "ACCEPTED" ? 1 : 2;
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return Number(a.proposedPrice) - Number(b.proposedPrice);
  });
  const lowest = pending[0] ?? accepted;
  const target = load.suggestedBudgetEur
    ? Number(load.suggestedBudgetEur)
    : null;
  const lowestPrice = lowest ? Number(lowest.proposedPrice) : null;
  const delta =
    target != null && lowestPrice != null ? lowestPrice - target : null;
  const canAward =
    !["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"].includes(load.status);
  const isReceiving =
    load.status === "RECEIVING_OFFERS" ||
    load.status === "PUBLISHED" ||
    pending.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Hero */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <nav className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/s" className="hover:underline">
              Operations Center
            </Link>
            <span>›</span>
            <Link href="/s/loads" className="hover:underline">
              Marketplace Loads
            </Link>
            <span>›</span>
            <span className="font-mono font-semibold text-foreground">{ref}</span>
            <span>›</span>
            <span className="font-medium text-primary">Offers & Spot Bids</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight">
              {ref}
            </h1>
            {isReceiving && canAward ? (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-success-container/40 px-2.5 py-0.5 text-xs font-bold text-success">
                <span className="size-2 animate-ping rounded-full bg-success" />
                RECEIVING OFFERS ({pending.length} ACTIVE)
              </span>
            ) : (
              <span className="rounded-full border border-border bg-surface-low px-2.5 py-0.5 text-xs font-bold">
                {formatStatus(load.status)}
              </span>
            )}
            <span className="rounded border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {formatStatus(load.requiredVehicleClass)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {load.pickupCity} ({load.pickupCountry}) to {load.deliveryCity} (
            {load.deliveryCountry}) • BaFin escrow reserve •{" "}
            {load.weightKg.toLocaleString("de-DE")} kg
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/s/loads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-surface-low"
          >
            <ArrowLeft className="size-4" />
            Back to My Loads
          </Link>
          <Link
            href="/s/loads/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors hover:bg-surface-low"
          >
            <Pencil className="size-4 text-muted-foreground" />
            New Similar
          </Link>
          {canAward ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-destructive bg-error-container px-3.5 py-2 text-xs font-semibold text-destructive opacity-60">
              <Trash2 className="size-4" />
              Withdraw (soon)
            </span>
          ) : null}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Lowest Competitive Bid
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold">
                {lowestPrice != null ? formatMoney(lowestPrice) : "—"}
              </span>
              {delta != null ? (
                <span className="rounded bg-success-container px-1.5 py-0.5 font-mono text-xs font-bold text-success">
                  {delta <= 0 ? "" : "+"}
                  {formatMoney(delta)}
                </span>
              ) : null}
            </div>
            {target != null ? (
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Target:{" "}
                <span className="font-mono line-through">
                  {formatMoney(target)}
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex size-9 items-center justify-center rounded border border-border bg-success-container/40 text-primary">
            <Truck className="size-4" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Total Carrier Offers
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold">
                {load.applications.length}
              </span>
              <span className="text-xs font-semibold text-success">
                {pending.length} pending
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Verified fleets on this corridor
            </p>
          </div>
          <div className="flex size-9 items-center justify-center rounded border border-border bg-surface-low text-muted-foreground">
            <Package className="size-4" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Pickup Window
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                {formatWindow(load.pickupWindowStart, load.pickupWindowEnd)}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium text-success">
              Award one carrier to lock dispatch
            </p>
          </div>
          <div className="flex size-9 items-center justify-center rounded border border-border bg-surface-low text-primary">
            <Timer className="size-4" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-low p-3.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" />
              <p className="text-[11px] font-bold tracking-wider uppercase">
                Escrow Reserve
              </p>
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-bold">
                {target != null
                  ? formatMoney(target)
                  : lowestPrice != null
                    ? formatMoney(lowestPrice)
                    : "—"}
              </span>
              <span className="text-[10px] font-semibold text-success">
                {accepted ? "Locked" : "Target"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Segregated trust • payout on POD
            </p>
          </div>
          <span className="rounded border border-border bg-card px-2 py-1 text-xs font-bold text-success">
            {accepted ? "FUNDED" : "READY"}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Offers */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card p-3.5 shadow-sm sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <span>Carrier Quotations & Spot Bids</span>
                <span className="rounded bg-primary-container px-2 py-0.5 text-xs font-bold text-on-primary-container">
                  {load.applications.length} RECEIVED
                </span>
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Ranked by lowest rate. Accepting an offer binds the digital
                contract and rejects other pending bids.
              </p>
            </div>
          </div>

          {!ranked.length ? (
            <div className="rounded-lg border border-border bg-card px-6 py-10 text-center shadow-sm">
              <p className="text-sm font-semibold">No offers yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Carriers see this load on their live marketplace board.
              </p>
            </div>
          ) : null}

          {ranked.map((o, index) => {
            const name = o.applicant.name || o.applicant.email;
            const price = Number(o.proposedPrice);
            const priceLabel = formatMoney(price, o.currency);
            const isBest =
              o.status === "PENDING" &&
              pending[0]?.id === o.id &&
              index === ranked.findIndex((r) => r.status === "PENDING");
            const bidDelta = target != null ? price - target : null;
            const vehicleLabel = o.vehicle
              ? o.vehicle.label || formatStatus(o.vehicle.vehicleClass)
              : formatStatus(load.requiredVehicleClass);
            const canAct = o.status === "PENDING" && canAward;

            return (
              <article
                key={o.id}
                className={cn(
                  "relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
                  isBest
                    ? "border-2 border-primary-container"
                    : "border-border",
                  o.status === "REJECTED" && "opacity-60",
                  o.status === "ACCEPTED" && "border-2 border-success",
                )}
              >
                {isBest ? (
                  <div className="absolute top-0 right-0 rounded-bl bg-primary-container px-3 py-0.5 text-[10px] font-bold tracking-wider text-on-primary-container uppercase">
                    Lowest Bid · Best Match
                  </div>
                ) : null}
                {o.status === "ACCEPTED" ? (
                  <div className="absolute top-0 right-0 rounded-bl bg-success px-3 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                    Awarded
                  </div>
                ) : null}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground">
                        {initials(name || "C")}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold">{name}</h3>
                          <span className="rounded border border-border bg-success-container/40 px-1.5 text-[10px] font-bold text-success">
                            ✓ VERIFIED
                          </span>
                          <span className="rounded bg-surface-low px-1.5 text-[10px] font-semibold text-muted-foreground">
                            {formatStatus(o.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {formatStatus(o.applicantType)}
                          </span>
                          {o.message ? (
                            <>
                              <span>•</span>
                              <span className="max-w-xs truncate">
                                {o.message}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded border border-success-container/40 bg-surface p-2.5 text-xs">
                      <div>
                        <span className="block text-[10px] text-muted-foreground">
                          Vehicle
                        </span>
                        <span className="font-semibold">{vehicleLabel}</span>
                        {o.vehicle?.plateNumber ? (
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            Plate: {o.vehicle.plateNumber}
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <span className="block text-[10px] text-muted-foreground">
                          Driver / notes
                        </span>
                        <span className="font-semibold">
                          {o.driver?.fullName || "Fleet assignment TBD"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <span className="size-2 rounded-full bg-success" />
                        Pickup:{" "}
                        <strong>
                          {formatWindow(
                            load.pickupWindowStart,
                            load.pickupWindowEnd,
                          )}
                        </strong>
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <span className="size-2 rounded-full bg-destructive" />
                        Delivery:{" "}
                        <strong>
                          {formatWindow(
                            load.deliveryWindowStart,
                            load.deliveryWindowEnd,
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col justify-between border-t border-border pt-2 sm:w-48 sm:border-t-0 sm:pt-0 sm:text-right">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Spot Bid Price
                      </p>
                      <div className="mt-0.5 flex items-baseline gap-1.5 sm:justify-end">
                        <span className="font-mono text-2xl font-bold">
                          {priceLabel}
                        </span>
                      </div>
                      {bidDelta != null ? (
                        <div
                          className={cn(
                            "flex items-center gap-1 font-mono text-[11px] font-bold sm:justify-end",
                            bidDelta <= 0 ? "text-success" : "text-destructive",
                          )}
                        >
                          <span>
                            {bidDelta <= 0 ? "" : "+"}
                            {formatMoney(bidDelta)}
                          </span>
                          {target != null && target > 0 ? (
                            <span className="text-muted-foreground">
                              vs target
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Bid received {timeAgo(o.createdAt)}
                      </p>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {canAct ? (
                        <>
                          <AcceptOfferButton
                            loadId={load.id}
                            applicationId={o.id}
                            carrierName={name || undefined}
                            priceLabel={priceLabel}
                            variant={isBest ? "stitch" : "outline"}
                          />
                          <div className="flex gap-2">
                            <RejectOfferButton
                              loadId={load.id}
                              applicationId={o.id}
                            />
                            <span className="w-1/2 rounded border border-border bg-surface-low py-1 text-center text-[11px] font-semibold text-muted-foreground opacity-60">
                              Chat
                            </span>
                          </div>
                        </>
                      ) : o.status === "ACCEPTED" ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-md bg-success-container/50 py-2.5 text-xs font-bold text-success">
                          <CheckCircle2 className="size-4" />
                          Contract awarded
                        </div>
                      ) : (
                        <div className="rounded-md border border-border bg-surface-low py-2.5 text-center text-xs font-semibold text-muted-foreground">
                          {formatStatus(o.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right rail */}
        <div className="space-y-4 lg:col-span-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-primary" />
                <h3 className="text-xs font-bold tracking-wider uppercase">
                  Route & Waypoint Corridor
                </h3>
              </div>
              <span className="rounded border border-border bg-success-container/40 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                {load.pickupCountry} → {load.deliveryCountry}
              </span>
            </div>

            <div className="space-y-4 rounded-lg border border-success-container/30 bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-xs font-bold text-white">
                  A
                </span>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">
                      {load.pickupCountry}-{load.pickupZip} {load.pickupCity}
                    </span>
                    <span className="rounded border border-border bg-card px-1.5 font-mono text-[10px] font-bold text-muted-foreground">
                      {load.pickupCountry}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {load.pickupCompany || load.pickupStreet}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span>
                      Pickup:{" "}
                      <strong>
                        {formatWindow(
                          load.pickupWindowStart,
                          load.pickupWindowEnd,
                        )}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-3">
                <div className="ml-2.5 h-6 w-0.5 bg-outline" />
                <MapPin className="size-3.5 text-muted-foreground" />
                <span className="font-mono text-[11px] text-muted-foreground">
                  Spot corridor transit
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                  B
                </span>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">
                      {load.deliveryCountry}-{load.deliveryZip}{" "}
                      {load.deliveryCity}
                    </span>
                    <span className="rounded border border-border bg-card px-1.5 font-mono text-[10px] font-bold text-muted-foreground">
                      {load.deliveryCountry}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {load.deliveryCompany || load.deliveryStreet}
                  </p>
                  <div className="mt-1 font-mono text-[11px]">
                    Delivery:{" "}
                    <strong>
                      {formatWindow(
                        load.deliveryWindowStart,
                        load.deliveryWindowEnd,
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <h3 className="text-xs font-bold tracking-wider uppercase">
                  Cargo & Vehicle Specifications
                </h3>
              </div>
              <span className="rounded border border-border bg-success-container/40 px-2 py-0.5 text-[10px] font-bold text-success">
                CMR COMPLIANT
              </span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                ["Commodity", load.cargoDescription],
                [
                  "Gross Weight",
                  `${load.weightKg.toLocaleString("de-DE")} kg`,
                ],
                [
                  "Pallets",
                  load.palletCount != null
                    ? `${load.palletCount} units`
                    : "—",
                ],
                ["Vehicle class", formatStatus(load.requiredVehicleClass)],
                [
                  "Hazardous (ADR)",
                  load.hazardous ? "Yes" : "None (standard freight)",
                ],
                [
                  "Temperature",
                  load.temperatureControl ? "Controlled" : "Ambient",
                ],
                [
                  "Target budget",
                  target != null ? formatMoney(target) : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-surface-low py-1 last:border-0"
                >
                  <span>{label}:</span>
                  <strong className="max-w-[60%] text-right text-foreground">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <EscrowPanel
            loadId={load.id}
            reference={ref}
            fallbackAmount={
              accepted
                ? Number(accepted.proposedPrice)
                : target != null
                  ? target
                  : null
            }
            fallbackCurrency={accepted?.currency ?? "EUR"}
            escrow={
              load.escrow
                ? {
                    id: load.escrow.id,
                    status: load.escrow.status,
                    amount: Number(load.escrow.amount),
                    currency: load.escrow.currency,
                    mock: load.escrow.mock || isStripeMock(),
                    authorizedAt: load.escrow.authorizedAt?.toISOString() ?? null,
                    capturedAt: load.escrow.capturedAt?.toISOString() ?? null,
                    stripePaymentIntentId: load.escrow.stripePaymentIntentId,
                  }
                : null
            }
          />

          <div className="flex items-center justify-between rounded-lg border border-success-container/40 bg-surface p-4 text-xs">
            <div>
              <p className="font-bold">Frankfurt Dispatch Compliance Desk</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                Hotline: +49 40 8221 490
              </p>
            </div>
            <a
              href="tel:+49408221490"
              className="inline-flex items-center gap-1 rounded border border-border bg-card px-3 py-1.5 text-xs font-bold transition-colors hover:bg-surface-low"
            >
              <Headset className="size-3.5" />
              Call Desk
            </a>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-surface-low px-3 py-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            Award binds escrow and rejects remaining pending bids automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
