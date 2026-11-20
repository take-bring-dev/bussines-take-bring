import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyUser, notifyUsers } from "@/lib/notify";

/** Super admin publishes a pending load onto the carrier board. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: loadId } = await context.params;
  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }
  if (!["PENDING_ADMIN", "DRAFT", "PUBLISHED"].includes(load.status)) {
    return NextResponse.json(
      { error: "Load is not waiting for admin publish." },
      { status: 400 },
    );
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.load.update({
      where: { id: loadId },
      data: {
        status: "RECEIVING_OFFERS",
        publishedAt: load.publishedAt ?? now,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "load.admin_publish",
        entityType: "load",
        entityId: loadId,
      },
    });
    return row;
  });

  const routeLabel = `${load.pickupCity} → ${load.deliveryCity} · ${load.weightKg} kg`;

  // Board audience: company admins + individuals only (not company drivers)
  const carriers = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: { in: ["CARRIER_INDIVIDUAL", "CARRIER_COMPANY_ADMIN"] },
    },
    select: { id: true },
  });
  if (carriers.length) {
    await notifyUsers(
      carriers.map((c) => c.id),
      {
        type: "load.published",
        title: "New load available",
        body: routeLabel,
        payload: { loadId },
        href: "/c",
      },
    );
  }

  await notifyUser({
    userId: load.shipperId,
    type: "load.admin_published",
    title: "Your load is live",
    body: `${routeLabel} is now open for carrier bids.`,
    payload: { loadId },
    href: `/s/loads/${loadId}`,
  });

  return NextResponse.json({ ok: true, load: updated });
}
