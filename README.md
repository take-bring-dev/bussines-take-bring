# Take & Bring Business

Separate logistics platform (shipper / carrier / admin) for Take & Bring.

- **Host (prod):** `https://app.take-bring.eu`
- **Local:** `http://localhost:3001`
- **Marketing site:** Take-Bring repo → Login / Sign up links redirect here

## Status

Mock UI + **Prisma connected to Supabase Postgres**.  
**No Supabase Auth** — custom JWT comes next. Credentials live only in `.env` (gitignored).

## Database

```bash
npm run db:migrate    # migrations (DIRECT_URL)
npm run db:generate   # Prisma Client
npm run db:studio     # GUI
node scripts/check-db.mjs
```

## Scripts

```bash
npm install
npm run assets          # SVG → PNG → WebP brand illustrations
npm run dev             # http://localhost:3001
npm run build
```

## Security (baseline)

- `noindex` robots + headers
- Security headers in `next.config.ts`
- Separate secrets from marketing website
- HttpOnly JWT cookies planned (not in mock)

## Docs

Architecture / action plan live in the marketing repo (local only):  
`Take-Bring/_local-plans/`
