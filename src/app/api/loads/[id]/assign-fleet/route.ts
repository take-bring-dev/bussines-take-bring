import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { getCompanyForAdmin } from "@/lib/fleet";
import { notifyDriverById } from "@/lib/notify";

/** Assign / reassign vehicle + driver on the awarded application. */
export async function POST(
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

  const { id: loadId } = await context.params;
  const body = await request.json();
  let vehicleId: string | null = body.vehicleId ? String(body.vehicleId) : null;
  let driverId: string | null = body.driverId ? String(body.driverId) : null;

  const application = await prisma.loadApplication.findFirst({
    where: {
      loadId,
      status: "ACCEPTED",
      companyId: company.id,
    },
    include: {
      load: {
        select: { pickupCity: true, deliveryCity: true },
      },
    },
  });
  if (!application) {
    return NextResponse.json(
      { error: "No awarded application for this load." },
      { status: 404 },
    );
  }

  const previousDriverId = application.driverId;

  if (driverId) {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId: company.id, status: { not: "SUSPENDED" } },
    });
    if (!driver) {
      return NextResponse.json({ error: "Invalid driver." }, { status: 400 });
    }
    if (!vehicleId && driver.vehicleId) vehicleId = driver.vehicleId;
  }
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId: company.id },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Invalid vehicle." }, { status: 400 });
    }
  }

  const updated = await prisma.loadApplication.update({
    where: { id: application.id },
    data: { vehicleId, driverId },
    include: { vehicle: true, driver: true },
  });

  if (driverId && driverId !== previousDriverId) {
    const route = `${application.load.pickupCity} → ${application.load.deliveryCity}`;
    await notifyDriverById(driverId, {
      type: "application.driver_assigned",
      title: "You were assigned a load",
      body: `Your company assigned you to ${route}.`,
      payload: { loadId, applicationId: application.id },
      href: `/c/loads/${loadId}`,
    });
  }

  return NextResponse.json({ ok: true, application: updated });
}
