import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyAdmins, notifyUser } from "@/lib/notify";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles(
    "CARRIER_INDIVIDUAL",
    "CARRIER_COMPANY_ADMIN",
  );
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: loadId } = await context.params;
  const body = await request.json();
  const price = Number(body.proposedPrice);
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Valid price required." }, { status: 400 });
  }

  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load || !["PUBLISHED", "RECEIVING_OFFERS"].includes(load.status)) {
    return NextResponse.json({ error: "Load is not open for offers." }, { status: 400 });
  }

  const existing = await prisma.loadApplication.findFirst({
    where: {
      loadId,
      applicantUserId: auth.user.id,
      status: "PENDING",
    },
  });
  if (existing) {
    return NextResponse.json({ error: "You already applied to this load." }, { status: 409 });
  }

  const company =
    auth.user.role === "CARRIER_COMPANY_ADMIN"
      ? await prisma.carrierCompanyProfile.findUnique({
          where: { adminUserId: auth.user.id },
        })
      : null;

  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.loadApplication.create({
      data: {
        loadId,
        applicantUserId: auth.user.id,
        applicantType:
          auth.user.role === "CARRIER_COMPANY_ADMIN" ? "COMPANY" : "INDIVIDUAL",
        companyId: company?.id ?? null,
        proposedPrice: price,
        message: body.message?.trim() || null,
      },
    });

    if (load.status === "PUBLISHED") {
      await tx.load.update({
        where: { id: loadId },
        data: { status: "RECEIVING_OFFERS" },
      });
    }

    return created;
  });

  const carrierLabel = auth.user.name || auth.user.email || "A carrier";
  const offerBody = `${carrierLabel} offered €${price.toFixed(2)}`;

  await notifyUser({
    userId: load.shipperId,
    type: "application.created",
    title: "New offer on your load",
    body: offerBody,
    payload: { loadId, applicationId: application.id },
    href: `/s/loads/${loadId}`,
  });

  await notifyAdmins({
    type: "admin.application.created",
    title: "Carrier submitted an offer",
    body: `${carrierLabel} bid €${price.toFixed(2)} on ${load.pickupCity} → ${load.deliveryCity}`,
    payload: {
      loadId,
      applicationId: application.id,
      carrierId: auth.user.id,
      carrierName: carrierLabel,
    },
    href: `/admin/loads/${loadId}`,
  });

  return NextResponse.json({ ok: true, application });
}
