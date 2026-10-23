import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { isValidCoord, recordDriverLocation } from "@/lib/location";

export function generateIngestToken() {
  return randomBytes(24).toString("base64url");
}

export function appOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  return "http://localhost:3001";
}

/** OsmAnd / Traccar Client URL (device id = ingest token). */
export function traccarIngestUrl(token: string) {
  return `${appOrigin()}/api/location/ingest`;
}

/** GPS Logger “custom URL” template (token fixed in query). */
export function gpsLoggerUrlTemplate(token: string) {
  return `${appOrigin()}/api/location/ingest?token=${encodeURIComponent(token)}&lat=%LAT&lon=%LON&timestamp=%TIME&speed=%SPD&bearing=%DIR&altitude=%ALT&accuracy=%ACC&batt=%BATT`;
}

export function hashTokenHint(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 8);
}

type ParsedIngest = {
  token: string;
  lat: number;
  lng: number;
  accuracyM?: number | null;
  speedMps?: number | null;
  headingDeg?: number | null;
  altitudeM?: number | null;
  recordedAt?: Date;
  battery?: number | null;
  source: string;
};

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse Traccar OsmAnd query, GPS Logger query, or JSON body.
 * Speed from OsmAnd/Traccar is typically knots → convert to m/s.
 */
export function parseIngestPayload(
  searchParams: URLSearchParams,
  body: Record<string, unknown> | null,
): ParsedIngest | { error: string } {
  const q = (key: string) => searchParams.get(key) ?? body?.[key];

  const token = String(
    q("token") || q("id") || q("deviceid") || q("deviceId") || "",
  ).trim();
  if (!token) return { error: "Missing token (or id)." };

  const lat = num(q("lat") ?? q("latitude"));
  const lng = num(q("lon") ?? q("lng") ?? q("longitude") ?? q("long"));
  if (lat == null || lng == null || !isValidCoord(lat, lng)) {
    return { error: "Invalid lat/lon." };
  }

  const accuracyM = num(q("accuracy") ?? q("accuracyM") ?? q("hdop"));
  const altitudeM = num(q("altitude") ?? q("alt") ?? q("altitudeM"));
  const headingDeg = num(q("bearing") ?? q("heading") ?? q("headingDeg") ?? q("dir"));
  const battery = num(q("batt") ?? q("battery"));

  // OsmAnd protocol (Traccar Client): speed in knots. JSON may send m/s.
  const speedRaw = num(q("speed") ?? q("speedMps"));
  const speedUnit = String(q("speedUnit") || q("speed_unit") || "knots").toLowerCase();
  let speedMps: number | null = null;
  if (speedRaw != null) {
    if (speedUnit === "mps" || speedUnit === "m/s" || body?.speedMps != null) {
      speedMps = speedRaw;
    } else if (speedUnit === "kmh" || speedUnit === "km/h") {
      speedMps = speedRaw / 3.6;
    } else {
      // default knots (Traccar OsmAnd)
      speedMps = speedRaw * 0.514444;
    }
  }

  let recordedAt: Date | undefined;
  const ts = q("timestamp") || q("time") || q("recordedAt");
  if (ts != null && ts !== "") {
    const n = Number(ts);
    if (Number.isFinite(n)) {
      // seconds vs ms
      recordedAt = new Date(n < 1e12 ? n * 1000 : n);
    } else {
      const d = new Date(String(ts));
      if (!Number.isNaN(d.getTime())) recordedAt = d;
    }
  }

  const source = String(q("source") || "traccar-ingest");

  return {
    token,
    lat,
    lng,
    accuracyM,
    speedMps,
    headingDeg,
    altitudeM,
    recordedAt,
    battery,
    source,
  };
}

export async function ingestWithToken(parsed: ParsedIngest) {
  const driver = await prisma.driver.findUnique({
    where: { ingestToken: parsed.token },
  });
  if (!driver) return { ok: false as const, status: 401 as const, error: "Invalid token." };
  if (driver.status === "SUSPENDED") {
    return { ok: false as const, status: 403 as const, error: "Driver suspended." };
  }
  if (!driver.trackingEnabled) {
    return { ok: false as const, status: 403 as const, error: "Tracking disabled." };
  }
  if (!driver.userId) {
    return {
      ok: false as const,
      status: 400 as const,
      error: "Driver has no login user — recreate driver.",
    };
  }

  await recordDriverLocation(driver.userId, {
    lat: parsed.lat,
    lng: parsed.lng,
    accuracyM: parsed.accuracyM,
    speedMps: parsed.speedMps,
    headingDeg: parsed.headingDeg,
    altitudeM: parsed.altitudeM,
    source: parsed.source,
    recordedAt: parsed.recordedAt,
  });

  return { ok: true as const, driverId: driver.id, userId: driver.userId };
}

export function ingestCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
