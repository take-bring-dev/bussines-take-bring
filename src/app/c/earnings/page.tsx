import { redirect } from "next/navigation";
import {
  CarrierEarnings,
  type CarrierEarningRow,
} from "@/components/billing/carrier-earnings";
import { backfillMissingEscrows } from "@/lib/escrow";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const CARRIER_ROLES = [
  "CARRIER_INDIVIDUAL",
  "CARRIER_COMPANY_ADMIN",
  "CARRIER_DRIVER",
  "SUPER_ADMIN",
] as const;

export default async function CarrierEarningsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/c/earnings");
  if (!CARRIER_ROLES.includes(user.role as (typeof CARRIER_ROLES)[number])) {
    redirect("/login");
  }

  await backfillMissingEscrows({ carrierUserId: user.id });

  const escrows = await prisma.escrowPayment.findMany({
    where: { carrierUserId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      load: {
        select: {
          id: true,
          reference: true,
          status: true,
          pickupCity: true,
          deliveryCity: true,
          shipper: { select: { name: true, email: true } },
        },
      },
    },
  });

  const rows: CarrierEarningRow[] = escrows.map((e) => ({
    id: e.id,
    status: e.status,
    amount: Number(e.amount),
    currency: e.currency,
    authorizedAt: e.authorizedAt?.toISOString() ?? null,
    capturedAt: e.capturedAt?.toISOString() ?? null,
    load: {
      id: e.load.id,
      reference: e.load.reference,
      status: e.load.status,
      pickupCity: e.load.pickupCity,
      deliveryCity: e.load.deliveryCity,
      shipperName:
        e.load.shipper.name || e.load.shipper.email.split("@")[0] || null,
    },
  }));

  return <CarrierEarnings rows={rows} />;
}
