import { NextResponse } from "next/server";
import { authorizeEscrowMock, createEscrowForAward } from "@/lib/escrow";
import { prisma } from "@/lib/db";
import { requireRoles } from "@/lib/auth/session";
import { notifyUser } from "@/lib/notify";
import { formatMoney } from "@/lib/format";
import { appBaseUrl, getStripe, isStripeMock, toStripeAmount } from "@/lib/stripe";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireRoles("SHIPPER", "SUPER_ADMIN");
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id: loadId } = await context.params;
  const body = await request.json().catch(() => ({} as { returnPath?: string }));
  const returnPath =
    typeof body.returnPath === "string" &&
    body.returnPath.startsWith("/") &&
    !body.returnPath.startsWith("//")
      ? body.returnPath
      : `/s/loads/${loadId}`;
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: {
      applications: {
        where: { status: "ACCEPTED" },
        take: 1,
      },
      escrow: true,
      shipper: { select: { id: true, email: true, name: true, stripeCustomerId: true } },
    },
  });

  if (!load || (load.shipperId !== auth.user.id && auth.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  const accepted = load.applications[0];
  if (!accepted) {
    return NextResponse.json(
      { error: "Award a carrier before funding escrow." },
      { status: 400 },
    );
  }

  let escrow = load.escrow;
  if (!escrow) {
    escrow = await createEscrowForAward({
      loadId,
      applicationId: accepted.id,
      shipperId: load.shipperId,
      carrierUserId: accepted.applicantUserId,
      amount: Number(accepted.proposedPrice),
      currency: accepted.currency,
    });
  }

  if (escrow.status === "AUTHORIZED" || escrow.status === "CAPTURED") {
    return NextResponse.json({
      ok: true,
      alreadyFunded: true,
      status: escrow.status,
    });
  }

  // Dev / no keys: simulate authorization hold
  if (isStripeMock()) {
    const updated = await authorizeEscrowMock(escrow.id);
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "escrow.mock_authorize",
        entityType: "escrow",
        entityId: escrow.id,
        meta: { loadId },
      },
    });
    await notifyUser({
      userId: escrow.carrierUserId,
      type: "escrow.authorized",
      title: "Escrow funded",
      body: `Shipper authorized ${formatMoney(Number(escrow.amount), escrow.currency)} for your load.`,
      payload: { loadId, escrowId: escrow.id },
      href: "/c/earnings",
    });
    return NextResponse.json({
      ok: true,
      mock: true,
      status: updated.status,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }

  const amount = toStripeAmount(Number(escrow.amount));
  const currency = escrow.currency.toLowerCase();
  const ref =
    load.reference || `TB-${load.id.slice(0, 8).toUpperCase()}`;

  let customerId = load.shipper.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: load.shipper.email,
      name: load.shipper.name || undefined,
      metadata: { userId: load.shipper.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: load.shipper.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: escrow.id,
    success_url: `${appBaseUrl()}${returnPath}?escrow=funded&loadId=${loadId}`,
    cancel_url: `${appBaseUrl()}${returnPath}?escrow=cancelled&loadId=${loadId}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: `Escrow hold — ${ref}`,
            description:
              "Authorize escrow for awarded load (test mode). Funds capture on delivery.",
          },
        },
      },
    ],
    payment_intent_data: {
      capture_method: "manual",
      metadata: {
        loadId,
        escrowId: escrow.id,
        applicationId: accepted.id,
      },
    },
    metadata: {
      loadId,
      escrowId: escrow.id,
    },
  });

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: {
      stripeCheckoutSessionId: session.id,
      ...(piId ? { stripePaymentIntentId: piId } : {}),
      mock: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: "escrow.checkout_created",
      entityType: "escrow",
      entityId: escrow.id,
      meta: { loadId, sessionId: session.id },
    },
  });

  return NextResponse.json({
    ok: true,
    url: session.url,
    sessionId: session.id,
  });
}
