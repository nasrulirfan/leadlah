import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import type { CalculatorReceipt } from "@leadlah/core";

import { generateCalculatorReceiptHtml } from "@/lib/pdf/generate-calculator-receipt-html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let leadlahMarkDataUriCache: string | undefined;
let leadlahMarkDataUriLoaded = false;

type AllowableType = CalculatorReceipt["calculationType"];
const allowedTypes: AllowableType[] = [
  "Loan Eligibility",
  "SPA/MOT",
  "Loan Agreement",
  "ROI",
  "Sellability",
  "Land Feasibility",
  "Tenancy Stamp Duty",
];

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const receipt = normalizeReceipt(payload);
    const leadlahMarkDataUri = await getLeadlahMarkDataUri();
    const html = generateCalculatorReceiptHtml(receipt, { leadlahMarkDataUri });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      });
      await page.setContent(html, { waitUntil: "networkidle0" });
      await page.emulateMediaType("screen");
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "0",
          bottom: "0",
          left: "0",
          right: "0",
        },
      });

      const pdfBody = Uint8Array.from(pdf).buffer as ArrayBuffer;

      return new NextResponse(pdfBody, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${buildFileName(receipt)}`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate calculator receipt.";
    console.error("[calculators.pdf] Failed to generate receipt:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function getLeadlahMarkDataUri(): Promise<string | undefined> {
  if (leadlahMarkDataUriLoaded) {
    return leadlahMarkDataUriCache;
  }

  leadlahMarkDataUriLoaded = true;
  const assetPath = resolveBrandAssetPath("brand/leadlah-symbol.png");
  if (!assetPath) {
    return undefined;
  }

  try {
    const buffer = await readFile(assetPath);
    leadlahMarkDataUriCache = `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.warn("[calculators.pdf] Unable to load LeadLah logo asset:", error);
    leadlahMarkDataUriCache = undefined;
  }

  return leadlahMarkDataUriCache;
}

function resolveBrandAssetPath(assetPath: string): string | undefined {
  const candidates = [
    path.join(process.cwd(), "public", assetPath),
    path.join(process.cwd(), "apps", "web", "public", assetPath),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function normalizeReceipt(payload: Record<string, unknown>): CalculatorReceipt {
  const issuedAtRaw = payload.issuedAt;
  const issuedAt = new Date(String(issuedAtRaw));
  if (Number.isNaN(issuedAt.getTime())) {
    throw new Error("Issued at timestamp is invalid.");
  }

  const calculationTypeRaw = payload.calculationType;
  if (!allowedTypes.includes(calculationTypeRaw as AllowableType)) {
    throw new Error("Unsupported calculation type.");
  }
  const calculationType = calculationTypeRaw as AllowableType;

  const agentName = extractRequiredString(payload.agentName, "Agent name");
  const renNumber = extractRequiredString(payload.renNumber, "REN number");
  const customerName = extractOptionalString(payload.customerName);
  const agencyLogoUrl = extractOptionalString(payload.agencyLogoUrl);

  const inputs = extractInputsRecord(payload.inputs, "inputs");
  const outputs = extractOutputsRecord(payload.outputs, "outputs");

  return {
    agentName,
    customerName,
    renNumber,
    agencyLogoUrl,
    calculationType,
    inputs,
    outputs,
    issuedAt,
  };
}

function extractInputsRecord(
  source: unknown,
  fieldName: string,
): Record<string, number | string | boolean> {
  return extractRecordInternal(source, fieldName, true);
}

function extractOutputsRecord(
  source: unknown,
  fieldName: string,
): Record<string, number | string> {
  if (!source || typeof source !== "object") {
    throw new Error(`Receipt ${fieldName} are missing.`);
  }

  return Object.entries(source).reduce<Record<string, number | string>>(
    (acc, [key, value]) => {
      if (typeof value === "string" || typeof value === "number") {
        acc[key] = value;
      } else if (value != null) {
        acc[key] = String(value);
      }
      return acc;
    },
    {},
  );
}

function extractRecordInternal(
  source: unknown,
  fieldName: string,
  allowBoolean: boolean,
): Record<string, number | string | boolean> {
  if (!source || typeof source !== "object") {
    throw new Error(`Receipt ${fieldName} are missing.`);
  }

  return Object.entries(source).reduce<
    Record<string, number | string | boolean>
  >((acc, [key, value]) => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      (allowBoolean && typeof value === "boolean")
    ) {
      acc[key] = value;
    } else if (value != null) {
      acc[key] = String(value);
    }
    return acc;
  }, {});
}

function extractRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required for the receipt.`);
  }
  return value.trim();
}

function extractOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function buildFileName(receipt: CalculatorReceipt): string {
  const slug = receipt.calculationType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const date = receipt.issuedAt.toISOString().split("T")[0];
  return `${slug}-receipt-${date}.pdf`;
}
