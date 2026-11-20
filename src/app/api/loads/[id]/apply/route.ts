import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyAdmins, notifyDriverById, notifyUser } from "@/lib/notify";

/** Company admin or individual carrier places a bid (price hidden shipper target). */
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
    return NextResponse.json(
      { error: "Load is not open for offers." },
      { status: 400 },
    );
  }

  const isCompanyAdmin = auth.user.role === "CARRIER_COMPANY_ADMIN";
  const company = isCompanyAdmin
    ? await prisma.carrierCompanyProfile.findUnique({
        where: { adminUserId: auth.user.id },
      })
    : null;

  const existing = await prisma.loadApplication.findFirst({
    where: {
      loadId,
      status: "PENDING",
      OR: [
        { applicantUserId: auth.user.id },
        ...(company ? [{ companyId: company.id }] : []),
      ],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already applied to this load." },
      { status: 409 },
    );
  }

  let vehicleId: string | null = body.vehicleId ? String(body.vehicleId) : null;
  let driverId: string | null = body.driverId ? String(body.driverId) : null;

  if (company && (vehicleId || driverId)) {
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, companyId: company.id },
      });
      if (!vehicle) {
        return NextResponse.json({ error: "Invalid vehicle." }, { status: 400 });
      }
    }
    if (driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: driverId,
          companyId: company.id,
          status: { not: "SUSPENDED" },
        },
      });
      if (!driver) {
        return NextResponse.json({ error: "Invalid driver." }, { status: 400 });
      }
      if (!vehicleId && driver.vehicleId) vehicleId = driver.vehicleId;
    }
  } else {
    vehicleId = null;
    driverId = null;
  }

  const routeLabel = `${load.pickupCity} → ${load.deliveryCity}`;

  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.loadApplication.create({
      data: {
        loadId,
        applicantUserId: auth.user.id,
        applicantType: isCompanyAdmin ? "COMPANY" : "INDIVIDUAL",
        companyId: company?.id ?? null,
        proposedPrice: price,
        message: body.message?.trim() || null,
        vehicleId,
        driverId,
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

  await notifyAdmins({
    type: "admin.application.created",
    title: "New bid on load",
    body: `${carrierLabel} bid €${price.toFixed(2)} on ${routeLabel}`,
    payload: {
      loadId,
      applicationId: application.id,
      carrierId: auth.user.id,
      carrierName: carrierLabel,
      proposedPrice: price,
    },
    href: `/admin/loads/${loadId}`,
  });

  // Optional: light ping to shipper that bids are coming (no amounts required)
  await notifyUser({
    userId: load.shipperId,
    type: "application.created",
    title: "New offer on your load",
    body: `A carrier bid on ${routeLabel}. Platform admin will review offers.`,
    payload: { loadId, applicationId: application.id },
    href: `/s/loads/${loadId}`,
  });

  if (driverId) {
    await notifyDriverById(driverId, {
      type: "application.driver_bid",
      title: "Company bid on a load for you",
      body: `${carrierLabel} offered €${price.toFixed(2)} on ${routeLabel}`,
      payload: { loadId, applicationId: application.id },
      href: `/c/loads/${loadId}`,
    });
  }

  return NextResponse.json({ ok: true, application });
}
