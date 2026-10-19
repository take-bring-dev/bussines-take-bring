import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession, roleHome, setAuthCookies } from "@/lib/auth/session";

type Body = {
  accountType: "shipper" | "carrier_individual" | "carrier_company";
  email: string;
  password: string;
  phone?: string;
  name?: string;
  companyName?: string;
  vatId?: string;
  contactName?: string;
  euLicense?: string;
  cmrPolicy?: string;
  fleetSize?: string;
  tradeRegNo?: string;
  vehicleType?: string;
  plateNumber?: string;
  maxPayloadKg?: number;
  billingStreet?: string;
  billingZip?: string;
  billingCity?: string;
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !email.includes("@")) return bad("Valid email is required.");
    if (password.length < 10) return bad("Password must be at least 10 characters.");
    if (!body.accountType) return bad("Account type is required.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return bad("An account with this email already exists.", 409);

    let role: UserRole;
    if (body.accountType === "shipper") role = "SHIPPER";
    else if (body.accountType === "carrier_individual") role = "CARRIER_INDIVIDUAL";
    else if (body.accountType === "carrier_company") role = "CARRIER_COMPANY_ADMIN";
    else return bad("Invalid account type.");

    const passwordHash = await hashPassword(password);
    const displayName =
      body.name?.trim() ||
      body.contactName?.trim() ||
      body.companyName?.trim() ||
      email.split("@")[0];

    // Pooler RTT can exceed default 5s interactive tx timeout
    const user = await prisma.$transaction(
      async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            passwordHash,
            role,
            name: displayName,
            phone: body.phone?.trim() || null,
            profile: { create: { kycStatus: "SUBMITTED" } },
          },
        });

        if (role === "SHIPPER") {
          await tx.shipperProfile.create({
            data: {
              userId: created.id,
              accountType: body.companyName ? "COMPANY" : "INDIVIDUAL",
              companyName: body.companyName?.trim() || null,
              vatId: body.vatId?.trim() || null,
              billingStreet: body.billingStreet?.trim() || "TBD",
              billingZip: body.billingZip?.trim() || "00000",
              billingCity: body.billingCity?.trim() || "TBD",
              contactName: body.contactName?.trim() || displayName,
              invoiceEmail: email,
            },
          });
        }

        if (role === "CARRIER_INDIVIDUAL") {
          await tx.carrierIndividualProfile.create({
            data: {
              userId: created.id,
              fullName: displayName,
              addressStreet: body.addressStreet?.trim() || "TBD",
              addressZip: body.addressZip?.trim() || "00000",
              addressCity: body.addressCity?.trim() || "TBD",
              vehicleClass: "VAN_3_5T",
              plateNumber: body.plateNumber?.trim() || "PENDING",
              maxPayloadKg: Number(body.maxPayloadKg) || 1000,
            },
          });
        }

        if (role === "CARRIER_COMPANY_ADMIN") {
          await tx.carrierCompanyProfile.create({
            data: {
              adminUserId: created.id,
              companyName: body.companyName?.trim() || displayName,
              vatId: body.vatId?.trim() || "PENDING",
              addressStreet: body.addressStreet?.trim() || "TBD",
              addressZip: body.addressZip?.trim() || "00000",
              addressCity: body.addressCity?.trim() || "TBD",
              adminPhone: body.phone?.trim() || null,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            actorId: created.id,
            action: "auth.register",
            entityType: "user",
            entityId: created.id,
            meta: {
              role,
              accountType: body.accountType,
              euLicense: body.euLicense?.trim() || null,
              cmrPolicy: body.cmrPolicy?.trim() || null,
              fleetSize: body.fleetSize?.trim() || null,
              tradeRegNo: body.tradeRegNo?.trim() || null,
              vehicleType: body.vehicleType?.trim() || null,
            },
          },
        });

        return created;
      },
      { maxWait: 10_000, timeout: 30_000 },
    );

    const tokens = await createSession(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || user.email,
      },
      {
        userAgent: request.headers.get("user-agent") || undefined,
      },
    );

    const response = NextResponse.json({
      ok: true,
      // New accounts land on Step 3 activation / KYC pending (not full dashboard yet)
      redirectTo: user.role === "SUPER_ADMIN" ? roleHome(user.role) : "/activation",
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error("register error", error);
    return bad("Registration failed. Please try again.", 500);
  }
}
