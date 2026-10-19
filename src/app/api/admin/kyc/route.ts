import { NextResponse } from "next/server";
import type { KycStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyUser } from "@/lib/notify";

export async function GET() {
  const auth = await requireRoles("SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const queue = await prisma.profile.findMany({
    where: { kycStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { updatedAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      },
    },
    take: 100,
  });

  return NextResponse.json({ queue });
}

export async function PATCH(request: Request) {
  const auth = await requireRoles("SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = await request.json();
  const userId = body.userId as string;
  const status = body.status as KycStatus;
  const note = body.note?.trim() || null;

  if (!userId || !["APPROVED", "REJECTED", "UNDER_REVIEW"].includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { userId },
      data: { kycStatus: status, kycNote: note },
    });
    await tx.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: `kyc.${status.toLowerCase()}`,
        entityType: "user",
        entityId: userId,
        meta: { note },
      },
    });
  });

  await notifyUser({
    userId,
    type: status === "APPROVED" ? "kyc.approved" : "kyc.rejected",
    title: status === "APPROVED" ? "KYC approved" : "KYC rejected",
    body:
      status === "APPROVED"
        ? "You can now publish loads / apply to jobs."
        : note || "Please update your documents and resubmit.",
    href: "/activation",
  });

  return NextResponse.json({ ok: true });
}
