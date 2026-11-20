import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { getCompanyForAdmin } from "@/lib/fleet";
import {
  generateIngestToken,
  gpsLoggerUrlTemplate,
  hashTokenHint,
  traccarIngestUrl,
} from "@/lib/location-ingest";

async function loadOwnedDriver(adminUserId: string, driverId: string) {
  const company = await getCompanyForAdmin(adminUserId);
  if (!company) return null;
  return prisma.driver.findFirst({
    where: { id: driverId, companyId: company.id },
    select: {
      id: true,
      fullName: true,
      ingestToken: true,
      ingestTokenAt: true,
      trackingEnabled: true,
      userId: true,
    },
  });
}

/** Current GPS link status (token masked). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await context.params;
  const driver = await loadOwnedDriver(auth.user.id, id);
  if (!driver) {
    return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  }

  const hasToken = Boolean(driver.ingestToken);
  return NextResponse.json({
    hasToken,
    tokenHint: driver.ingestToken ? hashTokenHint(driver.ingestToken) : null,
    ingestTokenAt: driver.ingestTokenAt?.toISOString() ?? null,
    trackingEnabled: driver.trackingEnabled,
    serverUrl: hasToken ? traccarIngestUrl(driver.ingestToken!) : null,
    // Full token only returned on rotate — not here
  });
}

/** Create / rotate ingest token and return full credentials once. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await context.params;
  const driver = await loadOwnedDriver(auth.user.id, id);
  if (!driver) {
    return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  }
  if (!driver.userId) {
    return NextResponse.json(
      { error: "Driver has no login user." },
      { status: 400 },
    );
  }

  const token = generateIngestToken();
  await prisma.driver.update({
    where: { id },
    data: {
      ingestToken: token,
      ingestTokenAt: new Date(),
      trackingEnabled: true,
    },
  });

  return NextResponse.json({
    ok: true,
    token,
    tokenHint: hashTokenHint(token),
    serverUrl: traccarIngestUrl(token),
    deviceIdentifier: token,
    gpsLoggerUrl: gpsLoggerUrlTemplate(token),
    instructions: {
      traccar: [
        "Install Traccar Client on the driver’s phone",
        `Server URL: ${traccarIngestUrl(token)}`,
        `Device identifier: ${token}`,
        "Enable location Always / unrestricted battery",
        "Start the service — pings keep working when TBD is closed",
      ],
    },
  });
}
