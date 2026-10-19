import { NextResponse } from "next/server";
import { createEscrowForAward } from "@/lib/escrow";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyUser, notifyUsers } from "@/lib/notify";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("SHIPPER");
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
  if (!load || load.shipperId !== auth.user.id) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const app = await tx.loadApplication.findUnique({ where: { id: applicationId } });
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
      where: { loadId, id: { not: applicationId } },
      select: { applicantUserId: true },
    });

    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "load.accept_offer",
        entityType: "load",
        entityId: loadId,
        meta: { applicationId },
      },
    });

    return { app, others };
  }).catch((e) => {
    if (e instanceof Error && e.message === "INVALID_APPLICATION") return null;
    throw e;
  });

  if (!result) {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  const { app, others } = result;

  const escrow = await createEscrowForAward({
    loadId,
    applicationId: app.id,
    shipperId: load.shipperId,
    carrierUserId: app.applicantUserId,
    amount: Number(app.proposedPrice),
    currency: app.currency,
  });

  await notifyUser({
    userId: app.applicantUserId,
    type: "application.accepted",
    title: "Offer accepted",
    body: "Your offer was accepted. Prepare for pickup — shipper will fund escrow.",
    payload: { loadId, applicationId: app.id },
    href: `/c/loads/${loadId}`,
  });

  if (others.length) {
    await notifyUsers(
      others.map((o) => o.applicantUserId),
      {
        type: "application.rejected",
        title: "Offer not selected",
        body: "Another carrier was chosen for this load.",
        payload: { loadId },
        href: "/c",
      },
    );
  }

  await notifyUser({
    userId: load.shipperId,
    type: "escrow.pay_due",
    title: "Pay escrow for awarded load",
    body: `Fund ${Number(app.proposedPrice).toFixed(2)} ${app.currency} to lock the contract.`,
    payload: { loadId, escrowId: escrow.id },
    href: "/s/billing",
  });

  return NextResponse.json({
    ok: true,
    escrow: { id: escrow.id, status: escrow.status },
  });
}
