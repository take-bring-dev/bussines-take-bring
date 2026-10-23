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

function parseClass(raw?: string): VehicleClass {
  const v = (raw || "").toUpperCase().replace(/[-\s]/g, "_") as VehicleClass;
  return VEHICLE_CLASSES.includes(v) ? v : "VAN_3_5T";
}

export async function GET() {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN", "SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const company = await getCompanyForAdmin(auth.user.id);
  if (!company) {
    return NextResponse.json({ error: "Company profile required." }, { status: 400 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: company.id },
    include: {
      drivers: {
        select: { id: true, fullName: true, status: true, userId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const company = await getCompanyForAdmin(auth.user.id);
  if (!company) {
    return NextResponse.json({ error: "Company profile required." }, { status: 400 });
  }

  const body = await request.json();
  const label = String(body.label || "").trim();
  const plateNumber = String(body.plateNumber || "").trim().toUpperCase();
  const payloadKg = Number(body.payloadKg);

  if (!label || !plateNumber) {
    return NextResponse.json(
      { error: "Label and plate number are required." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(payloadKg) || payloadKg <= 0) {
    return NextResponse.json({ error: "Valid payload kg required." }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: company.id,
        label,
        plateNumber,
        vehicleClass: parseClass(body.vehicleClass),
        payloadKg: Math.round(payloadKg),
        volumeM3: body.volumeM3 != null ? Number(body.volumeM3) : null,
        palletSpaces: body.palletSpaces != null ? Number(body.palletSpaces) : null,
        hasTailLift: Boolean(body.hasTailLift),
        hasCurtainSide: Boolean(body.hasCurtainSide),
        adrCapable: Boolean(body.adrCapable),
        status: (body.status as VehicleStatus) || "ACTIVE",
      },
    });
    return NextResponse.json({ ok: true, vehicle }, { status: 201 });
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "code" in e && e.code === "P2002"
      ? "A vehicle with this plate already exists."
      : "Could not create vehicle.";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
