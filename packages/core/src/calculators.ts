import { addMonths } from "date-fns";
import { CalculatorReceipt } from "./types";

export type LoanEligibilityInput = {
  income: number;
  commitments: number;
  dsrPercent: number;
  interestRate: number;
  tenureYears: number;
};

export type LoanEligibilityResult = {
  maxInstallment: number;
  maxLoanAmount: number;
  maxPropertyPrice: number;
};

export function calculateLoanEligibility(
  input: LoanEligibilityInput
): LoanEligibilityResult {
  const netDisposable = Math.max(input.income - input.commitments, 0);
  const maxInstallment = (netDisposable * input.dsrPercent) / 100;
  const monthlyRate = input.interestRate / 100 / 12;
  const months = input.tenureYears * 12;
  const discountFactor =
    monthlyRate === 0
      ? months
      : (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
  const maxLoanAmount = maxInstallment * discountFactor;
  const maxPropertyPrice = maxLoanAmount / 0.9; // assume 10% downpayment
  return {
    maxInstallment,
    maxLoanAmount,
    maxPropertyPrice
  };
}

export type LegalFeeInput = {
  propertyPrice: number;
  isForeigner: boolean;
  requiresConsent: boolean;
  contractDate: Date;
};

export type LegalFeeResult = {
  legalFee: number;
  disbursement: number;
  stampDuty: number;
  total: number;
  foreignerRateApplied: number;
};

function calculateTieredLegalFee(amount: number): number {
  const firstTier = Math.min(amount, 500_000) * 0.0125;
  const remaining = Math.max(amount - 500_000, 0) * 0.01;
  return Math.min(firstTier + remaining, 70_000);
}

function calculateStandardStampDuty(propertyPrice: number): number {
  const first100k = Math.min(propertyPrice, 100_000) * 0.01;
  const next400k = Math.min(Math.max(propertyPrice - 100_000, 0), 400_000) * 0.02;
  const next500k = Math.min(Math.max(propertyPrice - 500_000, 0), 500_000) * 0.03;
  const remaining = Math.max(propertyPrice - 1_000_000, 0) * 0.04;
  return first100k + next400k + next500k + remaining;
}

export function calculateSpaMot(input: LegalFeeInput): LegalFeeResult {
  const legalFee = calculateTieredLegalFee(input.propertyPrice);
  const disbursement = input.requiresConsent ? 4000 : 2500;
  const cutoff = new Date("2026-01-01T00:00:00.000Z");
  const foreignerRate =
    input.contractDate >= cutoff ? 0.08 : input.isForeigner ? 0.04 : 0;
  const stampDuty = input.isForeigner
    ? input.propertyPrice * foreignerRate
    : calculateStandardStampDuty(input.propertyPrice);

  return {
    legalFee,
    disbursement,
    stampDuty,
    total: legalFee + disbursement + stampDuty,
    foreignerRateApplied: foreignerRate || 0
  };
}

export type LoanAgreementInput = {
  loanAmount: number;
};

export type LoanAgreementResult = {
  legalFee: number;
  stampDuty: number;
  total: number;
};

export function calculateLoanAgreement(
  input: LoanAgreementInput
): LoanAgreementResult {
  const legalFee = calculateTieredLegalFee(input.loanAmount);
  const stampDuty = input.loanAmount * 0.005;
  return {
    legalFee,
    stampDuty,
    total: legalFee + stampDuty
  };
}

export type RoiInput = {
  price: number;
  monthlyRent: number;
  annualCosts: number;
};

export type RoiResult = {
  grossYield: number;
  netYield: number;
};

export function calculateRoi(input: RoiInput): RoiResult {
  const annualRent = input.monthlyRent * 12;
  const grossYield = annualRent / input.price;
  const netYield = (annualRent - input.annualCosts) / input.price;
  return { grossYield, netYield };
}

export type SellabilityInput = {
  belowMarketPct: number; // positive means BMV
  competitionScore: number; // 0-10 lower is better
  liquidityScore: number; // 0-10 higher is better
};

export type SellabilityResult = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "E";
  commentary: string;
};

