import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import type { Pool } from "pg";

import { sendEmailVerification, sendPasswordResetEmail } from "./email/auth-emails";

const PgPool: typeof import("pg").Pool = (() => {
  const pgModule = eval("require")("pg") as typeof import("pg");
  return pgModule.Pool;
})();

declare global {
  // eslint-disable-next-line no-var
  var __authPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __authMigrationsPromise: Promise<void> | undefined;
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
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url, token }, request) => {
      void sendPasswordResetEmail({ to: user.email, token, resetUrl: url }).catch((error) => {
        console.error("Failed to send password reset email:", error);
      });

      void request;
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      void sendEmailVerification({
        to: user.email,
        token,
        authGeneratedUrl: url,
        userName: user.name
      }).catch((error) => {
        console.error("Failed to send email verification email:", error);
      });

      void request;
    }
  },
  plugins: [
    // Handles Set-Cookie updates inside server actions (Next.js)
    nextCookies()
  ]
});

const migrationsPromise =
  globalThis.__authMigrationsPromise ??
  (globalThis.__authMigrationsPromise = (async () => {
    if (auth.$context) {
      const ctx = await auth.$context;
      if (typeof ctx.runMigrations === "function") {
        await ctx.runMigrations();
      }
    }
  })());

export async function ensureAuthReady() {
  await migrationsPromise;
}

export type Session = typeof auth.$Infer.Session;
