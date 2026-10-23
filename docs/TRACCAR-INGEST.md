# Traccar / GPS Logger → Vercel (no Capacitor)

Third-party GPS apps **push** HTTP requests to your Next.js API on Vercel.  
No websockets, no server “ping”, no Android Studio, no App Store for TBD.

## Endpoint

```
GET|POST https://YOUR_DOMAIN/api/location/ingest
```

Auth = driver’s **ingest token** as query `id` (Traccar) or `token` (GPS Logger).

Works on Vercel serverless: each ping is a short request (~10s max).

## Traccar Client setup

1. Fleet admin: `/c/fleet` → driver → **GPS device link** / **Rotate GPS link**
2. Copy **Server URL** = `https://YOUR_DOMAIN/api/location/ingest`
3. Copy **Device identifier** = the secret token
4. Driver installs [Traccar Client](https://www.traccar.org/client/)
5. Paste URL + identifier, enable service, allow location always

Traccar sends OsmAnd-style query params (`id`, `lat`, `lon`, `timestamp`, `speed` in knots, …).

## GPS Logger (Android)

Use the **custom URL** shown after rotating the token (`%LAT`, `%LON`, … placeholders).

## Env

Set `NEXT_PUBLIC_APP_URL` to your production origin (no trailing slash), e.g.  
`https://app.take-bring.eu` — used when displaying copy-paste URLs.

## Security

- Token is unique per driver; rotate anytime (old token dies)
- Suspended / tracking-disabled drivers are rejected
- Do not commit tokens; show once in the UI after create/rotate