export function calculateSellability(
  input: SellabilityInput
): SellabilityResult {
  const priceScore = Math.min(Math.max(input.belowMarketPct * 2, 0), 40);
  const competitionWeight = 30 - input.competitionScore * 2;
  const liquidityWeight = input.liquidityScore * 3;
  const score = Math.max(
    0,
    Math.min(100, priceScore + competitionWeight + liquidityWeight)
  );
  const grade =
    score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "E";
  const commentary =
    grade === "A"
      ? "Likely to transact within 0-90 days."
      : grade === "B"
        ? "Strong positioning with manageable competition."
        : grade === "C"
          ? "Average appeal; refine pricing or marketing."
          : grade === "D"
            ? "Slow movement expected; adjust price or boost exposure."
            : "High friction; reposition or withdraw.";
  return { score, grade, commentary };
}

export type ListingGradingGrade = "A" | "B" | "C" | "D";

export type ListingGradingLabel = "Hot" | "Good" | "Hard Sell" | "Overpriced";

export type ListingGradingInput = {
  askingPrice: number;
  bankValue?: number | null;
  competitorMinPrice?: number | null;
  competitorMaxPrice?: number | null;
  competitorPriceRangeText?: string | null;
};

export type ListingGradingResult = {
  grade?: ListingGradingGrade;
  label?: ListingGradingLabel;
  marketPositionPct?: number;
  bankValueGapPct?: number;
  competitorMinPrice?: number;
  competitorMaxPrice?: number;
  missingInputs: Array<"bankValue" | "competitorMinPrice" | "competitorMaxPrice">;
  notes: string[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeNumericToken = (raw: string) => raw.replace(/,/g, "").trim();

function parseCompactNumber(raw: string): number | null {
  const match = raw
    .trim()
    .match(/^(\d[\d,]*(?:\.\d+)?)(?:\s*([kKmM]))?$/);
  if (!match) {
    return null;
  }

  const base = Number.parseFloat(normalizeNumericToken(match[1]));
  if (!Number.isFinite(base)) {
    return null;
  }

  const suffix = (match[2] ?? "").toLowerCase();
  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1;
  return base * multiplier;
}

export function parseCompetitorPriceRangeText(
  value: string | null | undefined
): { min?: number; max?: number; values: number[] } {
  const text = value?.trim();
  if (!text) {
    return { values: [] };
  }

  const values: number[] = [];
  const tokenRegex = /(\d[\d,]*(?:\.\d+)?\s*[kKmM]?)/g;
  for (const match of text.matchAll(tokenRegex)) {
    const parsed = parseCompactNumber(match[1]);
    if (parsed == null || !Number.isFinite(parsed) || parsed < 0) {
      continue;
    }
    values.push(parsed);
  }

  if (values.length === 0) {
    return { values };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, values };
}

function gradeLabelFor(grade: ListingGradingGrade): ListingGradingLabel {
  switch (grade) {
    case "A":
      return "Hot";
    case "B":
      return "Good";
    case "C":
      return "Hard Sell";
    case "D":
      return "Overpriced";
  }
}

function gradeForTier(tier: 1 | 2 | 3 | 4): ListingGradingGrade {
  return tier === 1 ? "A" : tier === 2 ? "B" : tier === 3 ? "C" : "D";
}

function tierFromMarketPosition(marketPositionPct: number): 1 | 2 | 3 | 4 {
  if (marketPositionPct <= 30) return 1;
  if (marketPositionPct <= 60) return 2;
  if (marketPositionPct <= 85) return 3;
  return 4;
}

function tierFromBankValueGap(bankValueGapPct: number): 1 | 2 | 3 | 4 {
  if (bankValueGapPct <= 5) return 1;
  if (bankValueGapPct <= 10) return 2;
  if (bankValueGapPct <= 20) return 3;
  return 4;
}

export function calculateListingGrading(
  input: ListingGradingInput
): ListingGradingResult {
  const notes: string[] = [];
  const missingInputs: ListingGradingResult["missingInputs"] = [];

  const parsedRange = parseCompetitorPriceRangeText(input.competitorPriceRangeText);
  const competitorMin =
    input.competitorMinPrice ?? parsedRange.min ?? undefined;
  const competitorMax =
    input.competitorMaxPrice ?? parsedRange.max ?? undefined;

  if (input.bankValue == null) missingInputs.push("bankValue");
  if (competitorMin == null) missingInputs.push("competitorMinPrice");
  if (competitorMax == null) missingInputs.push("competitorMaxPrice");

  let marketPositionPct: number | undefined;
  if (competitorMin != null && competitorMax != null) {
    if (competitorMax <= competitorMin) {
      notes.push("Competitor price range must have a larger max than min.");
    } else {
      const raw =
        ((input.askingPrice - competitorMin) / (competitorMax - competitorMin)) *
        100;
      if (raw < 0) {
        notes.push("Asking price is below the competitor minimum.");
      } else if (raw > 100) {
        notes.push("Asking price is above the competitor maximum.");
      }
      marketPositionPct = clamp(raw, 0, 100);
    }
  }

  let bankValueGapPct: number | undefined;
  if (input.bankValue != null) {
    if (input.bankValue <= 0) {
      notes.push("Bank/market value must be greater than 0.");
    } else {
      bankValueGapPct = ((input.askingPrice - input.bankValue) / input.bankValue) * 100;
    }
  }

  if (marketPositionPct == null || bankValueGapPct == null) {
    return {
      marketPositionPct,
      bankValueGapPct,
      competitorMinPrice: competitorMin,
      competitorMaxPrice: competitorMax,
      missingInputs,
      notes
    };
  }

  const marketTier = tierFromMarketPosition(marketPositionPct);
  const bankTier = tierFromBankValueGap(bankValueGapPct);
  const worstTier = (Math.max(marketTier, bankTier) as 1 | 2 | 3 | 4);
  const grade = gradeForTier(worstTier);

  return {
    grade,
    label: gradeLabelFor(grade),
    marketPositionPct,
    bankValueGapPct,
    competitorMinPrice: competitorMin,
    competitorMaxPrice: competitorMax,
    missingInputs,
    notes
  };
}

export type LandFeasibilityInput = {
  gdv: number;
  landCost: number;
};

export type LandFeasibilityResult = {
  margin: number;
  grade: "A" | "B" | "C" | "D" | "E";
  developerCost: number;
};

export function calculateLandFeasibility(
  input: LandFeasibilityInput
): LandFeasibilityResult {
  const developerCost = input.gdv * 0.45;
  const margin = (input.gdv - developerCost - input.landCost) / input.gdv;
  const grade =
    margin >= 0.25 ? "A" : margin >= 0.2 ? "B" : margin >= 0.15 ? "C" : margin >= 0.1 ? "D" : "E";
  return { margin, grade, developerCost };
}

export type TenancyStampDutyInput = {
  monthlyRent: number;
  years: number;
};

export type TenancyStampDutyResult = {
  roundedAnnualRent: number;
  blocks: number;
  rate: number;
  stampDuty: number;
};

export function calculateTenancyStampDuty(
  input: TenancyStampDutyInput
): TenancyStampDutyResult {
  const annualRent = input.monthlyRent * 12;
  const roundedAnnualRent = Math.round(annualRent / 250) * 250;
  const blocks = roundedAnnualRent / 250;
  const rate = input.years <= 1 ? 1.0 : input.years <= 3 ? 2.0 : 4.0;
  const stampDuty = blocks * rate + 10; // RM10 agreement fee
  return { roundedAnnualRent, blocks, rate, stampDuty };
}

export function buildReceipt(payload: CalculatorReceipt): CalculatorReceipt {
  return {
    ...payload,
    issuedAt: payload.issuedAt || new Date()
  };
}

export type ReminderScheduleInput = {
  listingCreatedAt: Date;
  portalCycleDays: number;
  exclusiveEndsAt?: Date;
  tenancyEndsAt?: Date;
};

export type ReminderSchedule = {
  portalExpiry: Date;
  portalAlertAt: Date;
  exclusiveAlertAt?: Date;
  tenancyAlertAt?: Date;
};

export function generateReminderSchedule(
  input: ReminderScheduleInput
): ReminderSchedule {
  const portalExpiry = addMonths(input.listingCreatedAt, input.portalCycleDays / 30);
  const portalAlertAt = addMonths(
    input.listingCreatedAt,
    input.portalCycleDays / 30
  );
  portalAlertAt.setDate(portalAlertAt.getDate() - 3);

  const exclusiveAlertAt = input.exclusiveEndsAt
    ? addMonths(input.exclusiveEndsAt, 0)
    : undefined;
  if (exclusiveAlertAt) {
    exclusiveAlertAt.setDate(exclusiveAlertAt.getDate() - 7);
  }

  const tenancyAlertAt = input.tenancyEndsAt
    ? addMonths(input.tenancyEndsAt, 0)
    : undefined;
  if (tenancyAlertAt) {
    tenancyAlertAt.setMonth(tenancyAlertAt.getMonth() - 2);
  }

  return {
    portalExpiry,
    portalAlertAt,
    exclusiveAlertAt,
    tenancyAlertAt
  };
}
