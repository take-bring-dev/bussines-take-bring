-- AlterTable
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "tracking_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "drivers_vehicle_id_idx" ON "drivers"("vehicle_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "driver_location_latest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy_m" DOUBLE PRECISION,
    "speed_mps" DOUBLE PRECISION,
    "heading_deg" DOUBLE PRECISION,
    "altitude_m" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'foreground',
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_location_latest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "driver_location_points" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "load_id" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy_m" DOUBLE PRECISION,
    "speed_mps" DOUBLE PRECISION,
    "heading_deg" DOUBLE PRECISION,
    "altitude_m" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'foreground',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_location_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "driver_location_latest_user_id_key" ON "driver_location_latest"("user_id");
CREATE INDEX IF NOT EXISTS "driver_location_latest_recorded_at_idx" ON "driver_location_latest"("recorded_at");
CREATE INDEX IF NOT EXISTS "driver_location_points_user_id_recorded_at_idx" ON "driver_location_points"("user_id", "recorded_at");
CREATE INDEX IF NOT EXISTS "driver_location_points_load_id_recorded_at_idx" ON "driver_location_points"("load_id", "recorded_at");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "driver_location_latest" ADD CONSTRAINT "driver_location_latest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "driver_location_points" ADD CONSTRAINT "driver_location_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "driver_location_points" ADD CONSTRAINT "driver_location_points_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
