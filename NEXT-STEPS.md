# LeadLah Next Steps (Web MVP)

1) Wire real data + auth
- Connect `apps/api` to Postgres via TypeORM entities (see `apps/api/src/listings/entities/listing.entity.ts` scaffold) and add repositories instead of in-memory arrays.
- Integrate Better-auth for secure sessions/roles (Agent, Owner), and protect app routes + API.
- Replace mock data in `apps/web/src/lib/mock-data.ts` with API calls (SWR/React Query) once endpoints are live.

2) Media + storage
- Add Cloudflare R2 S3 client for media uploads (photos, videos, documents) and sign URLs server-side.
- Create upload endpoints and presigned URL flow; render media galleries in listings UI.

3) Scheduling & jobs
- Persist reminders in Postgres and run cron/BullMQ workers (Upstash Redis) for portal expiry, exclusive appointment, lead follow-ups, and tenancy renewals.
- Add email/SMS (Resend) notifications for due reminders; surface unread alerts in the UI.

4) Billing/HitPay hardening
- Configure HitPay credentials and webhook secret; verify signatures before processing in `SubscriptionController`.
- Implement hosted checkout/start trial buttons that call HitPay and store subscription records.
- Enforce access rules in API/web (TRIALING/ACTIVE/PAST_DUE allowed, CANCELED read-only) using `isAccessAllowed`.

5) Owner experience
- Store and expire owner view tokens; add per-token audit logs. Serve a fully static-friendly view with cache headers.
- Optionally gate owner link behind short-lived signed URLs.

6) Calculators → PDF
- Build Puppeteer/React-PDF templates for the receipt payload generated in `/calculators`.
- Add “Download PDF” endpoint and email option (Resend).

7) QA and DX
- Add unit tests for calculators, reminder scheduling, and subscription state transitions.
- Add e2e coverage (Playwright/Cypress) for landing, listings CRUD, calculators, billing flows.
- Add eslint/prettier configs per package; consider Husky/pre-commit checks.

8) Deployment
- Deploy `apps/web` to Vercel (SSG/SSR) with env vars for analytics.
- Deploy `apps/api` to Render; provision managed Postgres + Upstash Redis; configure GA/Meta pixels and HitPay webhooks.

9) Observability
- Add Sentry to both web and API; add basic request logging and health endpoints in Nest.
