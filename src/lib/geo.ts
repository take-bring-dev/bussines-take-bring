/** PWA / browser geolocation — no native shell required. */

export type GeoPosition = {
  lat: number;
  lng: number;
  accuracyM?: number | null;
  speedMps?: number | null;
  headingDeg?: number | null;
  altitudeM?: number | null;
  source: string;
  recordedAt: string;
};

function fromCoords(
  coords: GeolocationCoordinates,
  timestamp: number,
  source: string,
): GeoPosition {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracyM: coords.accuracy,
    speedMps: coords.speed,
    headingDeg: coords.heading,
    altitudeM: coords.altitude,
    source,
    recordedAt: new Date(timestamp).toISOString(),
  };
}

export async function requestLocationPermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return false;

  // Permissions API (Chrome/Android PWA). iOS often has no query — still try getCurrent.
  try {
    const perm = await navigator.permissions?.query({
      name: "geolocation" as PermissionName,
    });
    if (perm?.state === "denied") return false;
  } catch {
    /* iOS / unsupported */
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export async function getCurrentPosition(): Promise<GeoPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(fromCoords(pos.coords, pos.timestamp, "pwa")),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  });
}

export async function postLocation(
  position: GeoPosition,
  loadId?: string | null,
) {
  const { enqueueLocationViaSw } = await import("@/lib/location-sw-client");

  // Prefer SW path: immediate POST + IndexedDB queue + Background Sync retry.
  const viaSw = await enqueueLocationViaSw(position, loadId);
  if (viaSw) return;

  // Fallback if no SW controller yet (first visit / iOS quirks)
  const res = await fetch("/api/location/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      lat: position.lat,
      lng: position.lng,
      accuracyM: position.accuracyM,
      speedMps: position.speedMps,
      headingDeg: position.headingDeg,
      altitudeM: position.altitudeM,
      source: position.source,
      recordedAt: position.recordedAt,
      loadId: loadId || undefined,
    }),
  });
  if (!res.ok) throw new Error(`location post ${res.status}`);
}

type WakeLockSentinel = { release: () => Promise<void> };

/**
 * Continuous tracking while the PWA is open / in foreground.
 * Uses watchPosition + optional Screen Wake Lock.
 * iOS/Android PWAs cannot reliably track when the app is fully killed —
 * drivers should keep TBD open while on the road.
 */
export async function startAlwaysOnTracking(
  onPosition: (pos: GeoPosition) => void | Promise<void>,
): Promise<() => void> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return () => undefined;
  }

  let stopped = false;
  let wakeLock: WakeLockSentinel | null = null;
  let watchId: number | null = null;
  let lastPostedAt = 0;
  const MIN_INTERVAL_MS = 12_000;

  async function acquireWakeLock() {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
      };
      if (nav.wakeLock?.request) {
        wakeLock = await nav.wakeLock.request("screen");
      }
    } catch {
      /* unsupported or denied */
    }
  }

  async function handlePos(pos: GeolocationPosition) {
    if (stopped) return;
    const now = Date.now();
    if (now - lastPostedAt < MIN_INTERVAL_MS) return;
    lastPostedAt = now;
    await onPosition(fromCoords(pos.coords, pos.timestamp, "pwa-watch"));
  }

  await acquireWakeLock();

  watchId = navigator.geolocation.watchPosition(
    (pos) => void handlePos(pos),
    () => undefined,
    {
      enableHighAccuracy: true,
      maximumAge: 8000,
      timeout: 25000,
    },
  );

  // Also poll as backup (some iOS standalone PWAs throttle watch callbacks)
  const timer = setInterval(() => {
    if (stopped) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => void handlePos(pos),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
  }, 20_000);

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      void acquireWakeLock();
      navigator.geolocation.getCurrentPosition(
        (pos) => void handlePos(pos),
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      );
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    stopped = true;
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
    void wakeLock?.release().catch(() => undefined);
  };
}
