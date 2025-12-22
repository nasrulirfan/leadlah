import type { CalculatorReceipt } from "@leadlah/core";

const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-MY", {
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeStyle: "short",
});

const friendlyDateFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "full",
});

const currencyKeyPattern =
  /(amount|fee|price|cost|rent|loan|stamp|installment|gdv|total|duty|payment)/i;
const percentKeyPattern = /(percent|percentage|yield|margin|rate)/i;

const allowedLogoProtocols = /^https?:\/\//i;

type BrandAssets = {
  leadlahMarkDataUri?: string;
};

export function generateCalculatorReceiptHtml(
  receipt: CalculatorReceipt,
  assets: BrandAssets = {},
): string {
  const issuedAt = receipt.issuedAt;
  const reference = buildReference(receipt);
  const issuedAtDisplay = dateTimeFormatter.format(issuedAt);
  const issuedAtFriendly = friendlyDateFormatter.format(issuedAt);
  const customerName = receipt.customerName?.trim() || "Valued Client";
  const safeLogoUrl =
    receipt.agencyLogoUrl && allowedLogoProtocols.test(receipt.agencyLogoUrl)
      ? receipt.agencyLogoUrl
      : undefined;
  const agentInitials = buildInitials(receipt.agentName);
  const leadlahMarkMarkup = assets.leadlahMarkDataUri
    ? `<img src="${escapeHtml(assets.leadlahMarkDataUri)}" alt="LeadLah" />`
    : `<span>LL</span>`;
  const agencyBadgeMarkup = safeLogoUrl
    ? `<img class="agency-avatar" src="${escapeHtml(safeLogoUrl)}" alt="Agency logo" />`
    : `<span class="agency-avatar agency-avatar-fallback">${escapeHtml(agentInitials)}</span>`;

  const highlightMarkup = renderHighlights(receipt.outputs);
  const inputsRowsMarkup = renderTableRows(
    receipt.inputs,
    "No calculator inputs were provided.",
  );
  const outputsRowsMarkup = renderTableRows(
    receipt.outputs,
    "No calculation results were provided.",
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${escapeHtml(receipt.calculationType)} • LeadLah Receipt</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      :root {
        --primary-gradient: linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%);
        --accent-gradient: linear-gradient(135deg, #fda4af 0%, #fb7185 50%, #f43f5e 100%);
        --warm-gradient: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
        --glass-bg: rgba(255, 255, 255, 0.7);
        --glass-border: rgba(255, 255, 255, 0.3);
        --shadow-soft: 0 4px 24px -4px rgba(15, 23, 42, 0.08);
        --shadow-glow: 0 0 40px -10px rgba(244, 63, 94, 0.3);
        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-muted: #94a3b8;
        --border-subtle: rgba(15, 23, 42, 0.06);
        --surface-elevated: #ffffff;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', ui-sans-serif, system-ui,
          'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
        color: var(--text-primary);
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        background: linear-gradient(180deg, #fef7f7 0%, #fff1f2 100%);
        -webkit-print-color-adjust: exact;
        -webkit-font-smoothing: antialiased;
      }
      .page {
        width: 794px;
        min-height: 1123px;
        margin: 0 auto;
        padding: 0;
        background: linear-gradient(180deg, #ffffff 0%, #fefefe 100%);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      /* Premium accent bar with animated gradient */
      .accent-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: var(--primary-gradient);
        box-shadow: 0 2px 12px -2px rgba(244, 63, 94, 0.4);
      }

      /* Side accent strip */
      .side-accent {
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: var(--primary-gradient);
      }

      /* Decorative background pattern */
      .bg-pattern {
        position: absolute;
        top: 0;
        right: 0;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle at 100% 0%, rgba(244, 63, 94, 0.03) 0%, transparent 70%);
        pointer-events: none;
      }

      .content-wrapper {
        padding: 32px 40px 24px;
        display: flex;
        flex-direction: column;
        flex: 1;
        position: relative;
        z-index: 1;
      }

      /* Header Section */
      header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 20px;
      }
      .brand {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .logo-mark {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: var(--primary-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 900;
        font-size: 14px;
        letter-spacing: 0.08em;
        box-shadow: var(--shadow-glow), 0 6px 16px -6px rgba(244, 63, 94, 0.5);
      }
      .logo-mark img {
        width: 28px;
        height: 28px;
        object-fit: contain;
        filter: brightness(0) invert(1);
      }
      .logo-mark span {
        line-height: 1;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .brand-name {
        margin: 0;
        font-size: 18px;
        font-weight: 900;
        letter-spacing: -0.03em;
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .brand-tag {
        margin: 0;
        color: var(--text-secondary);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: -0.01em;
      }

      /* Document Title Section */
      .doc-header {
        text-align: right;
      }
      .doc-badge {
        display: inline-block;
        padding: 4px 12px;
        background: var(--primary-gradient);
        border-radius: 20px;
        color: #ffffff;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .doc-title {
        margin: 0;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: -0.04em;
        color: var(--text-primary);
      }
      .doc-subtitle {
        margin: 4px 0 0 0;
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 600;
      }

      /* Meta Information */
      .meta-card {
        margin-top: 10px;
        padding: 10px 14px;
        background: linear-gradient(135deg, #fef7f7 0%, #fff1f2 100%);
        border-radius: 10px;
        border: 1px solid rgba(244, 63, 94, 0.1);
      }
      .meta-row {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        font-size: 10px;
      }
      .meta-row:not(:last-child) {
        margin-bottom: 4px;
      }
      .meta-key {
        color: var(--text-muted);
        font-weight: 500;
      }
      .meta-value {
        color: var(--text-primary);
        font-weight: 700;
      }

      /* Divider */
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, var(--border-subtle) 20%, var(--border-subtle) 80%, transparent 100%);
        margin: 0 0 16px 0;
        position: relative;
      }
      .divider::before {
        content: '';
        position: absolute;
        left: 50%;
        top: -3px;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        background: var(--primary-gradient);
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(244, 63, 94, 0.4);
      }

      /* Parties Section */
      .parties {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 16px;
      }
      .party {
        background: linear-gradient(145deg, #ffffff 0%, #fafafa 100%);
        border: 1px solid var(--border-subtle);
        border-radius: 14px;
        padding: 14px;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-soft);
      }
      .party-title {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        font-size: 10px;
        font-weight: 700;
        color: var(--text-muted);
        margin: 0 0 8px 0;
        padding: 3px 8px;
        background: rgba(244, 63, 94, 0.06);
        border-radius: 4px;
      }
      .party-value {
        margin: 0;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--text-primary);
      }
      .party-sub {
        margin: 4px 0 0 0;
        color: var(--text-secondary);
        font-size: 11px;
        font-weight: 500;
      }
      .agent-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed rgba(15, 23, 42, 0.08);
      }
      .agency-avatar {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        object-fit: cover;
        border: 1px solid rgba(244, 63, 94, 0.15);
        box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.1);
      }
      .agency-avatar-fallback {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-gradient);
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        border: none;
      }
      .agent-name {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-primary);
      }

      /* Section Title */
      .section-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 14px 0 8px 0;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-primary);
      }
      .section-title::before {
        content: '';
        width: 3px;
        height: 14px;
        background: var(--primary-gradient);
        border-radius: 2px;
      }

      /* Summary Highlights */
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin-bottom: 10px;
      }
      .summary-card {
        background: linear-gradient(135deg, #ffffff 0%, #fef7f7 100%);
        border: 1px solid rgba(244, 63, 94, 0.12);
        border-radius: 12px;
        padding: 12px;
        position: relative;
        overflow: hidden;
        box-shadow: var(--shadow-soft);
      }
      .summary-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--primary-gradient);
      }
      .summary-card.highlight {
        background: var(--primary-gradient);
        border: none;
        box-shadow: var(--shadow-glow), 0 8px 24px -8px rgba(244, 63, 94, 0.4);
      }
      .summary-card.highlight::before {
        display: none;
      }
      .summary-card.highlight .summary-label,
      .summary-card.highlight .summary-value {
        color: #ffffff;
      }
      .summary-label {
        margin: 0;
        font-size: 8px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-muted);
        font-weight: 700;
      }
      .summary-value {
        margin: 6px 0 0 0;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: -0.03em;
        color: var(--text-primary);
      }

      /* Key-Value Tables */
      .kv-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        overflow: hidden;
        border-radius: 12px;
        border: 1px solid var(--border-subtle);
        box-shadow: var(--shadow-soft);
        background: #ffffff;
      }
      .kv-table thead th {
        text-align: left;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        color: var(--text-primary);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 10px 14px;
        border-bottom: 1px solid var(--border-subtle);
      }
      .kv-table thead th:last-child {
        text-align: right;
      }
      .kv-table tbody td {
        padding: 8px 14px;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 11px;
        vertical-align: top;
      }
      .kv-table tbody tr:nth-child(even) td {
        background: rgba(248, 250, 252, 0.5);
      }
      .kv-table tbody tr:last-child td {
        border-bottom: none;
      }
      .kv-table td.label {
        color: var(--text-secondary);
        font-weight: 600;
      }
      .kv-table td.value {
        text-align: right;
        color: var(--text-primary);
        font-weight: 700;
        white-space: nowrap;
      }
      .kv-table tr.empty td {
        text-align: center;
        color: var(--text-muted);
        padding: 14px;
        font-weight: 600;
        background: #ffffff;
      }

      /* Footer */
      footer {
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid var(--border-subtle);
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        position: relative;
      }
      footer::before {
        content: '';
        position: absolute;
        top: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 2px;
        background: var(--primary-gradient);
        border-radius: 1px;
      }
      .footer-left {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--text-secondary);
        font-size: 10px;
        font-weight: 500;
      }
      .footer-mark {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: var(--primary-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px -4px rgba(244, 63, 94, 0.4);
      }
      .footer-mark img {
        width: 12px;
        height: 12px;
        object-fit: contain;
        filter: brightness(0) invert(1);
      }
      .footer-mark span {
        font-size: 8px;
        font-weight: 900;
        color: #ffffff;
      }
      .footer-right {
        text-align: right;
        font-size: 9px;
        color: var(--text-muted);
        font-weight: 500;
      }
      .footer-right div:not(:last-child) {
        margin-bottom: 4px;
      }
      .footer-ref {
        color: var(--text-secondary);
        font-weight: 600;
      }

      /* Verification QR placeholder */
      .verification-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        color: var(--text-secondary);
      }
      .verification-icon {
        width: 24px;
        height: 24px;
        background: var(--primary-gradient);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .verification-icon svg {
        width: 14px;
        height: 14px;
        fill: #ffffff;
      }

      /* Responsive */
      @media (max-width: 640px) {
        body {
          padding: 16px;
        }
        .content-wrapper {
          padding: 24px;
        }
        header {
          flex-direction: column;
          align-items: flex-start;
        }
        .doc-header {
          text-align: left;
        }
        .meta-row {
          justify-content: flex-start;
        }
        footer {
          flex-direction: column;
          align-items: flex-start;
        }
        .footer-right {
          text-align: left;
        }
        .parties {
          grid-template-columns: 1fr;
        }
        .kv-table td.value {
          white-space: normal;
          text-align: left;
        }
        .summary {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="accent-bar"></div>
      <div class="side-accent"></div>
      <div class="bg-pattern"></div>

      <div class="content-wrapper">
        <header>
          <div class="brand">
            <div class="logo-mark">${leadlahMarkMarkup}</div>
            <div class="brand-text">
              <p class="brand-name">LeadLah</p>
              <p class="brand-tag">Property Agent OS for Malaysia</p>
            </div>
          </div>
          <div class="doc-header">
            <span class="doc-badge">Official Receipt</span>
            <p class="doc-title">Calculator Receipt</p>
            <p class="doc-subtitle">${escapeHtml(receipt.calculationType)}</p>
            <div class="meta-card">
              <div class="meta-row">
                <span class="meta-key">Reference</span>
                <span class="meta-value">${escapeHtml(reference)}</span>
              </div>
              <div class="meta-row">
                <span class="meta-key">Issued</span>
                <span class="meta-value">${escapeHtml(issuedAtDisplay)}</span>
              </div>
              <div class="meta-row">
                <span class="meta-key">Date</span>
                <span class="meta-value">${escapeHtml(issuedAtFriendly)}</span>
              </div>
            </div>
          </div>
        </header>

        <div class="divider"></div>

        <section class="parties">
          <div class="party">
            <p class="party-title">👤 Prepared For</p>
            <p class="party-value">${escapeHtml(customerName)}</p>
            <p class="party-sub">Client / Purchaser</p>
          </div>
          <div class="party">
            <p class="party-title">🏢 Prepared By</p>
            <p class="party-value">${escapeHtml(receipt.agentName)}</p>
            <p class="party-sub">${escapeHtml(receipt.renNumber)}</p>
            <div class="agent-row">
              ${agencyBadgeMarkup}
              <span class="agent-name">${escapeHtml(receipt.agentName)}</span>
            </div>
          </div>
        </section>

        ${highlightMarkup}

        <section>
          <p class="section-title">Inputs</p>
          <table class="kv-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${inputsRowsMarkup}
            </tbody>
          </table>
        </section>

        <section>
          <p class="section-title">Outputs</p>
          <table class="kv-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${outputsRowsMarkup}
            </tbody>
          </table>
        </section>

        <footer>
          <div class="footer-left">
            <span class="footer-mark">${leadlahMarkMarkup}</span>
            <span>Generated by LeadLah · support@leadlah.com</span>
          </div>
          <div class="footer-right">
            <div class="footer-ref">Ref: ${escapeHtml(reference)}</div>
            <div>© ${new Date().getFullYear()} LeadLah. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </main>
  </body>
</html>`;
}

function renderHighlights(
  record: Record<string, number | string | boolean>,
): string {
  const highlights = buildHighlights(record);
  if (highlights.length === 0) {
    return "";
  }

  return `<section>
    <p class="section-title">Summary</p>
    <div class="summary">
      ${highlights
      .map(
        (highlight, index) => `<div class="summary-card${index === 0 ? ' highlight' : ''}">
        <p class="summary-label">${escapeHtml(highlight.label)}</p>
        <p class="summary-value">${highlight.value}</p>
      </div>`,
      )
      .join("")}
    </div>
  </section>`;
}

function buildHighlights(
  record: Record<string, number | string | boolean>,
): Array<{ label: string; value: string }> {
  const entries = Object.entries(record ?? {});
  const scored = entries
    .map(([key, value]) => {
      let score = 0;
      if (/(total|grand|nett|net|sum)/i.test(key)) score += 5;
      if (/(monthly|installment|payment)/i.test(key)) score += 3;
      if (currencyKeyPattern.test(key)) score += 3;
      if (percentKeyPattern.test(key)) score += 2;
      if (typeof value === "number") score += 1;
      return { key, value, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((item) => ({
    label: formatLabel(item.key),
    value: formatValue(item.key, item.value),
  }));
}

function renderTableRows(
  record: Record<string, number | string | boolean>,
  emptyCopy: string,
): string {
  const entries = Object.entries(record ?? {});
  if (entries.length === 0) {
    return `<tr class="empty"><td colSpan="2">${escapeHtml(emptyCopy)}</td></tr>`;
  }

  return entries
    .map(([key, value]) => {
      const label = formatLabel(key);
      const formattedValue = formatValue(key, value);
      return `<tr>
        <td class="label">${escapeHtml(label)}</td>
        <td class="value">${formattedValue}</td>
      </tr>`;
    })
    .join("");
}

function formatLabel(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(key: string, value: number | string | boolean): string {
  if (typeof value === "number") {
    if (percentKeyPattern.test(key)) {
      return escapeHtml(`${numberFormatter.format(value)}%`);
    }
    if (currencyKeyPattern.test(key)) {
      return escapeHtml(currencyFormatter.format(value));
    }
    return escapeHtml(numberFormatter.format(value));
  }

  if (typeof value === "boolean") {
    return escapeHtml(value ? "Yes" : "No");
  }

  return escapeHtml(String(value));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br />");
}

function buildReference(receipt: CalculatorReceipt): string {
  const date = receipt.issuedAt;
  const prefix =
    receipt.calculationType
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 4)
      .toUpperCase() || "LL";
  const timestamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join("");
  return `${prefix}-${timestamp}`;
}

function buildInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "LL"
  );
}
