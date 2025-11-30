import type { Pool } from "pg";

const PgPool: typeof import("pg").Pool = (() => {
  const pgModule = eval("require")("pg") as typeof import("pg");
  return pgModule.Pool;
})();

declare global {
  // eslint-disable-next-line no-var
  var __leadlahDbPool: Pool | undefined;
}

const databaseUrl = process.env.DATABASE_URL ?? process.env.BETTER_AUTH_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL (or BETTER_AUTH_DATABASE_URL) must be configured.");
}

export const db =
  globalThis.__leadlahDbPool ??
  new PgPool({
    connectionString: databaseUrl
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__leadlahDbPool = db;
}
