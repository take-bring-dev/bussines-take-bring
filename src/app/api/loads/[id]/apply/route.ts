import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyAdmins, notifyDriverById, notifyUser } from "@/lib/notify";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles(
    "CARRIER_INDIVIDUAL",
    "CARRIER_COMPANY_ADMIN",
    "CARRIER_DRIVER",
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

  const isDriver = auth.user.role === "CARRIER_DRIVER";
  const isCompanyAdmin = auth.user.role === "CARRIER_COMPANY_ADMIN";

  const driverRow = isDriver
    ? await prisma.driver.findUnique({
        where: { userId: auth.user.id },
        include: { company: true },
      })
    : null;

  if (isDriver && (!driverRow || driverRow.status === "SUSPENDED")) {
    return NextResponse.json(
      { error: "Driver profile required to bid." },
      { status: 400 },
    );
  }

  const company = isCompanyAdmin
    ? await prisma.carrierCompanyProfile.findUnique({
        where: { adminUserId: auth.user.id },
      })
    : driverRow?.company ?? null;

  // Driver bids on behalf of their company — escrow stays with company admin.
  const applicantUserId =
    isDriver && company ? company.adminUserId : auth.user.id;
  const applicantType =
    isCompanyAdmin || isDriver
      ? ("COMPANY" as const)
      : ("INDIVIDUAL" as const);

  const existing = await prisma.loadApplication.findFirst({
    where: {
      loadId,
      status: "PENDING",
      OR: [
        { applicantUserId },
        ...(company ? [{ companyId: company.id }] : []),
        ...(driverRow ? [{ driverId: driverRow.id }] : []),
      ],
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: isDriver
          ? "Your company already has an open bid on this load."
          : "You already applied to this load.",
      },
      { status: 409 },
    );
  }

  let vehicleId: string | null = body.vehicleId ? String(body.vehicleId) : null;
  let driverId: string | null = body.driverId ? String(body.driverId) : null;

  if (isDriver && driverRow) {
    driverId = driverRow.id;
    vehicleId = vehicleId || driverRow.vehicleId;
  } else if (company && (vehicleId || driverId)) {
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
  } else if (!company) {
    vehicleId = null;
    driverId = null;
  }

  const routeLabel = `${load.pickupCity} → ${load.deliveryCity}`;

  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.loadApplication.create({
      data: {
        loadId,
        applicantUserId,
        applicantType,
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

  const bidderLabel =
    isDriver && driverRow
      ? driverRow.fullName
      : auth.user.name || auth.user.email || "A carrier";
  const offerBody = isDriver
    ? `Driver ${bidderLabel} offered €${price.toFixed(2)}`
    : `${bidderLabel} offered €${price.toFixed(2)}`;

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
    body: `${bidderLabel} bid €${price.toFixed(2)} on ${routeLabel}`,
    payload: {
      loadId,
      applicationId: application.id,
      carrierId: applicantUserId,
      carrierName: bidderLabel,
    },
    href: `/admin/loads/${loadId}`,
  });

  // Company admin bid with a driver selected → notify that driver
  if (!isDriver && driverId) {
    await notifyDriverById(driverId, {
      type: "application.driver_bid",
      title: "Company bid on a load for you",
      body: `${bidderLabel} offered €${price.toFixed(2)} on ${routeLabel}`,
      payload: { loadId, applicationId: application.id },
      href: `/c/loads/${loadId}`,
    });
  }

  // Driver placed the bid → notify their company admin
  if (isDriver && company && company.adminUserId !== auth.user.id) {
    await notifyUser({
      userId: company.adminUserId,
      type: "application.driver_submitted",
      title: "Driver placed a bid",
      body: `${bidderLabel} bid €${price.toFixed(2)} on ${routeLabel}`,
      payload: {
        loadId,
        applicationId: application.id,
        driverId: driverRow!.id,
      },
      href: `/c/loads/${loadId}`,
    });
  }

  return NextResponse.json({ ok: true, application });
}
