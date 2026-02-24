import { calculateLoanAgreement, calculateSpaMot } from "@leadlah/core";

describe("calculateSpaMot", () => {
  it("removes stamp duty when partyRole is vendor", () => {
    const result = calculateSpaMot({
      propertyPrice: 900_000,
      isForeigner: false,
      requiresConsent: false,
      partyRole: "vendor",
    });

    expect(result.stampDuty).toBe(0);
    expect(result.total).toBeCloseTo(result.legalFee + result.disbursement, 6);
  });

  it("applies first-home buyer stamp duty relief only for residential < RM500k", () => {
    const eligible = calculateSpaMot({
      propertyPrice: 400_000,
      isForeigner: false,
      requiresConsent: false,
      partyRole: "purchaser",
      propertyCategory: "residential",
      isFirstHomeBuyer: true,
    });

    expect(eligible.stampDuty).toBe(0);

    const ineligible = calculateSpaMot({
      propertyPrice: 600_000,
      isForeigner: false,
      requiresConsent: false,
      partyRole: "purchaser",
      propertyCategory: "residential",
      isFirstHomeBuyer: true,
    });

    expect(ineligible.stampDuty).toBeGreaterThan(0);
  });
});

describe("calculateLoanAgreement", () => {
  it("applies first-home buyer stamp duty relief only for residential < RM500k", () => {
    const eligible = calculateLoanAgreement({
      loanAmount: 350_000,
      propertyPrice: 400_000,
      propertyCategory: "residential",
      isFirstHomeBuyer: true,
    });

    expect(eligible.stampDuty).toBe(0);

    const ineligible = calculateLoanAgreement({
      loanAmount: 350_000,
      propertyPrice: 600_000,
      propertyCategory: "residential",
      isFirstHomeBuyer: true,
    });

    expect(ineligible.stampDuty).toBeCloseTo(1750, 6);
  });
});

