import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      language: true,
      shipperProfile: {
        select: {
          companyName: true,
          vatId: true,
          contactName: true,
          invoiceEmail: true,
          billingCity: true,
          billingCountry: true,
        },
      },
      carrierIndividual: {
        select: {
          fullName: true,
          vatId: true,
          addressCity: true,
          addressCountry: true,
        },
      },
      carrierCompanyAdmin: {
        select: {
          companyName: true,
          vatId: true,
          adminPhone: true,
          addressCity: true,
          addressCountry: true,
        },
      },
      profile: { select: { kycStatus: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, 120) : undefined;
  const phone =
    typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : undefined;

  if (name === undefined && phone === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      ...(name !== undefined ? { name: name || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
