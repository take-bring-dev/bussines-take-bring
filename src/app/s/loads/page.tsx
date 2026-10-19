import Link from "next/link";
import { redirect } from "next/navigation";
import { Gavel, Navigation, ShieldCheck, Truck } from "lucide-react";
import {
  ShipperMyLoads,
  type ShipperLoadCard,
} from "@/components/loads/shipper-my-loads";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function ShipperLoadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/s/loads");
  if (user.role !== "SHIPPER" && user.role !== "SUPER_ADMIN") redirect("/login");

  const loads = await prisma.load.findMany({
    where: { shipperId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { applications: true } },
      applications: {
        where: { status: { in: ["PENDING", "ACCEPTED"] } },
        orderBy: { proposedPrice: "asc" },
        take: 8,
        include: {
          applicant: { select: { name: true, email: true } },
        },
      },
    },
  });

  const cards: ShipperLoadCard[] = loads.map((load) => {
    const pending = load.applications.filter((a) => a.status === "PENDING");
    const accepted = load.applications.find((a) => a.status === "ACCEPTED");
    const lowest = pending[0];
    return {
      id: load.id,
      reference: load.reference,
      status: load.status,
      pickupCity: load.pickupCity,
      pickupZip: load.pickupZip,
      pickupCountry: load.pickupCountry,
      pickupCompany: load.pickupCompany,
      pickupStreet: load.pickupStreet,
      pickupWindowStart: load.pickupWindowStart.toISOString(),
      deliveryCity: load.deliveryCity,
      deliveryZip: load.deliveryZip,
      deliveryCountry: load.deliveryCountry,
      deliveryCompany: load.deliveryCompany,
      deliveryStreet: load.deliveryStreet,
      deliveryWindowEnd: load.deliveryWindowEnd.toISOString(),
      cargoDescription: load.cargoDescription,
      weightKg: load.weightKg,
      palletCount: load.palletCount,
      hazardous: load.hazardous,
      requiredVehicleClass: load.requiredVehicleClass,
      suggestedBudgetEur: load.suggestedBudgetEur?.toString() ?? null,
      createdAt: load.createdAt.toISOString(),
      publishedAt: load.publishedAt?.toISOString() ?? null,
      offerCount: load._count.applications,
      lowestBid: lowest ? Number(lowest.proposedPrice) : null,
      lowestBidder:
        lowest?.applicant.name ||
        lowest?.applicant.email.split("@")[0] ||
        null,
      acceptedPrice: accepted ? Number(accepted.proposedPrice) : null,
      acceptedCarrier:
        accepted?.applicant.name ||
        accepted?.applicant.email.split("@")[0] ||
        null,
    };
  });

  const active = loads.filter((l) =>
    [
      "PUBLISHED",
      "RECEIVING_OFFERS",
      "OFFER_SELECTED",
      "ASSIGNED",
      "IN_TRANSIT",
      "DRAFT",
    ].includes(l.status),
  );
  const openBidding = loads.filter((l) =>
    ["PUBLISHED", "RECEIVING_OFFERS"].includes(l.status),
  ).length;
  const unreadOffers = loads.reduce((sum, l) => {
    if (!["PUBLISHED", "RECEIVING_OFFERS"].includes(l.status)) return sum;
    return sum + l.applications.filter((a) => a.status === "PENDING").length;
  }, 0);
  const inTransit = loads.filter((l) => l.status === "IN_TRANSIT").length;
  const escrowApps = loads.flatMap((l) =>
    l.applications.filter(
      (a) =>
        a.status === "ACCEPTED" &&
        ["ASSIGNED", "IN_TRANSIT"].includes(l.status),
    ),
  );
  const escrowTotal = escrowApps.reduce(
    (sum, a) => sum + Number(a.proposedPrice),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Breadcrumb + title */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-1.5">
          <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Link href="/s" className="transition-colors hover:text-primary">
              Operations Control Center
            </Link>
            <span aria-hidden>›</span>
            <span className="transition-colors hover:text-primary">
              Shipper Dispatch
            </span>
            <span aria-hidden>›</span>
            <span className="font-semibold text-foreground">
              My Published Loads
            </span>
          </nav>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
              My Freight Consignments & Spot Tenders
            </h1>
            <span className="rounded bg-surface-container px-2 py-0.5 text-xs font-bold tracking-wider text-primary">
              {active.length} ACTIVE
            </span>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Manage published loads, evaluate incoming carrier bids, review e-CMR
            documentation, and track active EU transport corridors in real-time.
          </p>
        </div>
      </div>

      {/* Telemetry stats */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] tracking-wider uppercase">Spot Tenders</span>
            <Truck className="size-[18px] text-primary" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold">{active.length}</span>
            <span className="text-[11px] font-medium text-success">
              {openBidding} Open Bidding
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] tracking-wider uppercase">Unread Offers</span>
            <Gavel className="size-[18px] text-success" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold">{unreadOffers}</span>
            <span className="text-[11px] font-medium text-success">
              Pending review
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] tracking-wider uppercase">In Transit (GPS)</span>
            <Navigation className="size-[18px] text-primary" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold">{inTransit}</span>
            <span className="text-[11px] text-muted-foreground">On Schedule</span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] tracking-wider uppercase">Escrow Secured</span>
            <ShieldCheck className="size-[18px] text-success" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold">
              {formatMoney(escrowTotal)}
            </span>
            <span className="text-[11px] text-success">BaFin Protected</span>
          </div>
        </div>
        <div className="col-span-2 flex flex-col justify-between rounded-lg bg-surface-high p-4 md:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-foreground">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Corridor Traffic
            </span>
            <Navigation className="size-[18px] animate-pulse text-success" />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold">EU Spot Network</span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Live matching active
              </span>
            </div>
            <span className="rounded bg-success-container px-2 py-0.5 text-[11px] font-semibold text-success">
              Online
            </span>
          </div>
        </div>
      </div>

      <ShipperMyLoads loads={cards} />
    </div>
  );
}
