---
name: take-bring-business
description: >-
  Project context for Take & Bring Business (TBD) — EU freight marketplace PWA
  for shippers, carriers, and admins. Use when working in take-bring-business,
  on loads/escrow/KYC/auth/push, Stitch UI sync, or any /s /c /admin feature.
---

# Take & Bring Business

Standalone logistics platform (separate from marketing site `Take-Bring`).

| | |
|---|---|
| Brand | TBD — Take Bring Dispatching (`Take & Bring GmbH`) |
| Prod | `https://app.take-bring.eu` |
| Local | `http://localhost:3001` (marketing is `:3000`) |
| Remote | `https://github.com/take-bring-dev/bussines-take-bring.git` |

## Stack (do not assume older Next)

- **Next.js 16.4** App Router + **React 19** — read `node_modules/next/dist/docs/` before new APIs (`AGENTS.md`)
- Tailwind v4, Geist, shadcn-style + Radix (`src/components/ui`)
- Prisma → Supabase Postgres (`DATABASE_URL` pooler + `DIRECT_URL` migrations)
- **Custom JWT auth** (`jose` + HttpOnly cookies) — **not** Supabase Auth
- Stripe escrow (mock if keys missing / `STRIPE_MOCK=true`)
- Firebase Cloud Messaging for web push

Brand colors: `#ABC629` / `#556500` / `#D4E88A` — `src/config/brand.ts`

## Roles → surfaces

| Role | App |
|---|---|
| `SHIPPER` | `/s/*` |
| `CARRIER_*` | `/c/*` |
| `SUPER_ADMIN` | `/admin/*` |

Auth cookies: `tb_biz_access` / `tb_biz_refresh`. Middleware guards `/s`, `/c`, `/admin`, `/activation`. Role homes via `roleHome()` in `src/lib/auth/session.ts`.

## Core marketplace loop

`DRAFT → RECEIVING_OFFERS → ASSIGNED → IN_TRANSIT → DELIVERED`

1. Shipper posts load (`POST /api/loads`)
2. Carriers bid (`.../apply`)
3. Shipper accepts one offer (`.../accept`) → escrow created
4. Shipper funds escrow (`.../escrow/checkout`) → `AUTHORIZED`
5. Carrier transit/deliver (`.../status`) → escrow `CAPTURED`

Always notify via `notifyUser` / `notifyUsers` / `notifyAdmins` (`src/lib/notify.ts`), not raw DB+push.

## Where things live

| Concern | Path |
|---|---|
| Schema | `prisma/schema.prisma` |
| Auth | `src/lib/auth/*`, `src/middleware.ts`, `src/app/api/auth/*` |
| Escrow | `src/lib/escrow.ts`, `src/lib/stripe.ts` |
| Push | `src/lib/push.ts`, `src/lib/firebase-*.ts`, `public/firebase-messaging-sw.js` |
| Chrome | `shipper-chrome`, `carrier-chrome`, `admin-chrome` |
| Env template | `.env.example` |

## Commands

```bash
npm run dev          # :3001
npm run db:migrate   # uses DIRECT_URL
npm run db:seed
npm run assets       # SVG → PNG → WebP
npm run stitch:generate / stitch:sync
```

## Working rules for this repo

1. Keep business app separate from marketing secrets/URLs (`PLATFORM_JWT_SECRET` ≠ website).
2. Prefer server Prisma reads + route-handler mutations; defend roles in **layouts and APIs**.
3. Soft realtime = `useLivePoll` (~8s), not websockets.
4. Stitch HTML in `_stitch-out/` is **design reference only** (gitignored); implement in React + existing chrome/tokens.
5. README/PROJECT.md understate maturity — JWT, loads, escrow, push are already implemented.

## Fleet / PWA (implemented)

- Fleet CRUD + driver↔truck assign: `/c/fleet`, `src/app/api/fleet/*`
- Load assign: bid optional vehicle/driver; `POST /api/loads/[id]/assign-fleet`
- **Live GPS tracking temporarily disabled** (APIs return 503; no LocationTracker in chrome)
- Location schema/APIs remain for a later re-enable (`DriverLocation*`, ingest token)
- Icon badge: web Badging API (Android PWA; limited on iOS)

## Known gaps (do not reinvent as “done”)

- KYC/activation UI exists; **not hard-gated** on publish/apply; no document upload yet
- Password reset model unused
- No silent access-token rotation endpoint
- Live GPS re-enable later via LocationTracker + `/api/location/*` (currently 503)

## Deeper reference

For route maps, enums, API list, and maturity detail see [reference.md](reference.md).
