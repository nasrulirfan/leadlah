import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var __authDb: DatabaseSync | undefined;
}

const databaseFile = path.join(process.cwd(), "auth.sqlite");
const database =
  globalThis.__authDb ??
  // Node 22+ built-in SQLite driver keeps auth state local without extra deps
  new DatabaseSync(databaseFile);

if (process.env.NODE_ENV !== "production") {
  globalThis.__authDb = database;
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
