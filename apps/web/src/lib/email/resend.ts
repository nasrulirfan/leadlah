import crypto from "crypto";

type SendEmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
  idempotencyKey?: string;
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
    contentId?: string;
  }>;
};

type ResendSuccessResponse = { id: string };
type ResendErrorResponse = { error: { statusCode: number; message: string } };
type ResendLegacyErrorResponse = { message?: string; name?: string; statusCode?: number };

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set to send email.");
  }

  if (!from) {
    throw new Error('RESEND_FROM_EMAIL must be set (example: "LeadLah <no-reply@leadlah.com>").');
  }

  return { apiKey, from };
}

export function buildEmailIdempotencyKey(prefix: string, token: string) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return `${prefix}/${hashedToken}`;
}

export async function sendResendEmail(payload: SendEmailPayload): Promise<string> {
  const { apiKey, from } = getResendConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(payload.idempotencyKey ? { "Idempotency-Key": payload.idempotencyKey } : {})
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
      tags: payload.tags,
      attachments: payload.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        content_type: attachment.contentType,
        content_id: attachment.contentId
      }))
    })
  });

  const rawText = await response.text();
  const body = rawText
    ? ((() => {
        try {
          return JSON.parse(rawText);
        } catch {
          return rawText;
        }
      })() as unknown)
    : null;

  if (!response.ok) {
    const errorMessage = (() => {
      if (typeof body === "string" && body.trim()) return body;
      if (!body || typeof body !== "object") return `HTTP ${response.status}`;

      const maybeError = body as ResendErrorResponse;
      if (maybeError.error?.message) {
        return `${maybeError.error.statusCode}: ${maybeError.error.message}`;
      }

      const legacy = body as ResendLegacyErrorResponse;
      if (legacy.message && typeof legacy.message === "string") {
        const prefix = legacy.statusCode ? `${legacy.statusCode}: ` : "";
        return `${prefix}${legacy.message}`;
      }

      return `HTTP ${response.status}`;
    })();

    throw new Error(`Resend send email failed (${errorMessage}).`);
  }

  const id = (() => {
    if (!body || typeof body !== "object") return "";
    const maybeSuccess = body as ResendSuccessResponse;
    return typeof maybeSuccess.id === "string" ? maybeSuccess.id : "";
  })();

  if (!id) {
    throw new Error("Resend send email returned an unexpected response.");
  }

  return id;
}
