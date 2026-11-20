import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { getCompanyForAdmin } from "@/lib/fleet";

/** Latest locations for company fleet (or all for admin). */
export async function GET() {
  const auth = await requireRoles(
    "CARRIER_COMPANY_ADMIN",
    "SUPER_ADMIN",
  );
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  let userIds: string[] = [];

  if (auth.user.role === "SUPER_ADMIN") {
    const drivers = await prisma.driver.findMany({
      where: { userId: { not: null }, status: { not: "SUSPENDED" } },
      select: { userId: true, id: true, fullName: true },
    });
    userIds = drivers.map((d) => d.userId!).filter(Boolean);
  } else {
    const company = await getCompanyForAdmin(auth.user.id);
    if (!company) {
      return NextResponse.json({ error: "Company required." }, { status: 400 });
    }
    const drivers = await prisma.driver.findMany({
      where: {
        companyId: company.id,
        userId: { not: null },
        status: { not: "SUSPENDED" },
      },
      select: { userId: true },
    });
    userIds = drivers.map((d) => d.userId!).filter(Boolean);
  }

  if (!userIds.length) {
    return NextResponse.json({ locations: [] });
  }

  const [latest, drivers] = await Promise.all([
    prisma.driverLocationLatest.findMany({
      where: { userId: { in: userIds } },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.driver.findMany({
      where: { userId: { in: userIds } },
      select: {
        id: true,
        userId: true,
        fullName: true,
        vehicle: { select: { label: true, plateNumber: true } },
      },
    }),
  ]);

  const byUser = new Map(drivers.map((d) => [d.userId!, d]));

  return NextResponse.json({
    locations: latest.map((loc) => {
      const d = byUser.get(loc.userId);
      return {
        userId: loc.userId,
        driverId: d?.id ?? null,
        fullName: d?.fullName ?? "Driver",
        vehicleLabel: d?.vehicle
          ? `${d.vehicle.label} (${d.vehicle.plateNumber})`
          : null,
        lat: loc.lat,
        lng: loc.lng,
        speedMps: loc.speedMps,
        headingDeg: loc.headingDeg,
        accuracyM: loc.accuracyM,
        source: loc.source,
        recordedAt: loc.recordedAt.toISOString(),
      };
    }),
  });
}
