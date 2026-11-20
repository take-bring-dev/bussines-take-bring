import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/session";
import { isValidCoord, recordDriverLocation, pruneOldLocationPoints } from "@/lib/location";

/** Session-authenticated location ping (PWA / open-tab tracking). */
export async function POST(request: Request) {
  const auth = await requireRoles(
    "CARRIER_DRIVER",
    "CARRIER_INDIVIDUAL",
    "CARRIER_COMPANY_ADMIN",
  );
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!isValidCoord(lat, lng)) {
    return NextResponse.json({ error: "Invalid lat/lng." }, { status: 400 });
  }

  await recordDriverLocation(auth.user.id, {
    lat,
    lng,
    accuracyM: body.accuracyM != null ? Number(body.accuracyM) : null,
    speedMps: body.speedMps != null ? Number(body.speedMps) : null,
    headingDeg: body.headingDeg != null ? Number(body.headingDeg) : null,
    altitudeM: body.altitudeM != null ? Number(body.altitudeM) : null,
    source: String(body.source || "pwa"),
    recordedAt: body.recordedAt ? String(body.recordedAt) : undefined,
    loadId: body.loadId ? String(body.loadId) : null,
  });

  // Best-effort prune (ignore failures)
  void pruneOldLocationPoints(auth.user.id).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
