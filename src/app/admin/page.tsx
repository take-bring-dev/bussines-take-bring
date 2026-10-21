import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Package,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { StatusBadge } from "@/components/ui/status-badge";
import { RouteWaypoint } from "@/components/loads/route-waypoint";
import { formatStatus } from "@/lib/format";

function hrefFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const href = (payload as Record<string, unknown>).href;
  return typeof href === "string" && href.length ? href : null;
}

function timeAgo(date: Date) {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function AdminHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "SUPER_ADMIN") redirect("/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    users,
    kycPending,
    openLoads,
    offersToday,
    inTransit,
    escrowAwaiting,
    recentLoads,
    timeline,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.profile.count({
      where: { kycStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    prisma.load.count({
      where: { status: { in: ["PUBLISHED", "RECEIVING_OFFERS"] } },
    }),
    prisma.loadApplication.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.load.count({ where: { status: "IN_TRANSIT" } }),
    prisma.escrowPayment.count({
      where: { status: { in: ["AWAITING_PAYMENT", "AUTHORIZED"] } },
    }),
    prisma.load.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        shipper: { select: { name: true, email: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 rounded-full bg-primary-container" />
            <span>Platform Control Center • EU Marketplace</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            Ops overview
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Complete visibility across shippers, carriers, KYC, loads, and escrow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm">
            <ShieldCheck className="size-[18px] text-success" />
            <span>SUPER_ADMIN · Live corridors</span>
          </div>
          <Link
            href="/admin/activity"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-container px-3 text-sm font-semibold text-on-primary-container shadow-sm transition-all hover:bg-brand-light"
          >
            <Activity className="size-4" />
            Open timeline
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Active users
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-surface-container px-2 py-0.5 text-[11px] text-primary">
              <span className="size-2 animate-pulse rounded-full bg-primary-container" />
              LIVE
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
              {users}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <span className="text-xs">Verified platform accounts</span>
            <Users className="size-[18px] text-primary" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              KYC pending
            </span>
            {kycPending > 0 ? (
              <span className="rounded-lg bg-error-container/50 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                Action needed
              </span>
            ) : (
              <span className="rounded-lg bg-success-container/40 px-2 py-0.5 text-[11px] font-semibold text-success">
                Clear
              </span>
            )}
          </div>
          <div className="my-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
              {kycPending}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <Link href="/admin/kyc" className="text-xs font-semibold text-primary hover:underline">
              Review queue →
            </Link>
            <ShieldCheck className="size-[18px] text-primary" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Open loads
            </span>
            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-[11px]">
              {offersToday} bids today
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
              {openLoads}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <span className="text-xs">{inTransit} in transit</span>
            <Package className="size-[18px] text-primary" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Escrow open
            </span>
            <span className="rounded-lg bg-surface-container px-2 py-0.5 text-[11px] text-primary">
              Funded / due
            </span>
          </div>
          <div className="my-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
              {escrowAwaiting}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-muted-foreground">
            <Link href="/admin/escrow" className="text-xs font-semibold text-primary hover:underline">
              Monitor →
            </Link>
            <Wallet className="size-[18px] text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Recent marketplace loads</h2>
            <Link
              href="/admin/loads"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              All loads <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {!recentLoads.length ? (
            <div className="rounded-lg bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
              No loads yet. Shipper publish events will appear here.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentLoads.map((l) => (
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
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(l.createdAt)}
                    </span>
                  </div>
                  <RouteWaypoint
                    from={l.pickupCity}
                    to={l.deliveryCity}
                    fromMeta={l.pickupCountry}
                    toMeta={l.deliveryCountry}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Truck className="size-3.5" />
                      {formatStatus(l.requiredVehicleClass)} · {l.weightKg} kg
                    </span>
                    <span>
                      Shipper: {l.shipper.name || l.shipper.email}
                    </span>
                    <span className="font-semibold text-primary">
                      {l._count.applications} offers
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Live timeline</h2>
            <Link
              href="/admin/activity"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg bg-card shadow-sm">
            {!timeline.length ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Waiting for marketplace activity…
              </div>
            ) : (
              <ol className="divide-y divide-border">
                {timeline.map((n) => {
                  const href = hrefFromPayload(n.payload) || "/admin/activity";
                  return (
                    <li key={n.id}>
                      <Link
                        href={href}
                        className="block px-4 py-3 transition-colors hover:bg-surface-high"
                      >
                        <p className="text-sm font-semibold">{n.title}</p>
                        {n.body ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
