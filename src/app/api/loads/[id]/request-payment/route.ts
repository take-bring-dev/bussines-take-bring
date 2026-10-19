import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyUser } from "@/lib/notify";
import { formatMoney } from "@/lib/format";

const CARRIER_ROLES = [
  "CARRIER_INDIVIDUAL",
  "CARRIER_COMPANY_ADMIN",
  "CARRIER_DRIVER",
  "SUPER_ADMIN",
] as const;

/** Carrier asks shipper to fund/release escrow — only while IN_TRANSIT. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles(...CARRIER_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: loadId } = await context.params;

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      escrow: true,
      applications: {
        where: { applicantUserId: auth.user.id, status: "ACCEPTED" },
        take: 1,
      },
    },
  });

  if (!load) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  if (!load.applications.length && auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only the awarded carrier can request payment." },
      { status: 403 },
    );
  }

  if (load.status !== "IN_TRANSIT") {
    return NextResponse.json(
      { error: "Payment can only be requested while the load is in transit." },
      { status: 400 },
    );
  }

  if (!load.escrow) {
    return NextResponse.json(
      { error: "No escrow for this load yet." },
      { status: 400 },
    );
  }

  // Cooldown: one request per load per 30 minutes
  const recentRows = await prisma.notification.findMany({
    where: {
      userId: load.shipperId,
      type: "escrow.payment_requested",
      createdAt: { gte: new Date(Date.now() - 30 * 60_000) },
    },
    take: 20,
  });
  const recent = recentRows.some((n) => {
    const p = n.payload as { loadId?: string } | null;
    return p?.loadId === loadId;
  });
  if (recent) {
    return NextResponse.json(
      { error: "You already requested payment recently. Wait before retrying." },
      { status: 429 },
    );
  }

  const amountLabel = formatMoney(
    Number(load.escrow.amount),
    load.escrow.currency,
  );
  const awaiting = load.escrow.status === "AWAITING_PAYMENT";

  await notifyUser({
    userId: load.shipperId,
    type: "escrow.payment_requested",
    title: awaiting
      ? "Carrier requests escrow payment"
      : "Carrier requests settlement attention",
    body: awaiting
      ? `Please fund ${amountLabel} for the in-transit load.`
      : `Load is in transit (${amountLabel} held). Delivery will release funds.`,
    payload: {
      loadId,
      escrowId: load.escrow.id,
      escrowStatus: load.escrow.status,
    },
    href: "/s/billing",
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: "escrow.request_payment",
      entityType: "load",
      entityId: loadId,
      meta: { escrowStatus: load.escrow.status },
    },
  });

  return NextResponse.json({ ok: true });
}
