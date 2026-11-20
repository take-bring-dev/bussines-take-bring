import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { getCompanyForAdmin, getDriverForUser } from "@/lib/fleet";

/** Latest (+ optional trail) for one driver user. */
export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const auth = await requireRoles(
    "CARRIER_COMPANY_ADMIN",
    "CARRIER_DRIVER",
    "CARRIER_INDIVIDUAL",
    "SHIPPER",
    "SUPER_ADMIN",
  );
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { userId } = await context.params;
  const url = new URL(request.url);
  const trail = url.searchParams.get("trail") === "1";
  const loadId = url.searchParams.get("loadId");

  const allowed = await canViewLocation(auth.user, userId, loadId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const latest = await prisma.driverLocationLatest.findUnique({
    where: { userId },
  });

  let points: Array<{
    lat: number;
    lng: number;
    recordedAt: string;
    source: string;
  }> = [];

  if (trail) {
    const rows = await prisma.driverLocationPoint.findMany({
      where: {
        userId,
        ...(loadId ? { loadId } : {}),
        recordedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { recordedAt: "asc" },
      take: 500,
      select: { lat: true, lng: true, recordedAt: true, source: true },
    });
    points = rows.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      recordedAt: p.recordedAt.toISOString(),
      source: p.source,
    }));
  }

  return NextResponse.json({
    latest: latest
      ? {
          lat: latest.lat,
          lng: latest.lng,
          speedMps: latest.speedMps,
          headingDeg: latest.headingDeg,
          accuracyM: latest.accuracyM,
          source: latest.source,
          recordedAt: latest.recordedAt.toISOString(),
        }
      : null,
    points,
  });
}

async function canViewLocation(
  user: { id: string; role: string },
  targetUserId: string,
  loadId: string | null,
) {
  if (user.role === "SUPER_ADMIN") return true;
  if (user.id === targetUserId) return true;

  if (user.role === "CARRIER_COMPANY_ADMIN") {
    const company = await getCompanyForAdmin(user.id);
    if (!company) return false;
    const driver = await prisma.driver.findFirst({
      where: { userId: targetUserId, companyId: company.id },
    });
    return Boolean(driver);
  }

  if (user.role === "SHIPPER" && loadId) {
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        shipperId: user.id,
        status: { in: ["ASSIGNED", "IN_TRANSIT", "DELIVERED"] },
      },
      include: {
        applications: {
          where: { status: "ACCEPTED" },
          take: 1,
          include: { driver: { select: { userId: true } } },
        },
      },
    });
    const app = load?.applications[0];
    if (!app) return false;
    if (app.driver?.userId === targetUserId) return true;
    // Individual carrier: applicant is the tracker
    if (app.applicantUserId === targetUserId) return true;
  }

  if (user.role === "CARRIER_DRIVER") {
    const me = await getDriverForUser(user.id);
    return me?.userId === targetUserId;
  }

  return false;
}
