import { redirect } from "next/navigation";
import {
  ShipperBilling,
  type ShipperBillingRow,
} from "@/components/billing/shipper-billing";
import { backfillMissingEscrows } from "@/lib/escrow";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isStripeMock } from "@/lib/stripe";

export default async function ShipperBillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/s/billing");
  if (user.role !== "SHIPPER" && user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  await backfillMissingEscrows({ shipperId: user.id });

  const escrows = await prisma.escrowPayment.findMany({
    where: { shipperId: user.id },
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
        },
      },
    },
  });

  const rows: ShipperBillingRow[] = escrows.map((e) => ({
    id: e.id,
    status: e.status,
    amount: Number(e.amount),
    currency: e.currency,
    mock: e.mock || isStripeMock(),
    authorizedAt: e.authorizedAt?.toISOString() ?? null,
    capturedAt: e.capturedAt?.toISOString() ?? null,
    load: e.load,
  }));

  return <ShipperBilling rows={rows} />;
}
