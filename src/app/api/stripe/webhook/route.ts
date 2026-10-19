import { NextResponse } from "next/server";
import { markEscrowAuthorizedFromStripe } from "@/lib/escrow";
import { getStripe, isStripeMock } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (isStripeMock()) {
    return NextResponse.json({ ok: true, mock: true });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (piId) {
        await markEscrowAuthorizedFromStripe({
          paymentIntentId: piId,
          checkoutSessionId: session.id,
        });
      }
    }

    if (event.type === "payment_intent.amount_capturable_updated") {
      const pi = event.data.object as Stripe.PaymentIntent;
      await markEscrowAuthorizedFromStripe({
        paymentIntentId: pi.id,
      });
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      // Capture path also fires succeeded — authorize if still awaiting
      await markEscrowAuthorizedFromStripe({
        paymentIntentId: pi.id,
      });
    }
  } catch (e) {
    console.error("[stripe.webhook]", e);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
