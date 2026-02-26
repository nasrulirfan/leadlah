function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function baseLayout(params: { title: string; preheader: string; contentHtml: string; logoSrc?: string | null }) {
  const title = escapeHtml(params.title);
  const preheader = escapeHtml(params.preheader);
  const logoSrc = params.logoSrc ? escapeHtml(params.logoSrc) : null;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#111827;color:#0f172a;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:40px 16px;">
      <tr>
        <td align="center">
          ${
            logoSrc
              ? `<!-- Logo area -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="${logoSrc}" alt="LeadLah" width="140" height="140" style="display:block;width:140px;height:auto;border:0;" />
              </td>
            </tr>
          </table>`
              : `<!-- Brand fallback -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#e5e7eb;font-weight:800;">
                  LeadLah
                </div>
              </td>
            </tr>
          </table>`
          }
          <!-- Main card -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
            <!-- Red accent top border -->
            <tr>
              <td style="height:4px;background:linear-gradient(to right,#dc2626,#ef4444,#f43f5e);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <!-- Title -->
            <tr>
              <td style="padding:32px 36px 0 36px;">
                <h1 style="margin:0;font-size:24px;line-height:1.3;color:#0f172a;font-weight:700;">${title}</h1>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:8px 36px 36px 36px;">
                ${params.contentHtml}
                <p style="margin:28px 0 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <!-- Footer -->
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding:24px 16px 0 16px;" align="center">
                <div style="width:40px;height:3px;background:linear-gradient(to right,#dc2626,#f43f5e);border-radius:2px;margin:0 auto 16px auto;"></div>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                  &copy; ${new Date().getFullYear()} LeadLah &middot; All rights reserved
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildEmailVerificationTemplate(params: {
  verifyUrl: string;
  userName?: string;
  expiresInMinutes: number;
  logoSrc?: string | null;
}) {
  const name = params.userName?.trim() ? `, ${escapeHtml(params.userName.trim())}` : "";
  const verifyUrl = escapeHtml(params.verifyUrl);

  const title = "Verify your email";
  const preheader = `Verify your email to finish setting up LeadLah. Link expires in ${params.expiresInMinutes} minutes.`;

  const contentHtml = `
    <p style="margin:16px 0 0 0;font-size:15px;line-height:1.7;color:#374151;">
      Hi${name} — please confirm your email address to activate your account.
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.7;color:#374151;">
      This link expires in <strong style="color:#0f172a;">${params.expiresInMinutes} minutes</strong>.
    </p>
    <div style="margin:24px 0 0 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(to right,#dc2626,#ef4444,#f43f5e);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(239,68,68,0.25);letter-spacing:0.01em;">
        Verify email
      </a>
    </div>
    <p style="margin:24px 0 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
      Or copy and paste this URL into your browser:<br />
      <a href="${verifyUrl}" style="word-break:break-all;color:#dc2626;text-decoration:underline;">${verifyUrl}</a>
    </p>
  `;

  const html = baseLayout({ title, preheader, contentHtml, logoSrc: params.logoSrc });
  const text = `Hi${params.userName?.trim() ? ` ${params.userName.trim()}` : ""},\n\nVerify your email to finish setting up LeadLah:\n${params.verifyUrl}\n\nThis link expires in ${params.expiresInMinutes} minutes.\n\nIf you didn't request this, you can safely ignore this email.`;

  return { subject: "Verify your email for LeadLah", html, text };
}

export function buildPasswordResetTemplate(params: { resetUrl: string; expiresInMinutes: number; logoSrc?: string | null }) {
  const resetUrl = escapeHtml(params.resetUrl);
  const title = "Reset your password";
  const preheader = `Reset your LeadLah password. Link expires in ${params.expiresInMinutes} minutes.`;

  const contentHtml = `
    <p style="margin:16px 0 0 0;font-size:15px;line-height:1.7;color:#374151;">
      We received a request to reset your password. If you made this request, click the button below.
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.7;color:#374151;">
      This link expires in <strong style="color:#0f172a;">${params.expiresInMinutes} minutes</strong>.
    </p>
    <div style="margin:24px 0 0 0;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(to right,#dc2626,#ef4444,#f43f5e);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(239,68,68,0.25);letter-spacing:0.01em;">
        Reset password
      </a>
    </div>
    <p style="margin:24px 0 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
      Or copy and paste this URL into your browser:<br />
      <a href="${resetUrl}" style="word-break:break-all;color:#dc2626;text-decoration:underline;">${resetUrl}</a>
    </p>
  `;

  const html = baseLayout({ title, preheader, contentHtml, logoSrc: params.logoSrc });
  const text = `Reset your LeadLah password:\n${params.resetUrl}\n\nThis link expires in ${params.expiresInMinutes} minutes.\n\nIf you didn't request this, you can safely ignore this email.`;

  return { subject: "Reset your LeadLah password", html, text };
}
