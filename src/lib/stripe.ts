import Stripe from "stripe";

export function isStripeMock() {
  if (process.env.STRIPE_MOCK === "true") return true;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return !key || key.includes("sk_test_...");
}

export function getStripe(): Stripe | null {
  if (isStripeMock()) return null;
  const key = process.env.STRIPE_SECRET_KEY!.trim();
  return new Stripe(key, {
    apiVersion: "2026-09-30.endive",
    typescript: true,
  });
}

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  );
}

/** Convert decimal EUR amount to Stripe minor units (cents). */
export function toStripeAmount(amount: number) {
  return Math.round(amount * 100);
}
