-- AlterTable
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "ingest_token" TEXT;
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "ingest_token_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "drivers_ingest_token_key" ON "drivers"("ingest_token");
