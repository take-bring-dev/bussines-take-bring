# Take & Bring Business — project notes

## Purpose

Standalone PWA/web app for shippers, carriers, and super admins.  
Completely separate from the marketing website (`Take-Bring`) and `/tb-dashboard`.

## Local URLs

| App | URL |
|-----|-----|
| Marketing website | http://localhost:3000 |
| Business platform | http://localhost:3001 |
| Login | http://localhost:3001/login |
| Sign up | http://localhost:3001/register |

Website navbar Login / Sign up use `NEXT_PUBLIC_APP_URL` (local → `http://localhost:3001`).

## Stack

- Next.js App Router + Tailwind v4
- shadcn-style UI (`src/components/ui`)
- Brand palette `#ABC629` / `#8FA622` / `#D4E88A`
- Flat SVG → PNG → WebP assets (`npm run assets`)
- **Prisma ORM** + Supabase Postgres (`DATABASE_URL` + `DIRECT_URL`)
- Custom JWT auth planned (Phase 0) — **not** Supabase Auth

## Database (Prisma)

```bash
npm run db:migrate    # create/apply migrations (uses DIRECT_URL)
npm run db:generate   # regenerate client
npm run db:studio     # browse tables
```

- Client helper: `src/lib/db.ts`
- Schema: `prisma/schema.prisma`
- Secrets only in `.env` (gitignored) — never commit passwords

## Mock routes

- `/` landing
- `/login`, `/register`, `/register/shipper`, `/register/carrier/...`
- `/s/*` shipper
- `/c/*` carrier
- `/admin/*` admin

## Security posture (now)

- `robots.txt` Disallow all
- `X-Robots-Tag: noindex`
- Security headers (frame deny, nosniff, permissions-policy)
- Secrets never committed (`.env.local`)

## Next implementation

See `Take-Bring/_local-plans/TAKE-BRING-PLATFORM-ACTION-PLAN.md` Phase 0.
