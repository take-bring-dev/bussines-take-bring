import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Radar,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CarrierFreightBoard,
  type CarrierBoardLoad,
} from "@/components/loads/carrier-freight-board";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

const CARRIER_ROLES = [
  "CARRIER_INDIVIDUAL",
  "CARRIER_COMPANY_ADMIN",
  "CARRIER_DRIVER",
  "SUPER_ADMIN",
] as const;

export default async function CarrierHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/c");
  if (!CARRIER_ROLES.includes(user.role as (typeof CARRIER_ROLES)[number])) {
    redirect("/login");
  }

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const driver =
    user.role === "CARRIER_DRIVER"
      ? await prisma.driver.findUnique({ where: { userId: user.id } })
      : null;

  const myAppWhere = {
    OR: [
      { applicantUserId: user.id },
      ...(driver ? [{ driverId: driver.id }] : []),
    ],
  };

  const [openLoads, myActiveBids, wonApps, wonRecent, boardLoads, myApps] =
    await Promise.all([
      prisma.load.count({
        where: { status: { in: ["PUBLISHED", "RECEIVING_OFFERS"] } },
      }),
      prisma.loadApplication.count({
        where: { ...myAppWhere, status: "PENDING" },
      }),
      prisma.loadApplication.count({
        where: { ...myAppWhere, status: "ACCEPTED" },
      }),
      prisma.loadApplication.findMany({
        where: {
          ...myAppWhere,
          status: "ACCEPTED",
          updatedAt: { gte: since30d },
        },
        select: { proposedPrice: true },
      }),
      prisma.load.findMany({
        where: { status: { in: ["PUBLISHED", "RECEIVING_OFFERS"] } },
        orderBy: { publishedAt: "desc" },
        take: 50,
        include: {
          shipper: { select: { name: true, email: true } },
          _count: { select: { applications: true } },
          applications: {
            where: { status: "PENDING" },
            orderBy: { proposedPrice: "asc" },
            take: 1,
            select: { proposedPrice: true },
          },
        },
      }),
      prisma.loadApplication.findMany({
        where: myAppWhere,
        select: { loadId: true, status: true },
      }),
    ]);

  const myLoadIds = new Set(myApps.map((a) => a.loadId));
  const wonRevenue = wonRecent.reduce(
    (s, a) => s + Number(a.proposedPrice),
    0,
  );
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const postedToday = boardLoads.filter(
    (l) => l.publishedAt && l.publishedAt >= todayStart,
  ).length;
  const urgent = boardLoads.filter(
    (l) =>
      (l.pickupWindowStart.getTime() - Date.now()) / 3_600_000 < 24,
  ).length;

  const cards: CarrierBoardLoad[] = boardLoads.map((load) => ({
    id: load.id,
    reference: load.reference,
    status: load.status,
    pickupCity: load.pickupCity,
    pickupZip: load.pickupZip,
    pickupCountry: load.pickupCountry,
    pickupCompany: load.pickupCompany,
    pickupStreet: load.pickupStreet,
    pickupWindowStart: load.pickupWindowStart.toISOString(),
    pickupWindowEnd: load.pickupWindowEnd.toISOString(),
    deliveryCity: load.deliveryCity,
    deliveryZip: load.deliveryZip,
    deliveryCountry: load.deliveryCountry,
    deliveryCompany: load.deliveryCompany,
    deliveryStreet: load.deliveryStreet,
    deliveryWindowStart: load.deliveryWindowStart.toISOString(),
    deliveryWindowEnd: load.deliveryWindowEnd.toISOString(),
    cargoDescription: load.cargoDescription,
    weightKg: load.weightKg,
    palletCount: load.palletCount,
    hazardous: load.hazardous,
    requiredVehicleClass: load.requiredVehicleClass,
    suggestedBudgetEur: load.suggestedBudgetEur?.toString() ?? null,
    createdAt: load.createdAt.toISOString(),
    offerCount: load._count.applications,
    lowestBid: load.applications[0]
      ? Number(load.applications[0].proposedPrice)
      : null,
    shipperName: load.shipper.name || load.shipper.email.split("@")[0],
    alreadyApplied: myLoadIds.has(load.id),
  }));

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full items-center justify-between bg-primary px-4 py-1.5 text-xs text-primary-foreground md:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="inline-flex size-2 animate-ping rounded-full bg-primary-container" />
          <span className="font-semibold tracking-wider text-primary-container uppercase">
            Spot marketplace live
          </span>
          <span className="hidden sm:inline">
            Browse verified shipper consignments and submit bids with escrow
            payout.
          </span>
        </div>
        <div className="hidden items-center gap-4 text-[11px] opacity-90 lg:flex">
          <span>Auto-refresh ready</span>
          <span className="h-3 w-px bg-white/30" />
          <span>eu-central-1</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Operations Control Center</span>
            <span>›</span>
            <span>Carrier Dispatch</span>
            <span>›</span>
            <span className="font-semibold text-foreground">
              Open Freight Board
            </span>
          </nav>
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
                  Pan-European Open Freight Board
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-on-primary-container">
                  <span className="size-2 animate-pulse rounded-full bg-primary" />
                  {openLoads} LIVE SPOT LOADS
                </span>
              </div>
              <p className="max-w-4xl text-sm text-muted-foreground">
                Browse verified shipper spot consignments, evaluate rates, and
                submit instant bids with BaFin-compliant escrow payout upon
                discharge.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start justify-between rounded-xl bg-card p-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Available Spot Loads
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight md:text-5xl">
                  {openLoads}
                </span>
                {postedToday > 0 ? (
                  <span className="text-[11px] font-semibold text-primary">
                    +{postedToday} today
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Radar className="size-4 text-destructive" />
                <span>{urgent} urgent departures (&lt;24h)</span>
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-surface-low text-primary">
              <Radar className="size-[22px]" />
            </div>
          </div>

          <div className="flex items-start justify-between rounded-xl bg-card p-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                My Active Bids
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight md:text-5xl">
                  {myActiveBids}
                </span>
                <span className="text-[11px] text-muted-foreground">pending</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                <CheckCircle2 className="size-4" />
                Awaiting shipper award
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-success-container/40 text-success">
              <Wallet className="size-[22px]" />
            </div>
          </div>

          <div className="flex items-start justify-between rounded-xl bg-card p-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Awarded & Won (30d)
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight md:text-5xl">
                  {wonApps}
                </span>
                <span className="text-sm text-muted-foreground">loads</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-sm font-semibold text-foreground">
                  {formatMoney(wonRevenue)}
                </span>
                <span>gross in awards</span>
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-surface-low text-primary">
              <CheckCircle2 className="size-[22px]" />
            </div>
          </div>

          <div className="flex items-start justify-between rounded-xl bg-card p-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Win rate focus
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                  {myActiveBids + wonApps > 0
                    ? Math.round(
                        (wonApps / (myActiveBids + wonApps || 1)) * 100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-success">
                <TrendingUp className="size-4" />
                Accepted vs open bids
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-surface-high text-primary">
              <TrendingUp className="size-[22px]" />
            </div>
          </div>
        </div>

        <CarrierFreightBoard
          loads={cards}
          bidderKind={user.role === "CARRIER_DRIVER" ? "driver" : "carrier"}
        />
      </div>
    </div>
  );
}
