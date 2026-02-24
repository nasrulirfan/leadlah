import { calculateLoanEligibility } from "@leadlah/core";

describe("calculateLoanEligibility", () => {
  it("matches the standard reverse-DSR example (income × DSR% − commitments)", () => {
    const result = calculateLoanEligibility({
      income: 2800,
      commitments: 600,
      dsrPercent: 60,
      interestRate: 4,
      tenureYears: 35,
    });

    expect(result.maxInstallment).toBeCloseTo(1080, 6);
    expect(Math.round(result.maxLoanAmount)).toBe(243_916);
  });

  it("clamps maxInstallment to 0 when commitments exceed max DSR amount", () => {
    const result = calculateLoanEligibility({
      income: 3000,
      commitments: 2500,
      dsrPercent: 60,
      interestRate: 4,
      tenureYears: 35,
    });

    expect(result.maxInstallment).toBe(0);
    expect(result.maxLoanAmount).toBe(0);
  });
});

