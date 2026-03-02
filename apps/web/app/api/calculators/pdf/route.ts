import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import type { CalculatorReceipt } from "@leadlah/core";

import { generateCalculatorReceiptPdfBuffer } from "@/lib/pdf/generate-calculator-receipt-pdf";
import { fetchProfile } from "@/data/profile";
import { auth, ensureAuthReady } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let leadlahMarkBufferCache: Buffer | undefined;
let leadlahMarkBufferLoaded = false;

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
    await ensureAuthReady();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const profile = await fetchProfile(session.user.id, {
      name: session.user.name ?? undefined,
      email: session.user.email ?? undefined,
    });
    const normalized = normalizeReceipt(payload);
    const receipt: CalculatorReceipt = {
      ...normalized,
      renNumber:
        extractOptionalString(profile.renNumber) ?? normalized.renNumber,
      agencyLogoUrl:
        extractOptionalString(profile.agencyLogoUrl) ??
        normalized.agencyLogoUrl,
    };

    const leadlahMarkBuffer = await getLeadlahMarkBuffer();
    const pdfBuffer = await generateCalculatorReceiptPdfBuffer(receipt, {
      leadlahMarkBuffer,
      agencyLogoUrl: receipt.agencyLogoUrl,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${buildFileName(receipt)}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate calculator receipt.";
    console.error("[calculators.pdf] Failed to generate receipt:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function getLeadlahMarkBuffer(): Promise<Buffer | undefined> {
  if (leadlahMarkBufferLoaded) {
    return leadlahMarkBufferCache;
  }

  leadlahMarkBufferLoaded = true;
  const assetPath = resolveBrandAssetPath("brand/leadlah-symbol-white.png");
  if (!assetPath) {
    return undefined;
  }

  try {
    leadlahMarkBufferCache = await readFile(assetPath);
  } catch (error) {
    console.warn("[calculators.pdf] Unable to load LeadLah logo asset:", error);
    leadlahMarkBufferCache = undefined;
  }

  return leadlahMarkBufferCache;
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
  const renNumber = extractOptionalString(payload.renNumber) ?? "REN 00000";
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
