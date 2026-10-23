import { prisma } from "@/lib/db";

export type LocationSample = {
  lat: number;
  lng: number;
  accuracyM?: number | null;
  speedMps?: number | null;
  headingDeg?: number | null;
  altitudeM?: number | null;
  source?: string;
  recordedAt?: Date | string;
  loadId?: string | null;
};

export function isValidCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Upsert always-on latest + append history point. */
export async function recordDriverLocation(
  userId: string,
  sample: LocationSample,
) {
  const recordedAt = sample.recordedAt
    ? new Date(sample.recordedAt)
    : new Date();
  const source = sample.source?.trim() || "foreground";

  await prisma.$transaction([
    prisma.driverLocationLatest.upsert({
      where: { userId },
      create: {
        userId,
        lat: sample.lat,
        lng: sample.lng,
        accuracyM: sample.accuracyM ?? null,
        speedMps: sample.speedMps ?? null,
        headingDeg: sample.headingDeg ?? null,
        altitudeM: sample.altitudeM ?? null,
        source,
        recordedAt,
      },
      update: {
        lat: sample.lat,
        lng: sample.lng,
        accuracyM: sample.accuracyM ?? null,
        speedMps: sample.speedMps ?? null,
        headingDeg: sample.headingDeg ?? null,
        altitudeM: sample.altitudeM ?? null,
        source,
        recordedAt,
      },
    }),
    prisma.driverLocationPoint.create({
      data: {
        userId,
        loadId: sample.loadId || null,
        lat: sample.lat,
        lng: sample.lng,
        accuracyM: sample.accuracyM ?? null,
        speedMps: sample.speedMps ?? null,
        headingDeg: sample.headingDeg ?? null,
        altitudeM: sample.altitudeM ?? null,
        source,
        recordedAt,
      },
    }),
  ]);
}

/** Keep history lean — delete points older than N days for a user. */
export async function pruneOldLocationPoints(userId: string, keepDays = 14) {
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
  await prisma.driverLocationPoint.deleteMany({
    where: { userId, recordedAt: { lt: cutoff } },
  });
}
