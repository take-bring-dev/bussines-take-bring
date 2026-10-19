-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SHIPPER', 'CARRIER_INDIVIDUAL', 'CARRIER_COMPANY_ADMIN', 'CARRIER_DRIVER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ShipperAccountType" AS ENUM ('COMPANY', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "VehicleClass" AS ENUM ('CAR', 'VAN_3_5T', 'TRUCK_7_5T', 'TRUCK_12T', 'TRUCK_24T', 'TRUCK_40T', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RECEIVING_OFFERS', 'OFFER_SELECTED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CargoType" AS ENUM ('PALLETS', 'PACKAGES', 'DOCUMENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ApplicantType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BUSINESS_REGISTRATION', 'VAT_PROOF', 'CARRIER_INSURANCE', 'DRIVING_LICENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT,
    "phone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'de',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'DRAFT',
    "kyc_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipper_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_type" "ShipperAccountType" NOT NULL,
    "company_name" TEXT,
    "legal_form" TEXT,
    "vat_id" TEXT,
    "registration_no" TEXT,
    "billing_street" TEXT NOT NULL,
    "billing_zip" TEXT NOT NULL,
    "billing_city" TEXT NOT NULL,
    "billing_country" TEXT NOT NULL DEFAULT 'DE',
    "contact_name" TEXT NOT NULL,
    "contact_role" TEXT,
    "invoice_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipper_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_individual_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "address_street" TEXT NOT NULL,
    "address_zip" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "address_country" TEXT NOT NULL DEFAULT 'DE',
    "vat_id" TEXT,
    "vehicle_class" "VehicleClass" NOT NULL,
    "plate_number" TEXT NOT NULL,
    "max_payload_kg" INTEGER NOT NULL,
    "cargo_length_cm" INTEGER,
    "cargo_width_cm" INTEGER,
    "cargo_height_cm" INTEGER,
    "insurance_expiry" TIMESTAMP(3),
    "bank_iban" TEXT,
    "bank_account_holder" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrier_individual_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_company_profiles" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "legal_form" TEXT,
    "vat_id" TEXT NOT NULL,
    "address_street" TEXT NOT NULL,
    "address_zip" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "address_country" TEXT NOT NULL DEFAULT 'DE',
    "admin_phone" TEXT,
    "fleet_size_estimate" INTEGER,
    "insurance_expiry" TIMESTAMP(3),
    "bank_iban" TEXT,
    "bank_account_holder" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrier_company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "plate_number" TEXT NOT NULL,
    "payload_kg" INTEGER NOT NULL,
    "volume_m3" DOUBLE PRECISION,
    "pallet_spaces" INTEGER,
    "has_tail_lift" BOOLEAN NOT NULL DEFAULT false,
    "has_curtain_side" BOOLEAN NOT NULL DEFAULT false,
    "adr_capable" BOOLEAN NOT NULL DEFAULT false,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "licence_class" TEXT,
    "vehicle_id" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'INVITED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loads" (
    "id" TEXT NOT NULL,
    "shipper_id" TEXT NOT NULL,
    "reference" TEXT,
    "title" TEXT,
    "status" "LoadStatus" NOT NULL DEFAULT 'DRAFT',
    "pickup_company" TEXT,
    "pickup_street" TEXT NOT NULL,
    "pickup_zip" TEXT NOT NULL,
    "pickup_city" TEXT NOT NULL,
    "pickup_country" TEXT NOT NULL DEFAULT 'DE',
    "pickup_contact_name" TEXT NOT NULL,
    "pickup_contact_phone" TEXT NOT NULL,
    "pickup_window_start" TIMESTAMP(3) NOT NULL,
    "pickup_window_end" TIMESTAMP(3) NOT NULL,
    "delivery_company" TEXT,
    "delivery_street" TEXT NOT NULL,
    "delivery_zip" TEXT NOT NULL,
    "delivery_city" TEXT NOT NULL,
    "delivery_country" TEXT NOT NULL DEFAULT 'DE',
    "delivery_contact_name" TEXT NOT NULL,
    "delivery_contact_phone" TEXT NOT NULL,
    "delivery_window_start" TIMESTAMP(3) NOT NULL,
    "delivery_window_end" TIMESTAMP(3) NOT NULL,
    "cargo_description" TEXT NOT NULL,
    "cargo_type" "CargoType" NOT NULL DEFAULT 'OTHER',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weight_kg" INTEGER NOT NULL,
    "pallet_count" INTEGER,
    "length_cm" INTEGER,
    "width_cm" INTEGER,
    "height_cm" INTEGER,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "hazardous" BOOLEAN NOT NULL DEFAULT false,
    "required_vehicle_class" "VehicleClass" NOT NULL,
    "loading_help_needed" BOOLEAN NOT NULL DEFAULT false,
    "temperature_control" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "suggested_budget_eur" DECIMAL(12,2),
    "published_at" TIMESTAMP(3),
    "assigned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_applications" (
    "id" TEXT NOT NULL,
    "load_id" TEXT NOT NULL,
    "applicant_user_id" TEXT NOT NULL,
    "applicant_type" "ApplicantType" NOT NULL,
    "company_id" TEXT,
    "proposed_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "message" TEXT,
    "vehicle_id" TEXT,
    "driver_id" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "expires_at" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipper_profiles_user_id_key" ON "shipper_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_individual_profiles_user_id_key" ON "carrier_individual_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_company_profiles_admin_user_id_key" ON "carrier_company_profiles"("admin_user_id");

-- CreateIndex
CREATE INDEX "vehicles_company_id_idx" ON "vehicles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_company_id_plate_number_key" ON "vehicles"("company_id", "plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");

-- CreateIndex
CREATE INDEX "drivers_company_id_idx" ON "drivers"("company_id");

-- CreateIndex
CREATE INDEX "loads_shipper_id_idx" ON "loads"("shipper_id");

-- CreateIndex
CREATE INDEX "loads_status_idx" ON "loads"("status");

-- CreateIndex
CREATE INDEX "loads_published_at_idx" ON "loads"("published_at");

-- CreateIndex
CREATE INDEX "load_applications_load_id_idx" ON "load_applications"("load_id");

-- CreateIndex
CREATE INDEX "load_applications_applicant_user_id_idx" ON "load_applications"("applicant_user_id");

-- CreateIndex
CREATE INDEX "load_applications_status_idx" ON "load_applications"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipper_profiles" ADD CONSTRAINT "shipper_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_individual_profiles" ADD CONSTRAINT "carrier_individual_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_company_profiles" ADD CONSTRAINT "carrier_company_profiles_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "carrier_company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "carrier_company_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loads" ADD CONSTRAINT "loads_shipper_id_fkey" FOREIGN KEY ("shipper_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_applications" ADD CONSTRAINT "load_applications_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_applications" ADD CONSTRAINT "load_applications_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_applications" ADD CONSTRAINT "load_applications_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_applications" ADD CONSTRAINT "load_applications_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
