# Repository Guidelines

## Project Structure & Module Organization

- `apps/web` — Next.js 14 (App Router). Routes live in `apps/web/app` (e.g., `(marketing)`, `(app)`); shared UI/helpers live in `apps/web/src/components`, `apps/web/src/lib`, and static assets in `apps/web/public`.
- `apps/api` — NestJS API. Feature modules live in `apps/api/src/*` (e.g., `listings`, `reminders`, `subscription`); database schema/migrations are managed via Drizzle (`apps/api/src/database` and `apps/api/drizzle`).
- `packages/core` — Shared domain logic (types, Zod schemas, calculators) in `packages/core/src`, consumed by both web and API.
- `packages/ui` — Reserved for shared UI components (currently minimal).

## Build, Test, and Development Commands

- `pnpm install` — Install workspace dependencies.
- `pnpm dev` — Run all dev tasks via Turborepo.
- `pnpm dev --filter @leadlah/web` — Run Next.js on `http://localhost:3000`.
- `pnpm dev --filter @leadlah/api` — Run NestJS on `http://localhost:3001` (builds `@leadlah/core` first).
- `pnpm build` / `pnpm lint` — Build/lint all packages via Turbo.
- `pnpm format` — Prettier across `ts/tsx/js/json/md`.
- `pnpm --filter @leadlah/api db:migrate` / `db:generate` — Run/generate Drizzle migrations.
- `docker compose up --build` — Run API + Postgres + Redis (web stays native).

## Coding Style & Naming Conventions

- TypeScript across the repo; follow existing formatting (2-space indentation, double quotes, semicolons).
- Linting: `apps/web` uses `next lint`; `apps/api` and `packages/core` use ESLint (`.eslintrc.cjs`).
- Naming: React components in `PascalCase.tsx`; hooks `useThing`; route/module folders are lowercase (e.g., `apps/api/src/listings`).

## Testing Guidelines

- API tests: Vitest in `apps/api/test/**/*.spec.ts` (`pnpm --filter @leadlah/api test`, watch via `test:watch`). Coverage is configured in `apps/api/vitest.config.ts`.
- `packages/core` has a `jest` script but no tests yet; if adding tests, introduce a consistent convention (e.g., `*.test.ts` or `__tests__/`) and ensure Jest is configured to execute TypeScript.

## Commit & Pull Request Guidelines

- Commit messages in history are short, sentence-case summaries (e.g., “Revamped…”, “Fixed…”). Keep commits scoped to one change.
- PRs should include: a clear description, linked context/issues, screenshots for `apps/web` UI changes, and the commands you ran (typically `pnpm lint` and `pnpm --filter @leadlah/api test`).

## Security & Configuration Tips

- Don’t commit secrets. Web config lives in `apps/web/.env.local`; API config in `apps/api/.env` (not tracked).
- After schema updates under `apps/api/src/database`, generate and apply migrations before running the API.

