import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyUser } from "@/lib/notify";

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

  if (["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"].includes(load.status)) {
    return NextResponse.json({ error: "Load already closed." }, { status: 400 });
  }

  const app = await prisma.loadApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app || app.loadId !== loadId || app.status !== "PENDING") {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.loadApplication.update({
      where: { id: applicationId },
      data: { status: "REJECTED" },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "load.reject_offer",
        entityType: "load",
        entityId: loadId,
        meta: { applicationId },
      },
    });
  });

  await notifyUser({
    userId: app.applicantUserId,
    type: "application.rejected",
    title: "Offer rejected",
    body: "The shipper declined this offer.",
    payload: { loadId, applicationId },
    href: `/c/loads/${loadId}`,
  });

  return NextResponse.json({ ok: true });
}
