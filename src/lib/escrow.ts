import { prisma } from "@/lib/db";
import { getStripe, isStripeMock, toStripeAmount } from "@/lib/stripe";

export async function createEscrowForAward(input: {
  loadId: string;
  applicationId: string;
  shipperId: string;
  carrierUserId: string;
  amount: number;
  currency: string;
  /** Override when backfilling older awards. */
  status?: "AWAITING_PAYMENT" | "AUTHORIZED" | "CAPTURED";
}) {
  const existing = await prisma.escrowPayment.findUnique({
    where: { loadId: input.loadId },
  });
  if (existing) return existing;

  const status = input.status ?? "AWAITING_PAYMENT";
  const now = new Date();

  return prisma.escrowPayment.create({
    data: {
      loadId: input.loadId,
      applicationId: input.applicationId,
      shipperId: input.shipperId,
      carrierUserId: input.carrierUserId,
      amount: input.amount,
      currency: input.currency.toUpperCase() || "EUR",
      status,
      mock: isStripeMock(),
      authorizedAt:
        status === "AUTHORIZED" || status === "CAPTURED" ? now : null,
      capturedAt: status === "CAPTURED" ? now : null,
    },
  });
}

/**
 * Create missing escrow rows for awards made before escrow existed.
 * DELIVERED loads → CAPTURED; others → AWAITING_PAYMENT (shipper still pays).
 */
export async function backfillMissingEscrows(filter?: {
  shipperId?: string;
  carrierUserId?: string;
}) {
  const accepted = await prisma.loadApplication.findMany({
    where: {
      status: "ACCEPTED",
      ...(filter?.carrierUserId
        ? { applicantUserId: filter.carrierUserId }
        : {}),
      ...(filter?.shipperId
        ? { load: { shipperId: filter.shipperId } }
        : {}),
    },
    include: {
      load: {
        select: {
          id: true,
          shipperId: true,
          status: true,
          escrow: { select: { id: true } },
        },
      },
    },
  });

  const missing = accepted.filter((a) => !a.load.escrow);
  for (const app of missing) {
    // Older awards had no escrow row — open for shipper payment (demo).
    await createEscrowForAward({
      loadId: app.loadId,
      applicationId: app.id,
      shipperId: app.load.shipperId,
      carrierUserId: app.applicantUserId,
      amount: Number(app.proposedPrice),
      currency: app.currency,
      status: "AWAITING_PAYMENT",
    });
  }

  // If delivery already happened but escrow never captured, settle it.
  const stuck = await prisma.escrowPayment.findMany({
    where: {
      status: { in: ["AWAITING_PAYMENT", "AUTHORIZED"] },
      load: { status: "DELIVERED" },
      ...(filter?.shipperId ? { shipperId: filter.shipperId } : {}),
      ...(filter?.carrierUserId
        ? { carrierUserId: filter.carrierUserId }
        : {}),
    },
    select: { id: true, loadId: true, status: true },
  });

  for (const row of stuck) {
    if (row.status === "AWAITING_PAYMENT") {
      await authorizeEscrowMock(row.id);
    }
    await captureEscrow(row.loadId);
  }

  return missing.length;
}

export async function authorizeEscrowMock(escrowId: string) {
  return prisma.escrowPayment.update({
    where: { id: escrowId },
    data: {
      status: "AUTHORIZED",
      authorizedAt: new Date(),
      mock: true,
      stripePaymentIntentId: `mock_pi_${escrowId.slice(0, 12)}`,
    },
  });
}

export async function captureEscrow(loadId: string) {
  const escrow = await prisma.escrowPayment.findUnique({
    where: { loadId },
  });
  if (!escrow) return null;
  if (escrow.status === "CAPTURED") return escrow;

  if (escrow.status !== "AUTHORIZED") {
    // Allow capture from awaiting in mock-only path for demos without funding
    if (!(escrow.mock || isStripeMock()) || escrow.status !== "AWAITING_PAYMENT") {
      return escrow;
    }
  }

  const stripe = getStripe();
  if (stripe && escrow.stripePaymentIntentId && !escrow.mock) {
    const pi = await stripe.paymentIntents.capture(escrow.stripePaymentIntentId);
    const chargeId =
      typeof pi.latest_charge === "string"
        ? pi.latest_charge
        : pi.latest_charge?.id ?? null;

    return prisma.escrowPayment.update({
      where: { id: escrow.id },
      data: {
        status: "CAPTURED",
        capturedAt: new Date(),
        stripeChargeId: chargeId,
      },
    });
  }

  return prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: {
      status: "CAPTURED",
      capturedAt: new Date(),
      mock: true,
    },
  });
}

export async function markEscrowAuthorizedFromStripe(input: {
  paymentIntentId: string;
  checkoutSessionId?: string;
  chargeId?: string | null;
}) {
  const escrow = await prisma.escrowPayment.findFirst({
    where: {
      OR: [
        { stripePaymentIntentId: input.paymentIntentId },
        ...(input.checkoutSessionId
          ? [{ stripeCheckoutSessionId: input.checkoutSessionId }]
          : []),
      ],
    },
  });
  if (!escrow) return null;
  if (escrow.status === "AUTHORIZED" || escrow.status === "CAPTURED") {
    return escrow;
  }

  return prisma.escrowPayment.update({
    where: { id: escrow.id },
    data: {
      status: "AUTHORIZED",
      authorizedAt: new Date(),
      stripePaymentIntentId: input.paymentIntentId,
      ...(input.checkoutSessionId
        ? { stripeCheckoutSessionId: input.checkoutSessionId }
        : {}),
      ...(input.chargeId ? { stripeChargeId: input.chargeId } : {}),
    },
  });
}

export async function syncEscrowFromStripe(loadId: string) {
  const escrow = await prisma.escrowPayment.findUnique({ where: { loadId } });
  if (!escrow || escrow.status !== "AWAITING_PAYMENT") return escrow;

  const stripe = getStripe();
  if (!stripe || escrow.mock) return escrow;

  if (escrow.stripeCheckoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(
      escrow.stripeCheckoutSessionId,
    );
    if (
      session.payment_status === "paid" ||
      session.payment_status === "unpaid" // unpaid can still mean authorized with manual capture
    ) {
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (piId && session.status === "complete") {
        const pi = await stripe.paymentIntents.retrieve(piId);
        if (
          pi.status === "requires_capture" ||
          pi.status === "succeeded"
        ) {
          return markEscrowAuthorizedFromStripe({
            paymentIntentId: piId,
            checkoutSessionId: session.id,
          });
        }
      }
    }
  }

  if (escrow.stripePaymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(
      escrow.stripePaymentIntentId,
    );
    if (pi.status === "requires_capture" || pi.status === "succeeded") {
      return markEscrowAuthorizedFromStripe({
        paymentIntentId: pi.id,
      });
    }
  }

  return escrow;
}

export { toStripeAmount };
