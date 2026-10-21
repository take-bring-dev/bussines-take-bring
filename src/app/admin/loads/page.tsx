import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Search, Truck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { RouteWaypoint } from "@/components/loads/route-waypoint";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatStatus, formatWindow } from "@/lib/format";

export default async function AdminLoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  const { status: raw } = await searchParams;
  const statusFilter =
    raw &&
    [
      "PUBLISHED",
      "RECEIVING_OFFERS",
      "ASSIGNED",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELLED",
    ].includes(raw)
      ? raw
      : null;

  const loads = await prisma.load.findMany({
    where: statusFilter ? { status: statusFilter as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      shipper: { select: { email: true, name: true } },
      _count: { select: { applications: true } },
    },
  });

  const chips = [
    { key: null, label: "All", href: "/admin/loads" },
    { key: "RECEIVING_OFFERS", label: "Receiving offers", href: "/admin/loads?status=RECEIVING_OFFERS" },
    { key: "ASSIGNED", label: "Assigned", href: "/admin/loads?status=ASSIGNED" },
    { key: "IN_TRANSIT", label: "In transit", href: "/admin/loads?status=IN_TRANSIT" },
    { key: "DELIVERED", label: "Delivered", href: "/admin/loads?status=DELIVERED" },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 rounded-full bg-primary-container" />
            <span>Platform Control Center • Freight board</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            Global load monitor
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Every spot load across the EU marketplace — shipper, bids, and status.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          <Package className="size-4 text-primary" />
          <span>{loads.length} loads shown</span>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-lg bg-surface-low p-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            readOnly
            className="h-10 w-full rounded-lg bg-card pr-3 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none"
            placeholder="Search REF, city, shipper…"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {chips.map((chip) => {
            const active = statusFilter === chip.key || (!statusFilter && chip.key === null);
            return (
              <Link
                key={chip.label}
                href={chip.href}
                className={
                  active
                    ? "shrink-0 rounded-full bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary-container shadow-sm"
                    : "shrink-0 rounded-full bg-surface-container px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-high"
                }
              >
                {chip.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!loads.length ? (
          <div className="rounded-lg bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
            No loads match this filter.
          </div>
        ) : null}
        {loads.map((l) => (
          <Link
            key={l.id}
            href={`/admin/loads/${l.id}`}
            className="rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-surface-high"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {l.reference || `#${l.id.slice(0, 8).toUpperCase()}`}
                </span>
                <StatusBadge status={l.status} />
              </div>
              <span className="text-xs font-semibold text-primary">
                {l._count.applications} offers
              </span>
            </div>
            <RouteWaypoint
              from={l.pickupCity}
              to={l.deliveryCity}
              fromMeta={formatWindow(l.pickupWindowStart, l.pickupWindowEnd)}
              toMeta={l.deliveryCountry}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Truck className="size-3.5" />
                {formatStatus(l.requiredVehicleClass)} · {l.weightKg} kg
              </span>
              <span>Shipper: {l.shipper.name || l.shipper.email}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
