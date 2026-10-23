import { NextResponse } from "next/server";
import type { DriverStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { getCompanyForAdmin } from "@/lib/fleet";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN", "SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const company = await getCompanyForAdmin(auth.user.id);
  if (!company && auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Company profile required." }, { status: 400 });
  }

  const { id } = await context.params;
  const driver = await prisma.driver.findFirst({
    where: {
      id,
      ...(company ? { companyId: company.id } : {}),
    },
    include: {
      vehicle: true,
      user: { select: { id: true, email: true, status: true } },
    },
  });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  }

  const applications = await prisma.loadApplication.findMany({
    where: { driverId: driver.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      load: {
        select: {
          id: true,
          reference: true,
          status: true,
          pickupCity: true,
          pickupCountry: true,
          deliveryCity: true,
          deliveryCountry: true,
          weightKg: true,
          pickupWindowStart: true,
          pickupWindowEnd: true,
        },
      },
    },
  });

  return NextResponse.json({
    driver,
    applications: applications.map((a) => ({
      id: a.id,
      status: a.status,
      proposedPrice: Number(a.proposedPrice),
      currency: a.currency,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      load: {
        id: a.load.id,
        reference: a.load.reference,
        status: a.load.status,
        pickupCity: a.load.pickupCity,
        pickupCountry: a.load.pickupCountry,
        deliveryCity: a.load.deliveryCity,
        deliveryCountry: a.load.deliveryCountry,
        weightKg: a.load.weightKg,
        pickupWindowStart: a.load.pickupWindowStart.toISOString(),
        pickupWindowEnd: a.load.pickupWindowEnd.toISOString(),
      },
    })),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const company = await getCompanyForAdmin(auth.user.id);
  if (!company) {
    return NextResponse.json({ error: "Company profile required." }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await prisma.driver.findFirst({
    where: { id, companyId: company.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.fullName != null) data.fullName = String(body.fullName).trim();
  if (body.phone !== undefined) {
    data.phone = body.phone ? String(body.phone).trim() : null;
  }
  if (body.licenceClass !== undefined) {
    data.licenceClass = body.licenceClass
      ? String(body.licenceClass).trim()
      : null;
  }
  if (body.status != null) data.status = body.status as DriverStatus;
  if (body.trackingEnabled != null) {
    data.trackingEnabled = Boolean(body.trackingEnabled);
  }

  if (body.vehicleId !== undefined) {
    const vehicleId = body.vehicleId ? String(body.vehicleId) : null;
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, companyId: company.id },
      });
      if (!vehicle) {
        return NextResponse.json({ error: "Vehicle not found." }, { status: 400 });
      }
      const taken = await prisma.driver.findFirst({
        where: {
          vehicleId,
          companyId: company.id,
          id: { not: id },
          status: { not: "SUSPENDED" },
        },
      });
      if (taken) {
        return NextResponse.json(
          { error: "That truck is already assigned to another driver." },
          { status: 409 },
        );
      }
      await prisma.driver.updateMany({
        where: { vehicleId, companyId: company.id, id: { not: id } },
        data: { vehicleId: null },
      });
    }
    data.vehicleId = vehicleId;
  }

  const driver = await prisma.driver.update({
    where: { id },
    data,
    include: { vehicle: true, user: { select: { id: true, email: true } } },
  });

  return NextResponse.json({ ok: true, driver });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const company = await getCompanyForAdmin(auth.user.id);
  if (!company) {
    return NextResponse.json({ error: "Company profile required." }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await prisma.driver.findFirst({
    where: { id, companyId: company.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  }

  await prisma.driver.update({
    where: { id },
    data: { status: "SUSPENDED", vehicleId: null },
  });

  if (existing.userId) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { status: "SUSPENDED" },
    });
  }

  return NextResponse.json({ ok: true });
}
