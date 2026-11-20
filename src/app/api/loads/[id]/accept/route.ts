import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import {
  notifyDriverById,
  notifyUser,
  notifyUsers,
} from "@/lib/notify";

/**
 * Super admin awards one bid. No escrow — settlement is offline / AR-AP by admin.
 * Other pending bids are auto-rejected. Shipper + winner (+ assigned driver) notified.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: loadId } = await context.params;
  const body = await request.json();
  const applicationId = body.applicationId as string;
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId required." }, { status: 400 });
  }

  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }
  if (!["PUBLISHED", "RECEIVING_OFFERS", "OFFER_SELECTED"].includes(load.status)) {
    return NextResponse.json(
      { error: "Load is not open for awarding." },
      { status: 400 },
    );
  }

  const result = await prisma
    .$transaction(async (tx) => {
      const app = await tx.loadApplication.findUnique({
        where: { id: applicationId },
      });
      if (!app || app.loadId !== loadId || app.status !== "PENDING") {
        throw new Error("INVALID_APPLICATION");
      }

      await tx.loadApplication.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED" },
      });

      await tx.loadApplication.updateMany({
        where: {
          loadId,
          id: { not: applicationId },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      await tx.load.update({
        where: { id: loadId },
        data: { status: "ASSIGNED", assignedAt: new Date() },
      });

      const others = await tx.loadApplication.findMany({
        where: { loadId, id: { not: applicationId }, status: "REJECTED" },
        select: { applicantUserId: true, driverId: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "load.admin_accept_offer",
          entityType: "load",
          entityId: loadId,
          meta: { applicationId },
        },
      });

      return { app, others };
    })
    .catch((e) => {
      if (e instanceof Error && e.message === "INVALID_APPLICATION") return null;
      throw e;
    });

  if (!result) {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  const { app, others } = result;
  const routeLabel = `${load.pickupCity} → ${load.deliveryCity}`;
  const priceLabel = `€${Number(app.proposedPrice).toFixed(2)}`;

  const carrier = await prisma.user.findUnique({
    where: { id: app.applicantUserId },
    select: { name: true, email: true },
  });
  const carrierLabel = carrier?.name || carrier?.email || "Carrier";

  await notifyUser({
    userId: app.applicantUserId,
    type: "application.accepted",
    title: "Offer accepted",
    body: `Your bid of ${priceLabel} on ${routeLabel} was accepted. Prepare for pickup.`,
    payload: { loadId, applicationId: app.id },
    href: `/c/loads/${loadId}`,
  });

  if (app.driverId) {
    await notifyDriverById(app.driverId, {
      type: "application.accepted",
      title: "You won a load",
      body: `${routeLabel} was awarded to your company. Prepare for pickup.`,
      payload: { loadId, applicationId: app.id },
      href: `/c/loads/${loadId}`,
    });
  }

  const loserIds = [
    ...new Set(
      others
        .map((o) => o.applicantUserId)
        .filter((id) => id !== app.applicantUserId),
    ),
  ];
  if (loserIds.length) {
    await notifyUsers(loserIds, {
      type: "application.rejected",
      title: "Offer not selected",
      body: "Another carrier was chosen for this load.",
      payload: { loadId },
      href: "/c",
    });
  }

  await notifyUser({
    userId: load.shipperId,
    type: "load.awarded",
    title: "Your load has been accepted",
    body: `${carrierLabel} was awarded ${routeLabel} at ${priceLabel}. Settlement is handled by the platform.`,
    payload: {
      loadId,
      applicationId: app.id,
      carrierId: app.applicantUserId,
      amount: Number(app.proposedPrice),
    },
    href: `/s/loads/${loadId}`,
  });

  return NextResponse.json({ ok: true });
}
