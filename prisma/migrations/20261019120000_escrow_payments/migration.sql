-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('AWAITING_PAYMENT', 'AUTHORIZED', 'CAPTURED', 'CANCELLED', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "escrow_payments" (
    "id" TEXT NOT NULL,
    "load_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "shipper_id" TEXT NOT NULL,
    "carrier_user_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "EscrowStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "stripe_payment_intent_id" TEXT,
    "stripe_checkout_session_id" TEXT,
    "stripe_charge_id" TEXT,
    "mock" BOOLEAN NOT NULL DEFAULT false,
    "authorized_at" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "escrow_payments_load_id_key" ON "escrow_payments"("load_id");
CREATE INDEX IF NOT EXISTS "escrow_payments_shipper_id_idx" ON "escrow_payments"("shipper_id");
CREATE INDEX IF NOT EXISTS "escrow_payments_status_idx" ON "escrow_payments"("status");
CREATE INDEX IF NOT EXISTS "escrow_payments_stripe_payment_intent_id_idx" ON "escrow_payments"("stripe_payment_intent_id");

DO $$ BEGIN
 ALTER TABLE "escrow_payments" ADD CONSTRAINT "escrow_payments_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "escrow_payments" ADD CONSTRAINT "escrow_payments_shipper_id_fkey" FOREIGN KEY ("shipper_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
