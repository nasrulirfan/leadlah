import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import type { Pool } from "pg";

const PgPool: typeof import("pg").Pool = (() => {
  const pgModule = eval("require")("pg") as typeof import("pg");
  return pgModule.Pool;
})();

declare global {
  // eslint-disable-next-line no-var
  var __authPool: Pool | undefined;
}

const authDatabaseUrl = process.env.BETTER_AUTH_DATABASE_URL ?? process.env.DATABASE_URL;

if (!authDatabaseUrl) {
  throw new Error("BETTER_AUTH_DATABASE_URL (or DATABASE_URL) must be set for Better-auth.");
}

const database =
  globalThis.__authPool ??
  new PgPool({
    connectionString: authDatabaseUrl
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__authPool = database;
}

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database,
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    // Handles Set-Cookie updates inside server actions (Next.js)
    nextCookies()
  ]
});

export type Session = typeof auth.$Infer.Session;
