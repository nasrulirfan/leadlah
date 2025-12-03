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
