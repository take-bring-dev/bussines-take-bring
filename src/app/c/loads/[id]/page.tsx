import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Route,
  Truck,
  XCircle,
} from "lucide-react";
import { CarrierLoadStatusActions } from "@/components/loads/carrier-load-status-actions";
import { RequestPaymentButton } from "@/components/loads/request-payment-button";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatMoney, formatStatus, formatWindow } from "@/lib/format";
import { cn } from "@/lib/utils";

const CARRIER_ROLES = [
  "CARRIER_INDIVIDUAL",
  "CARRIER_COMPANY_ADMIN",
  "CARRIER_DRIVER",
  "SUPER_ADMIN",
] as const;

function timeAgo(date: Date) {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function CarrierBidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/c/loads");
  if (!CARRIER_ROLES.includes(user.role as (typeof CARRIER_ROLES)[number])) {
    redirect("/login");
  }

  const { id } = await params;

  const load = await prisma.load.findUnique({
    where: { id },
    include: {
      shipper: { select: { name: true, email: true, phone: true } },
      applications: {
        where: { applicantUserId: user.id },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              label: true,
              vehicleClass: true,
            },
          },
          driver: { select: { fullName: true } },
        },
        take: 1,
      },
    },
  });

  const bid = load?.applications[0];
  if (!load || !bid) notFound();

  const ref = load.reference || `TB-${load.id.slice(0, 8).toUpperCase()}`;
  const won = bid.status === "ACCEPTED";
  const pending = bid.status === "PENDING";
  const rejected = bid.status === "REJECTED";
  const target = load.suggestedBudgetEur
    ? Number(load.suggestedBudgetEur)
    : null;
  const bidPrice = Number(bid.proposedPrice);
  const delta = target != null ? bidPrice - target : null;
  const shipperName =
    load.shipper.name || load.shipper.email.split("@")[0] || "Shipper";

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <nav className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/c" className="hover:underline">
              Freight Board
            </Link>
            <span>›</span>
            <Link href="/c/loads" className="hover:underline">
              My Bids & Wins
            </Link>
            <span>›</span>
            <span className="font-mono font-semibold text-foreground">{ref}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight">
              {ref}
            </h1>
            {won ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-container/60 px-2.5 py-0.5 text-xs font-bold text-success">
                <CheckCircle2 className="size-3.5" />
                ACCEPTED · AWARDED TO YOU
              </span>
            ) : null}
            {pending ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container/40 px-2.5 py-0.5 text-xs font-bold text-on-primary-container">
                <Clock className="size-3.5" />
                PENDING REVIEW
              </span>
            ) : null}
            {rejected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                <XCircle className="size-3.5" />
                NOT SELECTED
              </span>
            ) : null}
            <span className="rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
              Load: {formatStatus(load.status)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {load.pickupCity} ({load.pickupCountry}) → {load.deliveryCity} (
            {load.deliveryCountry}) · {load.weightKg.toLocaleString("de-DE")} kg
          </p>
        </div>

        <Link
          href="/c/loads"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-surface-low"
        >
          <ArrowLeft className="size-4" />
          Back to My Bids
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Your bid
          </p>
          <p className="mt-0.5 font-mono text-2xl font-bold">
            {formatMoney(bidPrice, bid.currency)}
          </p>
          {delta != null ? (
            <p
              className={cn(
                "mt-0.5 font-mono text-[11px] font-bold",
                delta <= 0 ? "text-success" : "text-destructive",
              )}
            >
              {delta <= 0 ? "" : "+"}
              {formatMoney(delta)} vs target
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Bid status
          </p>
          <p className="mt-0.5 text-lg font-bold">{formatStatus(bid.status)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {won
              ? `Awarded ${timeAgo(bid.updatedAt)}`
              : `Submitted ${timeAgo(bid.createdAt)}`}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Shipper
          </p>
          <p className="mt-0.5 text-lg font-bold">{shipperName}</p>
          {won && load.shipper.phone ? (
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {load.shipper.phone}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {won ? load.shipper.email : "Contact unlocks on award"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div
            className={cn(
              "rounded-lg border bg-card p-5 shadow-sm",
              won && "border-2 border-success",
              pending && "border-border",
              rejected && "border-border opacity-90",
            )}
          >
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Truck className="size-4 text-primary" />
              <h2 className="text-xs font-bold tracking-wider uppercase">
                Your quotation
              </h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-border bg-surface p-3">
                <p className="text-[10px] text-muted-foreground">Spot bid</p>
                <p className="font-mono text-xl font-bold">
                  {formatMoney(bidPrice, bid.currency)}
                </p>
              </div>
              <div className="rounded border border-border bg-surface p-3">
                <p className="text-[10px] text-muted-foreground">Applicant type</p>
                <p className="font-semibold">
                  {formatStatus(bid.applicantType)}
                </p>
              </div>
              <div className="rounded border border-border bg-surface p-3">
                <p className="text-[10px] text-muted-foreground">Vehicle</p>
                <p className="font-semibold">
                  {bid.vehicle
                    ? bid.vehicle.label ||
                      formatStatus(bid.vehicle.vehicleClass)
                    : formatStatus(load.requiredVehicleClass)}
                </p>
                {bid.vehicle?.plateNumber ? (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Plate: {bid.vehicle.plateNumber}
                  </p>
                ) : null}
              </div>
              <div className="rounded border border-border bg-surface p-3">
                <p className="text-[10px] text-muted-foreground">Driver</p>
                <p className="font-semibold">
                  {bid.driver?.fullName || "Fleet assignment TBD"}
                </p>
              </div>
            </div>

            {bid.message ? (
              <p className="mt-4 rounded border border-border bg-surface-low p-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Your note: </span>
                {bid.message}
              </p>
            ) : null}

            {won ? (
              <div className="mt-4 space-y-3">
                {load.status === "ASSIGNED" ||
                load.status === "OFFER_SELECTED" ? (
                  <div className="flex items-center justify-center gap-1.5 rounded-md bg-success-container/50 py-2.5 text-xs font-bold text-success">
                    <CheckCircle2 className="size-4" />
                    Contract awarded — mark pickup when cargo is loaded
                  </div>
                ) : null}
                <CarrierLoadStatusActions
                  loadId={load.id}
                  loadStatus={load.status}
                  bidAccepted
                />
                <RequestPaymentButton
                  loadId={load.id}
                  loadStatus={load.status}
                />
              </div>
            ) : pending ? (
              <div className="mt-4 rounded-md bg-surface-low py-2.5 text-center text-xs font-semibold text-muted-foreground">
                Waiting for shipper decision
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-surface-low py-2.5 text-center text-xs font-semibold text-muted-foreground">
                Another carrier was selected for this load
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-primary" />
                <h3 className="text-xs font-bold tracking-wider uppercase">
                  Route
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
                  <span className="text-xs font-bold">
                    {load.pickupCountry}-{load.pickupZip} {load.pickupCity}
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {load.pickupCompany || load.pickupStreet}
                  </p>
                  {won ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {load.pickupStreet} · {load.pickupContactName} ·{" "}
                      {load.pickupContactPhone}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-[11px]">
                    Pickup:{" "}
                    <strong>
                      {formatWindow(
                        load.pickupWindowStart,
                        load.pickupWindowEnd,
                      )}
                    </strong>
                  </p>
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
                  <span className="text-xs font-bold">
                    {load.deliveryCountry}-{load.deliveryZip}{" "}
                    {load.deliveryCity}
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {load.deliveryCompany || load.deliveryStreet}
                  </p>
                  {won ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {load.deliveryStreet} · {load.deliveryContactName} ·{" "}
                      {load.deliveryContactPhone}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-[11px]">
                    Delivery:{" "}
                    <strong>
                      {formatWindow(
                        load.deliveryWindowStart,
                        load.deliveryWindowEnd,
                      )}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Package className="size-4 text-primary" />
              <h3 className="text-xs font-bold tracking-wider uppercase">
                Cargo & vehicle
              </h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                ["Commodity", load.cargoDescription],
                [
                  "Gross weight",
                  `${load.weightKg.toLocaleString("de-DE")} kg`,
                ],
                [
                  "Pallets",
                  load.palletCount != null ? `${load.palletCount}` : "—",
                ],
                ["Vehicle class", formatStatus(load.requiredVehicleClass)],
                ["Hazardous (ADR)", load.hazardous ? "Yes" : "No"],
                [
                  "Temperature",
                  load.temperatureControl ? "Controlled" : "Ambient",
                ],
                ["Target budget", target != null ? formatMoney(target) : "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-surface-low py-1 last:border-0"
                >
                  <span>{label}</span>
                  <strong className="max-w-[60%] text-right text-foreground">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
