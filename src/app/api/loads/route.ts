import { NextResponse } from "next/server";
import type { VehicleClass } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyAdmins } from "@/lib/notify";

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

  // Company drivers do not browse the open board
  if (auth.user.role === "CARRIER_DRIVER") {
    return NextResponse.json({ loads: [] });
  }

  // Carriers / individuals see open board (no shipper price in list payload)
  const loads = await prisma.load.findMany({
    where: { status: { in: ["PUBLISHED", "RECEIVING_OFFERS"] } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      reference: true,
      status: true,
      pickupCity: true,
      pickupZip: true,
      pickupCountry: true,
      pickupCompany: true,
      pickupStreet: true,
      pickupWindowStart: true,
      pickupWindowEnd: true,
      deliveryCity: true,
      deliveryZip: true,
      deliveryCountry: true,
      deliveryCompany: true,
      deliveryStreet: true,
      deliveryWindowStart: true,
      deliveryWindowEnd: true,
      cargoDescription: true,
      weightKg: true,
      palletCount: true,
      hazardous: true,
      requiredVehicleClass: true,
      publishedAt: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
    take: 50,
  });
  return NextResponse.json({ loads });
}

/**
 * Shipper creates a draft or submits to super admin (PENDING_ADMIN).
 * Carriers never see the load until admin publishes.
 */
export async function POST(request: Request) {
  const auth = await requireRoles("SHIPPER");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const submit = Boolean(body.publish); // "publish" from form = submit for admin
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

    const budget =
      body.suggestedBudgetEur != null && body.suggestedBudgetEur !== ""
        ? Number(body.suggestedBudgetEur)
        : null;

    if (submit && (budget == null || !Number.isFinite(budget) || budget <= 0)) {
      return NextResponse.json(
        { error: "Price is required when submitting a load." },
        { status: 400 },
      );
    }

    const load = await prisma.$transaction(
      async (tx) => {
        const created = await tx.load.create({
          data: {
            shipperId: auth.user.id,
            reference: body.reference?.trim() || null,
            title: body.title?.trim() || null,
            status: submit ? "PENDING_ADMIN" : "DRAFT",
            pickupCompany: body.pickupCompany?.trim() || null,
            pickupStreet:
              body.pickupStreet?.trim() || body.pickupCity?.trim() || "TBD",
            pickupZip: body.pickupZip?.trim() || "00000",
            pickupCity: body.pickupCity?.trim() || "TBD",
            pickupCountry: body.pickupCountry?.trim() || "DE",
            pickupContactName: body.pickupContactName?.trim() || auth.user.name,
            pickupContactPhone: body.pickupContactPhone?.trim() || "n/a",
            pickupWindowStart: pickupStart,
            pickupWindowEnd: pickupEnd,
            deliveryCompany: body.deliveryCompany?.trim() || null,
            deliveryStreet:
              body.deliveryStreet?.trim() || body.deliveryCity?.trim() || "TBD",
            deliveryZip: body.deliveryZip?.trim() || "00000",
            deliveryCity: body.deliveryCity?.trim() || "TBD",
            deliveryCountry: body.deliveryCountry?.trim() || "DE",
            deliveryContactName: body.deliveryContactName?.trim() || "Receiver",
            deliveryContactPhone: body.deliveryContactPhone?.trim() || "n/a",
            deliveryWindowStart: deliveryStart,
            deliveryWindowEnd: deliveryEnd,
            cargoDescription: body.cargoDescription?.trim() || "General cargo",
            weightKg: Number(body.weightKg) || 100,
            palletCount:
              body.palletCount != null ? Number(body.palletCount) : null,
            stackable: Boolean(body.stackable),
            hazardous: Boolean(body.hazardous),
            temperatureControl: Boolean(body.temperatureControl),
            loadingHelpNeeded: Boolean(body.loadingHelpNeeded),
            requiredVehicleClass: parseVehicle(body.requiredVehicleClass),
            suggestedBudgetEur: budget,
            notes: body.notes?.trim() || null,
            publishedAt: null,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: auth.user.id,
            action: submit ? "load.submit_admin" : "load.draft",
            entityType: "load",
            entityId: created.id,
          },
        });

        return created;
      },
      { maxWait: 10_000, timeout: 30_000 },
    );

    if (submit) {
      const shipperLabel = auth.user.name || auth.user.email;
      const routeLabel = `${load.pickupCity} → ${load.deliveryCity} · ${load.weightKg} kg`;
      const priceLabel =
        budget != null ? ` · €${budget.toFixed(2)}` : "";

      await notifyAdmins({
        type: "admin.load.pending",
        title: "New load awaiting review",
        body: `${shipperLabel} submitted ${routeLabel}${priceLabel}`,
        payload: {
          loadId: load.id,
          shipperId: auth.user.id,
          shipperName: shipperLabel,
          suggestedBudgetEur: budget,
        },
        href: `/admin/loads/${load.id}`,
      });
    }

    return NextResponse.json({ ok: true, load });
  } catch (error) {
    console.error("create load", error);
    return NextResponse.json({ error: "Could not create load." }, { status: 500 });
  }
}
