# LeadLah Monorepo (Web MVP)

TypeScript monorepo for the LeadLah web MVP, built with Next.js (marketing + app shell) and NestJS API, sharing domain logic via a core package.

## Project Structure

- `apps/web` — Next.js 14 app for marketing landing page and authenticated web app (dashboard, listings, calculators, billing, owner view). Uses shadcn (Radix + cva) primitives styled with Tailwind.
- `apps/api` — NestJS API scaffold with modules for listings, fishbone process log, reminders/scheduler hooks, and subscription (HitPay) webhooks.
- `packages/core` — Shared types, Zod schemas, calculators (loan reverse DSR, legal/stamp duty with 2026 foreigner rule, ROI, sellability, land feasibility, tenancy), reminders helpers, and secure owner-link generator.
- `packages/ui` — Reserved for shared UI components (not populated yet).
- Root configs — `turbo.json`, `tsconfig.base.json`, `pnpm-workspace.yaml`, `.gitignore`.

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

## Install

```bash
pnpm install
```

## Run (development)

Terminal 1 – Web (Next.js):
```bash
pnpm dev --filter @leadlah/web
```
Runs on `http://localhost:3000`.

Terminal 2 – API (NestJS):
```bash
pnpm dev --filter @leadlah/api
```
Runs on `http://localhost:3001`.

> The API currently uses in-memory stores; wire up Postgres/TypeORM before production.

## Build

```bash
pnpm build    # turbo build for all packages
pnpm build --filter @leadlah/web
pnpm build --filter @leadlah/api
```

## Lint/Test

```bash
pnpm lint
pnpm test    # placeholder; add tests per package
```

## Docker (API + DB stack only)

- Build and run API + Postgres + Redis (web stays native): `docker compose up --build`
- API available at `http://localhost:3001`
- Postgres: `postgres://leadlah:leadlah@localhost:5432/leadlah`
- Redis: `redis://localhost:6379`

> Tip: for local dev, keep running `pnpm dev --filter @leadlah/web` natively while the API + databases run in Docker.

## Environment Variables

Create `.env.local` in `apps/web`:
```
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_META_PIXEL_ID=META_PIXEL_ID
BETTER_AUTH_SECRET=generate_with_openssl
BETTER_AUTH_DATABASE_URL=postgres://leadlah:leadlah@localhost:5432/leadlah
# Optional if your dev URL differs
BETTER_AUTH_URL=http://localhost:3000
```

Create `.env` in `apps/api` (examples):
```
PORT=3001
DATABASE_URL=postgres://user:pass@host:5432/leadlah
HITPAY_API_KEY=your_hitpay_key
HITPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Architecture Fit

- **Separation of concerns:** Static, SEO-focused landing page (`apps/web/(marketing)`) is distinct from the app shell (`apps/web/(app)`), aligned with PRD note for lightweight marketing.
- **Shared domain logic:** Financial calculators, reminder logic, enums, and validation live in `packages/core`, reused by web and API to keep behavior consistent.
- **Subscription flow:** Billing UI and Nest subscription module are wired for HitPay webhook handling and states (`TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`), matching the PRD.
- **Process transparency:** Owner read-only timeline (`/owner/[token]`) uses hashed tokens from core helpers.
- **Reminders:** Portal expiry and tenancy renewal schedulers in both UI and API modules, covering alert lead times.
- **Security & production readiness:** Helmet, CORS, validation pipes enabled in API; analytics and SEO meta baked into web layout; sticky CTA header for marketing.

## Troubleshooting

### Unstyled pages (Tailwind CSS not loading)

If the web app appears unstyled, it's likely due to a stale `.next` cache. Clear it and restart:

```bash
pnpm --filter @leadlah/web clean
pnpm dev --filter @leadlah/web
```

## How to Explore Quickly

- Marketing page: open `http://localhost:3000/`
- Dashboard: `http://localhost:3000/dashboard`
- Listings CRUD + reminders: `http://localhost:3000/listings`
- Calculators suite: `http://localhost:3000/calculators`
- Billing UI: `http://localhost:3000/billing`
- Owner view sample: `http://localhost:3000/owner/<token>` (see `apps/web/src/lib/mock-data.ts` for the token)
