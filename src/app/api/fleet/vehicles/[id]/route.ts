import { NextResponse } from "next/server";
import type { VehicleClass, VehicleStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { getCompanyForAdmin } from "@/lib/fleet";

const VEHICLE_CLASSES: VehicleClass[] = [
  "CAR",
  "VAN_3_5T",
  "TRUCK_7_5T",
  "TRUCK_12T",
  "TRUCK_24T",
  "TRUCK_40T",
  "OTHER",
];

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
  const existing = await prisma.vehicle.findFirst({
    where: { id, companyId: company.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.label != null) data.label = String(body.label).trim();
  if (body.plateNumber != null) {
    data.plateNumber = String(body.plateNumber).trim().toUpperCase();
  }
  if (body.vehicleClass != null) {
    const v = String(body.vehicleClass).toUpperCase().replace(/[-\s]/g, "_");
    if (VEHICLE_CLASSES.includes(v as VehicleClass)) {
      data.vehicleClass = v;
    }
  }
  if (body.payloadKg != null) data.payloadKg = Math.round(Number(body.payloadKg));
  if (body.volumeM3 !== undefined) {
    data.volumeM3 = body.volumeM3 == null ? null : Number(body.volumeM3);
  }
  if (body.palletSpaces !== undefined) {
    data.palletSpaces =
      body.palletSpaces == null ? null : Number(body.palletSpaces);
  }
  if (body.hasTailLift != null) data.hasTailLift = Boolean(body.hasTailLift);
  if (body.hasCurtainSide != null) {
    data.hasCurtainSide = Boolean(body.hasCurtainSide);
  }
  if (body.adrCapable != null) data.adrCapable = Boolean(body.adrCapable);
  if (body.status != null) data.status = body.status as VehicleStatus;

  try {
    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json({ ok: true, vehicle });
  } catch {
    return NextResponse.json({ error: "Could not update vehicle." }, { status: 400 });
  }
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
  const existing = await prisma.vehicle.findFirst({
    where: { id, companyId: company.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  }

  await prisma.driver.updateMany({
    where: { vehicleId: id },
    data: { vehicleId: null },
  });
  await prisma.vehicle.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
