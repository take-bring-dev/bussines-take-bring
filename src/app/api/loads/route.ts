import { NextResponse } from "next/server";
import type { VehicleClass } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyUsers } from "@/lib/notify";

const VEHICLE_MAP: Record<string, VehicleClass> = {
  car: "CAR",
  van: "VAN_3_5T",
  "van_3_5t": "VAN_3_5T",
  truck: "TRUCK_7_5T",
  "7.5t": "TRUCK_7_5T",
  "12t": "TRUCK_12T",
  "24t": "TRUCK_24T",
  "40t": "TRUCK_40T",
};

function parseVehicle(raw?: string): VehicleClass {
  if (!raw) return "VAN_3_5T";
  const key = raw.trim().toLowerCase();
  return VEHICLE_MAP[key] ?? "VAN_3_5T";
}

/** List loads for current role */
export async function GET() {
  const auth = await requireRoles(
    "SHIPPER",
    "CARRIER_INDIVIDUAL",
    "CARRIER_COMPANY_ADMIN",
    "CARRIER_DRIVER",
    "SUPER_ADMIN",
  );
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  if (auth.user.role === "SHIPPER") {
    const loads = await prisma.load.findMany({
      where: { shipperId: auth.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { applications: true } },
      },
      take: 50,
    });
    return NextResponse.json({ loads });
  }

  if (auth.user.role === "SUPER_ADMIN") {
    const loads = await prisma.load.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        shipper: { select: { email: true, name: true } },
        _count: { select: { applications: true } },
      },
      take: 100,
    });
    return NextResponse.json({ loads });
  }

  // Carriers see published / receiving offers
  const loads = await prisma.load.findMany({
    where: { status: { in: ["PUBLISHED", "RECEIVING_OFFERS"] } },
    orderBy: { publishedAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
    take: 50,
  });
  return NextResponse.json({ loads });
}

/** Shipper creates + optionally publishes a load */
export async function POST(request: Request) {
  const auth = await requireRoles("SHIPPER");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const publish = Boolean(body.publish);
    const now = new Date();
    const pickupStart = body.pickupWindowStart
      ? new Date(body.pickupWindowStart)
      : new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const pickupEnd = body.pickupWindowEnd
      ? new Date(body.pickupWindowEnd)
      : new Date(pickupStart.getTime() + 4 * 60 * 60 * 1000);
    const deliveryStart = body.deliveryWindowStart
      ? new Date(body.deliveryWindowStart)
      : new Date(pickupEnd.getTime() + 4 * 60 * 60 * 1000);
    const deliveryEnd = body.deliveryWindowEnd
      ? new Date(body.deliveryWindowEnd)
      : new Date(deliveryStart.getTime() + 4 * 60 * 60 * 1000);

    const load = await prisma.$transaction(
      async (tx) => {
        const created = await tx.load.create({
          data: {
            shipperId: auth.user.id,
            reference: body.reference?.trim() || null,
            title: body.title?.trim() || null,
            status: publish ? "RECEIVING_OFFERS" : "DRAFT",
            pickupCompany: body.pickupCompany?.trim() || null,
            pickupStreet: body.pickupStreet?.trim() || body.pickupCity?.trim() || "TBD",
            pickupZip: body.pickupZip?.trim() || "00000",
            pickupCity: body.pickupCity?.trim() || "TBD",
            pickupCountry: body.pickupCountry?.trim() || "DE",
            pickupContactName: body.pickupContactName?.trim() || auth.user.name,
            pickupContactPhone: body.pickupContactPhone?.trim() || "n/a",
            pickupWindowStart: pickupStart,
            pickupWindowEnd: pickupEnd,
            deliveryCompany: body.deliveryCompany?.trim() || null,
            deliveryStreet: body.deliveryStreet?.trim() || body.deliveryCity?.trim() || "TBD",
            deliveryZip: body.deliveryZip?.trim() || "00000",
            deliveryCity: body.deliveryCity?.trim() || "TBD",
            deliveryCountry: body.deliveryCountry?.trim() || "DE",
            deliveryContactName: body.deliveryContactName?.trim() || "Receiver",
            deliveryContactPhone: body.deliveryContactPhone?.trim() || "n/a",
            deliveryWindowStart: deliveryStart,
            deliveryWindowEnd: deliveryEnd,
            cargoDescription: body.cargoDescription?.trim() || "General cargo",
            weightKg: Number(body.weightKg) || 100,
            palletCount: body.palletCount != null ? Number(body.palletCount) : null,
            stackable: Boolean(body.stackable),
            hazardous: Boolean(body.hazardous),
            temperatureControl: Boolean(body.temperatureControl),
            loadingHelpNeeded: Boolean(body.loadingHelpNeeded),
            requiredVehicleClass: parseVehicle(body.requiredVehicleClass),
            suggestedBudgetEur:
              body.suggestedBudgetEur != null && body.suggestedBudgetEur !== ""
                ? Number(body.suggestedBudgetEur)
                : null,
            notes: body.notes?.trim() || null,
            publishedAt: publish ? now : null,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: publish ? "load.publish" : "load.draft",
            entityType: "load",
            entityId: created.id,
          },
        });

        return created;
      },
      { maxWait: 10_000, timeout: 30_000 },
    );

    if (publish) {
      const carriers = await prisma.user.findMany({
        where: {
          status: "ACTIVE",
          role: { in: ["CARRIER_INDIVIDUAL", "CARRIER_COMPANY_ADMIN"] },
        },
        select: { id: true },
      });
      if (carriers.length) {
        await notifyUsers(
          carriers.map((c) => c.id),
          {
            type: "load.published",
            title: "New load available",
            body: `${load.pickupCity} → ${load.deliveryCity} · ${load.weightKg} kg`,
            payload: { loadId: load.id },
            href: "/c",
          },
        );
      }
    }

    return NextResponse.json({ ok: true, load });
  } catch (error) {
    console.error("create load", error);
    return NextResponse.json({ error: "Could not create load." }, { status: 500 });
  }
}
