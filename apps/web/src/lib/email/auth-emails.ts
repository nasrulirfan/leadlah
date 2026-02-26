import { buildEmailIdempotencyKey, sendResendEmail } from "./resend";
import { buildEmailVerificationTemplate, buildPasswordResetTemplate } from "./templates";

const DEFAULT_VERIFY_EXPIRES_IN_MINUTES = 60;
const DEFAULT_RESET_EXPIRES_IN_MINUTES = 60;
const INLINE_LOGO_CONTENT_ID = "leadlah-logo";

async function loadInlineLogoAttachment() {
  const [{ readFile }, path] = await Promise.all([import("fs/promises"), import("path")]);

  const candidates = [
    path.join(process.cwd(), "public/brand/leadlah-logo.png"),
    path.join(process.cwd(), "apps/web/public/brand/leadlah-logo.png"),
  ];

  for (const filename of candidates) {
    try {
      const content = await readFile(filename);
      return {
        attachment: {
          filename: "leadlah-logo.png",
          content: content.toString("base64"),
          contentType: "image/png",
          contentId: INLINE_LOGO_CONTENT_ID,
        },
        logoSrc: `cid:${INLINE_LOGO_CONTENT_ID}`,
      };
    } catch {
      // Try next candidate
    }
  }

  return null;
}

function getAppUrl() {
  const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL (or NEXT_PUBLIC_APP_URL) must be set to build auth links.");
  }
  return baseURL.replace(/\/$/, "");
}

function safeCallbackPath(input: string | null) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  return trimmed;
}

function extractCallbackPathFromAuthUrl(authUrl: string) {
  try {
    const parsed = new URL(authUrl);
    const callback =
      parsed.searchParams.get("callbackURL") ??
      parsed.searchParams.get("callbackUrl") ??
      parsed.searchParams.get("callback") ??
      null;
    return safeCallbackPath(callback);
  } catch {
    return null;
  }
}

function buildVerifyPageUrl(params: { token: string; callbackPath: string | null }) {
  const url = new URL("/verify-email", getAppUrl());
  url.searchParams.set("token", params.token);
  if (params.callbackPath) {
    url.searchParams.set("callbackURL", params.callbackPath);
  }
  return url.toString();
}

export async function sendEmailVerification(params: {
  to: string;
  token: string;
  authGeneratedUrl: string;
  userName?: string | null;
}) {
  const callbackPath = extractCallbackPathFromAuthUrl(params.authGeneratedUrl) ?? "/dashboard";
  const verifyUrl = buildVerifyPageUrl({ token: params.token, callbackPath });
  const inlineLogo = await loadInlineLogoAttachment();
  const email = buildEmailVerificationTemplate({
    verifyUrl,
    userName: params.userName ?? undefined,
    expiresInMinutes: DEFAULT_VERIFY_EXPIRES_IN_MINUTES,
    logoSrc: inlineLogo?.logoSrc ?? null
  });

  const idempotencyKey = buildEmailIdempotencyKey("verify-email", params.token);

  return sendResendEmail({
    to: params.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    idempotencyKey,
    attachments: inlineLogo ? [inlineLogo.attachment] : undefined,
    tags: [
      { name: "type", value: "email_verification" }
    ]
  });
}

export async function sendPasswordResetEmail(params: { to: string; token: string; resetUrl: string }) {
  const inlineLogo = await loadInlineLogoAttachment();
  const email = buildPasswordResetTemplate({
    resetUrl: params.resetUrl,
    expiresInMinutes: DEFAULT_RESET_EXPIRES_IN_MINUTES,
    logoSrc: inlineLogo?.logoSrc ?? null
  });

  const idempotencyKey = buildEmailIdempotencyKey("reset-password", params.token);

  return sendResendEmail({
    to: params.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    idempotencyKey,
    attachments: inlineLogo ? [inlineLogo.attachment] : undefined,
    tags: [
      { name: "type", value: "password_reset" }
    ]
  });
}
