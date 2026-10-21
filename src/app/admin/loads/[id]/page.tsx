import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { RouteWaypoint } from "@/components/loads/route-waypoint";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatMoney, formatStatus, formatWindow } from "@/lib/format";

export default async function AdminLoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin/loads");
  if (user.role !== "SUPER_ADMIN") redirect("/login");

  const { id } = await params;

  const load = await prisma.load.findUnique({
    where: { id },
    include: {
      shipper: { select: { id: true, email: true, name: true } },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { select: { id: true, name: true, email: true } },
        },
      },
      escrow: true,
    },
  });

  if (!load) notFound();

  const ref = load.reference || `#${load.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      <Link
        href="/admin/loads"
        className="mb-4 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All loads
      </Link>

      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 rounded-full bg-primary-container" />
            <span>Load detail • {ref}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            {load.pickupCity} → {load.deliveryCity}
          </h1>
          <p className="text-sm text-muted-foreground">
            Shipper {load.shipper.name || load.shipper.email} ·{" "}
            {formatStatus(load.requiredVehicleClass)} · {load.weightKg} kg
          </p>
        </div>
        <StatusBadge status={load.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <article className="rounded-lg bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold">Route</h2>
            <RouteWaypoint
              from={load.pickupCity}
              to={load.deliveryCity}
              fromMeta={formatWindow(load.pickupWindowStart, load.pickupWindowEnd)}
              toMeta={formatWindow(load.deliveryWindowStart, load.deliveryWindowEnd)}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-surface-low p-3">
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  <MapPin className="size-3.5" /> Pickup
                </p>
                <p className="text-sm font-semibold">
                  {load.pickupCompany || load.pickupStreet}
                </p>
                <p className="text-xs text-muted-foreground">
                  {load.pickupZip} {load.pickupCity}, {load.pickupCountry}
                </p>
              </div>
              <div className="rounded-lg bg-surface-low p-3">
                <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  <MapPin className="size-3.5" /> Delivery
                </p>
                <p className="text-sm font-semibold">
                  {load.deliveryCompany || load.deliveryStreet}
                </p>
                <p className="text-xs text-muted-foreground">
                  {load.deliveryZip} {load.deliveryCity}, {load.deliveryCountry}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-lg bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Offers ({load.applications.length})
              </h2>
              <Truck className="size-4 text-primary" />
            </div>
            {!load.applications.length ? (
              <p className="text-sm text-muted-foreground">No bids yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {load.applications.map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {app.applicant.name || app.applicant.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {app.createdAt.toLocaleString("de-DE")}
                        {app.message ? ` · ${app.message}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {formatMoney(Number(app.proposedPrice), app.currency)}
                      </p>
                      <StatusBadge status={app.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <article className="rounded-lg bg-card p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Package className="size-4 text-primary" />
              Cargo
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Description</dt>
                <dd className="text-right font-medium">{load.cargoDescription}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Weight</dt>
                <dd className="font-medium">{load.weightKg} kg</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Pallets</dt>
                <dd className="font-medium">{load.palletCount ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Vehicle</dt>
                <dd className="font-medium">
                  {formatStatus(load.requiredVehicleClass)}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-lg bg-card p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Wallet className="size-4 text-primary" />
              Escrow
            </h2>
            {load.escrow ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatMoney(Number(load.escrow.amount), load.escrow.currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={load.escrow.status} />
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No escrow yet — created when an offer is awarded.
              </p>
            )}
            <Link
              href="/admin/escrow"
              className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
            >
              Escrow monitor →
            </Link>
          </article>
        </aside>
      </div>
    </div>
  );
}
