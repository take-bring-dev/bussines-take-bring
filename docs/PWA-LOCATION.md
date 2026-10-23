# PWA + Service Worker location (no Capacitor)

## Critical fact

**A Service Worker cannot call `navigator.geolocation`.**  
Browsers only expose GPS to a window/page context. The SW helps with **queueing, retries, and waking open clients** — it does not replace GPS.

## Architecture

```
Page (LocationTracker)
  → read GPS (watchPosition)
  → postMessage LOCATION_ENQUEUE → Service Worker
       → try POST /api/location/update (cookies)
       → on failure: IndexedDB queue
       → Background Sync "flush-locations" when online again

Periodic Sync "location-ping" (Chrome/Android PWA, if allowed)
  → SW → postMessage LOCATION_PING → open clients
  → page reads GPS again → enqueue

FCM data type "location.ping"
  → same: ask open clients; if none, soft notification to open TBD
```

Files:

- `public/firebase-messaging-sw.js` — queue + sync + ping
- `src/lib/location-sw-client.ts` — page bridge
- `src/lib/geo.ts` / `LocationTracker` — GPS + enqueue

## Platform reality

| Capability | Chrome Android PWA | iOS Safari PWA |
|------------|--------------------|----------------|
| GPS while app open | Yes | Yes |
| SW offline queue + flush | Yes | Limited / often yes for same-origin |
| Periodic Background Sync | Yes (installed PWA) | **No** |
| GPS with app fully killed | **No** | **No** |

## What this gives you

- More reliable delivery when the network drops (queue → sync)
- Re-ping while the PWA is still open (periodic sync / push)
- Still **not** true background tracking with the app swiped away

True always-on background GPS requires a native app (Capacitor / store build).
