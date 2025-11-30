import type { CalculatorReceipt } from "@leadlah/core";

const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat("en-MY", {
  maximumFractionDigits: 2
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeStyle: "short"
});

const friendlyDateFormatter = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "full"
});

const currencyKeyPattern = /(amount|fee|price|cost|rent|loan|stamp|installment|gdv|total|duty|payment)/i;
const percentKeyPattern = /(percent|percentage|yield|margin|rate)/i;

const allowedLogoProtocols = /^https?:\/\//i;

export function generateCalculatorReceiptHtml(receipt: CalculatorReceipt): string {
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

  const inputsMarkup = renderDataList(receipt.inputs, "No calculator inputs were provided.");
  const outputsMarkup = renderDataList(receipt.outputs, "No calculation results were provided.");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${escapeHtml(receipt.calculationType)} • LeadLah Receipt</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      :root {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #0f172a;
      }
      html {
        width: 794px;
        height: 1123px;
        margin: 0 auto;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0 auto;
        padding: 0;
        width: 794px;
        height: 1123px;
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 90%, #eff6ff 100%);
        -webkit-print-color-adjust: exact;
        -webkit-font-smoothing: antialiased;
        overflow: hidden;
      }
      .receipt {
        width: 100%;
        height: 100%;
        padding: 56px 48px 40px;
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 90%, #eff6ff 100%);
        display: flex;
        flex-direction: column;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 12px;
      }
      .brand {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .logo {
        width: 60px;
        height: 60px;
        border-radius: 18px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 18px;
        letter-spacing: 1px;
      }
      .logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 18px;
      }
      .eyebrow {
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.2em;
        color: #94a3b8;
        margin: 0;
      }
      .title {
        margin: 2px 0 0 0;
        font-size: 24px;
        font-weight: 700;
      }
      .muted {
        margin: 4px 0 0 0;
        color: #64748b;
        font-size: 14px;
      }
      .meta {
        text-align: right;
      }
      .meta .pill {
        display: inline-flex;
        align-items: center;
        padding: 6px 14px;
        border-radius: 999px;
        background: rgba(37, 99, 235, 0.1);
        color: #1d4ed8;
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 6px;
      }
      .party {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .party-card {
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 20px;
        padding: 18px;
        background: white;
      }
      .section {
        margin-bottom: 14px;
      }
      .section-heading {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .subtitle {
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 6px;
      }
      .heading {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
      .party-card .heading {
        font-size: 20px;
      }
      .highlight-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }
      .highlight-card {
        padding: 16px;
        border-radius: 16px;
        color: white;
        background: linear-gradient(135deg, #0ea5e9, #2563eb);
      }
      .highlight-card.secondary {
        background: linear-gradient(135deg, #7c3aed, #a855f7);
      }
      .highlight-card .subtitle {
        color: rgba(255, 255, 255, 0.8);
      }
      .highlight-value {
        margin: 2px 0 0 0;
        font-size: 20px;
        font-weight: 600;
      }
      ul.data-grid {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 8px;
      }
      ul.data-grid li {
        border: 1px solid rgba(15, 23, 42, 0.08);
        background: white;
        border-radius: 14px;
        padding: 12px;
        min-height: 92px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      ul.data-grid li.empty {
        align-items: center;
        text-align: center;
        color: #94a3b8;
      }
      ul.data-grid .label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #94a3b8;
      }
      ul.data-grid .value {
        margin-top: 8px;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
      }
      footer {
        margin-top: auto;
        padding-top: 20px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
      }
      @media (max-width: 640px) {
        body {
          padding: 16px;
        }
        .receipt {
          padding: 24px;
        }
        header {
          flex-direction: column;
          align-items: flex-start;
        }
        .meta {
          text-align: left;
        }
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <header>
        <div class="brand">
          <div class="logo">
            ${
              safeLogoUrl
                ? `<img src="${escapeHtml(safeLogoUrl)}" alt="Agency logo" />`
                : `<span>${escapeHtml(agentInitials)}</span>`
            }
          </div>
          <div>
            <p class="eyebrow">LeadLah Calculators</p>
            <p class="title">${escapeHtml(receipt.calculationType)} Receipt</p>
            <p class="muted">Digital record for REN-ready submissions</p>
          </div>
        </div>
        <div class="meta">
          <div class="pill">${escapeHtml(receipt.calculationType)}</div>
          <p class="muted">Issued ${escapeHtml(issuedAtDisplay)}</p>
          <p class="muted">Reference ${escapeHtml(reference)}</p>
        </div>
      </header>

      <section class="party">
        <div class="party-card">
          <p class="subtitle">Prepared For</p>
          <p class="heading">${escapeHtml(customerName)}</p>
          <p class="muted">Client / Purchaser</p>
        </div>
        <div class="party-card">
          <p class="subtitle">Registered Agent</p>
          <p class="heading">${escapeHtml(receipt.agentName)}</p>
          <p class="muted">${escapeHtml(receipt.renNumber)}</p>
        </div>
      </section>

      <section class="highlight-grid">
        <div class="highlight-card">
          <p class="subtitle">Calculation</p>
          <p class="highlight-value">${escapeHtml(receipt.calculationType)}</p>
        </div>
        <div class="highlight-card secondary">
          <p class="subtitle">Issued On</p>
          <p class="highlight-value">${escapeHtml(issuedAtFriendly)}</p>
        </div>
      </section>

      <section class="section">
        <p class="section-heading">Inputs & Context</p>
        <ul class="data-grid">
          ${inputsMarkup}
        </ul>
      </section>

      <section class="section">
        <p class="section-heading">Results & Outputs</p>
        <ul class="data-grid">
          ${outputsMarkup}
        </ul>
      </section>

      <footer>
        Prepared with LeadLah calculators · Secure receipts for Malaysian REN workflows
      </footer>
    </main>
  </body>
</html>`;
}

function renderDataList(
  record: Record<string, number | string | boolean>,
  emptyCopy: string
): string {
  const entries = Object.entries(record ?? {});
  if (entries.length === 0) {
    return `<li class="empty">${escapeHtml(emptyCopy)}</li>`;
  }

  return entries
    .map(([key, value]) => {
      const label = formatLabel(key);
      const formattedValue = formatValue(key, value);
      return `<li>
        <p class="label">${escapeHtml(label)}</p>
        <p class="value">${formattedValue}</p>
      </li>`;
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
    String(date.getMinutes()).padStart(2, "0")
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
