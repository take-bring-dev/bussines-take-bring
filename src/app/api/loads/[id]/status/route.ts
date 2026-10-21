import { NextResponse } from "next/server";
import { captureEscrow } from "@/lib/escrow";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyAdmins, notifyUser } from "@/lib/notify";
import type { LoadStatus } from "@prisma/client";

const CARRIER_ROLES = [
  "CARRIER_INDIVIDUAL",
  "CARRIER_COMPANY_ADMIN",
  "CARRIER_DRIVER",
  "SUPER_ADMIN",
] as const;

const TRANSITIONS: Record<string, { from: LoadStatus[]; action: string }> = {
  IN_TRANSIT: {
    from: ["ASSIGNED", "OFFER_SELECTED"],
    action: "load.start_transit",
  },
  DELIVERED: {
    from: ["IN_TRANSIT"],
    action: "load.mark_delivered",
  },
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles(...CARRIER_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: loadId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const nextStatus = body.status as string;

  if (nextStatus !== "IN_TRANSIT" && nextStatus !== "DELIVERED") {
    return NextResponse.json(
      { error: "status must be IN_TRANSIT or DELIVERED." },
      { status: 400 },
    );
  }

  const rule = TRANSITIONS[nextStatus];
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      applications: {
        where: {
          applicantUserId: auth.user.id,
          status: "ACCEPTED",
        },
        take: 1,
      },
    },
  });

  if (!load) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  if (!load.applications.length && auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only the awarded carrier can update this load." },
      { status: 403 },
    );
  }

  if (!rule.from.includes(load.status)) {
    return NextResponse.json(
      {
        error: `Cannot set ${nextStatus} from ${load.status}.`,
      },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.load.update({
      where: { id: loadId },
      data: { status: nextStatus },
    });

    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: rule.action,
        entityType: "load",
        entityId: loadId,
        meta: { from: load.status, to: nextStatus },
      },
    });
  });

  const title =
    nextStatus === "IN_TRANSIT" ? "Load in transit" : "Load delivered";
  const bodyText =
    nextStatus === "IN_TRANSIT"
      ? "Carrier marked the load as picked up and in transit."
      : "Carrier marked the load transfer as complete. Escrow will be captured.";

  await notifyUser({
    userId: load.shipperId,
    type: nextStatus === "IN_TRANSIT" ? "load.in_transit" : "load.delivered",
    title,
    body: bodyText,
    payload: { loadId, status: nextStatus },
    href:
      nextStatus === "DELIVERED" ? "/s/billing" : `/s/loads/${loadId}`,
  });

  await notifyAdmins({
    type: nextStatus === "IN_TRANSIT" ? "admin.load.in_transit" : "admin.load.delivered",
    title,
    body: `${load.pickupCity} → ${load.deliveryCity} · ${bodyText}`,
    payload: { loadId, status: nextStatus },
    href: `/admin/loads/${loadId}`,
  });

  let escrowStatus: string | null = null;
  if (nextStatus === "DELIVERED") {
    try {
      const escrow = await captureEscrow(loadId);
      escrowStatus = escrow?.status ?? null;
      if (escrow?.status === "CAPTURED") {
        await notifyUser({
          userId: auth.user.id,
          type: "escrow.captured",
          title: "Payment released",
          body: "Escrow was captured after delivery confirmation.",
          payload: { loadId },
          href: "/c/earnings",
        });
      }
    } catch (e) {
      console.error("[load.status] escrow capture failed", e);
      return NextResponse.json(
        {
          ok: true,
          status: nextStatus,
          escrowError: "Delivery saved but escrow capture failed.",
        },
        { status: 200 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    status: nextStatus,
    escrowStatus,
  });
}
