# Take & Bring Business — reference

## Route map

### Public
- `/` landing · `/login` · `/register` (+ shipper / carrier individual / company) · `/activation`

### Shipper `/s`
Overview, loads list/new/`[id]`, billing, notifications, settings

### Carrier `/c`
Freight board, my loads/`[id]`, fleet, earnings, notifications, settings

### Admin `/admin`
Overview, activity, loads/`[id]`, users, KYC, escrow, settings

### API
- Auth: `login`, `logout`, `register`, `me`, `profile`
- Loads: `GET/POST /api/loads`; `[id]/apply|accept|reject|status|request-payment`; `[id]/escrow/checkout|sync`
- Admin: `admin/kyc`
- Push: `push/subscribe`, `push/unsubscribe`
- Other: `notifications`, `stripe/webhook`

## Auth details

- Access JWT ~30m, refresh ~14d; sessions in `AuthSession` (hashed refresh + `jti`)
- Passwords: bcrypt cost 12 (`src/lib/auth/password.ts`)
- Register `accountType`: `shipper` | `carrier_individual` | `carrier_company` → KYC `SUBMITTED` → `/activation`
- Login requires `UserStatus.ACTIVE`; redirects via `roleHome(role)`
- Middleware: valid access **or** refresh cookie passes; no rotation endpoint yet

## Key Prisma enums / models

**Roles:** `SUPER_ADMIN`, `SHIPPER`, `CARRIER_INDIVIDUAL`, `CARRIER_COMPANY_ADMIN`, `CARRIER_DRIVER`

**LoadStatus:** `DRAFT`, `PUBLISHED`, `RECEIVING_OFFERS`, `OFFER_SELECTED`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `EXPIRED`  
(Accept currently jumps to `ASSIGNED`; `OFFER_SELECTED` rarely used.)

**ApplicationStatus:** `PENDING` | `ACCEPTED` | `REJECTED` | `WITHDRAWN` — one pending bid per carrier; accept rejects others.

**EscrowStatus:** `AWAITING_PAYMENT` → `AUTHORIZED` → `CAPTURED` (+ `CANCELLED`/`FAILED`)

**Graph:** User → Profile (KYC) + role profiles; Load → LoadApplication; Load 1:1 EscrowPayment; Notification / DeviceToken / Document / AuditLog / Vehicle / Driver

## Escrow / Stripe

- `createEscrowForAward` on accept (`src/lib/escrow.ts`)
- Checkout mock-authorizes without keys; else Stripe Checkout manual capture
- Webhook marks `AUTHORIZED`; delivery captures
- Ops scripts: `scripts/backfill-escrow.mjs`, `check-escrow.mjs`

## Notifications

- In-app rows + optional FCM (`notifyUser` → `sendFcmToUser`)
- Data-only FCM to avoid double banners
- Client bootstrap in chrome layouts; SW at `public/firebase-messaging-sw.js`
- Deep links use `NEXT_PUBLIC_APP_URL`

## UI conventions

- Chrome: desktop sidebar + mobile bottom/drawer
- PWA: `manifest.webmanifest`, install prompt, app badge from unread
- Security: `noindex`, frame deny, nosniff (see `next.config.ts`)
- Design tokens “Stitch locked” in `src/app/globals.css`
- Stitch: `STITCH_API_KEY`, outputs `_stitch-out/` (e.g. `login-desktop.html`)

## Sibling repos / docs

- Marketing website: Take-Bring (local `:3000`); Login/Sign up → this app via `NEXT_PUBLIC_APP_URL`
- Longer action plan (local only): `Take-Bring/_local-plans/TAKE-BRING-PLATFORM-ACTION-PLAN.md`
- Repo docs: `README.md`, `PROJECT.md` (partially stale vs code)

## Maturity snapshot

**Working:** JWT auth, load board/bid/award, escrow mock+Stripe, in-app+FCM push, admin KYC approve/reject, seed (`npm run db:seed`), PWA shell

**Thin:** activation UX without hard gates; fleet read-only; driver role incomplete; refresh accepted but not rotated

**Missing:** password reset routes, document upload/storage, websockets, full Stripe Connect payouts, enforced KYC before marketplace actions
