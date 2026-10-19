import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CarrierMyBids,
  type CarrierBidRow,
} from "@/components/loads/carrier-my-bids";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const CARRIER_ROLES = [
  "CARRIER_INDIVIDUAL",
  "CARRIER_COMPANY_ADMIN",
  "CARRIER_DRIVER",
  "SUPER_ADMIN",
] as const;

export default async function CarrierLoadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/c/loads");
  if (!CARRIER_ROLES.includes(user.role as (typeof CARRIER_ROLES)[number])) {
    redirect("/login");
  }

  const applications = await prisma.loadApplication.findMany({
    where: { applicantUserId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      load: {
        include: {
          shipper: { select: { name: true, email: true } },
        },
      },
    },
  });

  const bids: CarrierBidRow[] = applications.map((a) => ({
    id: a.id,
    status: a.status,
    proposedPrice: Number(a.proposedPrice),
    currency: a.currency,
    message: a.message,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    load: {
      id: a.load.id,
      reference: a.load.reference,
      status: a.load.status,
      pickupCity: a.load.pickupCity,
      pickupCountry: a.load.pickupCountry,
      pickupZip: a.load.pickupZip,
      deliveryCity: a.load.deliveryCity,
      deliveryCountry: a.load.deliveryCountry,
      deliveryZip: a.load.deliveryZip,
      pickupWindowStart: a.load.pickupWindowStart.toISOString(),
      pickupWindowEnd: a.load.pickupWindowEnd.toISOString(),
      deliveryWindowStart: a.load.deliveryWindowStart.toISOString(),
      deliveryWindowEnd: a.load.deliveryWindowEnd.toISOString(),
      weightKg: a.load.weightKg,
      cargoDescription: a.load.cargoDescription,
      requiredVehicleClass: a.load.requiredVehicleClass,
      shipperName:
        a.load.shipper.name || a.load.shipper.email.split("@")[0] || null,
    },
  }));

  const accepted = bids.filter((b) => b.status === "ACCEPTED").length;
  const pending = bids.filter((b) => b.status === "PENDING").length;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My Bids & Accepted Offers
          </h1>
          <p className="text-sm text-muted-foreground">
            Pending quotes and loads awarded to you by shippers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-success-container/50 px-2.5 py-1 font-semibold text-success">
            {accepted} accepted
          </span>
          <span className="rounded-lg bg-surface-low px-2.5 py-1 font-semibold text-muted-foreground">
            {pending} pending
          </span>
          <Link
            href="/c"
            className="rounded-lg bg-primary-container px-3 py-1.5 font-semibold text-on-primary-container"
          >
            Browse board
          </Link>
        </div>
      </div>

      <CarrierMyBids bids={bids} />
    </div>
  );
}
