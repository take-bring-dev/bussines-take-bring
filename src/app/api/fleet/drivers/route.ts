import { NextResponse } from "next/server";
import type { DriverStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requireRoles } from "@/lib/auth/session";
import { generateTempPassword, getCompanyForAdmin } from "@/lib/fleet";
import { notifyUser } from "@/lib/notify";

export async function GET() {
  const auth = await requireRoles("CARRIER_COMPANY_ADMIN", "SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const company = await getCompanyForAdmin(auth.user.id);
  if (!company) {
    return NextResponse.json({ error: "Company profile required." }, { status: 400 });
  }

  const drivers = await prisma.driver.findMany({
    where: { companyId: company.id },
    include: {
      vehicle: true,
      user: {
        select: {
          id: true,
          email: true,
          status: true,
          locationLatest: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    drivers: drivers.map((d) => ({
      ...d,
      hasIngestToken: Boolean(d.ingestToken),
      // Never expose full token in list — use rotate endpoint to reveal.
      ingestToken: undefined,
    })),
  });
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
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = body.phone ? String(body.phone).trim() : null;
  const licenceClass = body.licenceClass
    ? String(body.licenceClass).trim()
    : null;
  const vehicleId = body.vehicleId ? String(body.vehicleId) : null;

  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Full name and email are required." },
      { status: 400 },
    );
  }

  if (vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId: company.id },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found." }, { status: 400 });
    }
    const taken = await prisma.driver.findFirst({
      where: { vehicleId, status: { not: "SUSPENDED" } },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That truck is already assigned to another driver." },
        { status: 409 },
      );
    }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  const tempPassword =
    typeof body.password === "string" && body.password.length >= 8
      ? body.password
      : generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "CARRIER_DRIVER",
        status: "ACTIVE",
        name: fullName,
        phone,
        profile: { create: { kycStatus: "APPROVED" } },
      },
    });

    if (vehicleId) {
      await tx.driver.updateMany({
        where: { vehicleId, companyId: company.id },
        data: { vehicleId: null },
      });
    }

    const driver = await tx.driver.create({
      data: {
        companyId: company.id,
        userId: user.id,
        fullName,
        email,
        phone,
        licenceClass,
        vehicleId,
        status: "ACTIVE" as DriverStatus,
        trackingEnabled: body.trackingEnabled !== false,
      },
      include: { vehicle: true },
    });

    return { user, driver };
  });

  await notifyUser({
    userId: result.user.id,
    type: "driver.invited",
    title: "You were added as a driver",
    body: `${company.companyName} added you to their fleet. Sign in with your email.`,
    href: "/c",
  });

  return NextResponse.json(
    {
      ok: true,
      driver: result.driver,
      temporaryPassword: tempPassword,
    },
    { status: 201 },
  );
}
