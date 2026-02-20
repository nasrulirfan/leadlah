import { calculateListingGrading, parseCompetitorPriceRangeText } from "@leadlah/core";
import { describe, expect, it } from "vitest";

describe("LeadLah listing grading", () => {
  it("parses competitor price ranges with k/m suffixes", () => {
    expect(parseCompetitorPriceRangeText("900k - 1.0m")).toEqual(
      expect.objectContaining({ min: 900000, max: 1000000 })
    );
    expect(parseCompetitorPriceRangeText("2.7m - 3.0m")).toEqual(
      expect.objectContaining({ min: 2700000, max: 3000000 })
    );
  });

  it("grades A when competitively priced and aligned to bank value", () => {
    const grading = calculateListingGrading({
      askingPrice: 500000,
      bankValue: 495000,
      competitorPriceRangeText: "500000 - 600000"
    });

    expect(grading.grade).toBe("A");
    expect(grading.marketPositionPct).toBe(0);
    expect(grading.bankValueGapPct).toBeCloseTo(1.0101, 3);
  });

  it("grades based on the worse of market position and bank gap", () => {
    const grading = calculateListingGrading({
      askingPrice: 550000,
      bankValue: 560000,
      competitorPriceRangeText: "500000 - 600000"
    });

    expect(grading.grade).toBe("B");
    expect(grading.marketPositionPct).toBe(50);
    expect(grading.bankValueGapPct).toBeLessThan(0);
  });

  it("grades C for high market position with moderate bank premium", () => {
    const grading = calculateListingGrading({
      askingPrice: 585000,
      bankValue: 520000,
      competitorPriceRangeText: "500000 - 620000"
    });

    expect(grading.grade).toBe("C");
    expect(grading.marketPositionPct).toBeCloseTo(70.833, 2);
    expect(grading.bankValueGapPct).toBeCloseTo(12.5, 3);
  });

  it("returns no grade when required inputs are missing", () => {
    const grading = calculateListingGrading({
      askingPrice: 500000,
      bankValue: null,
      competitorPriceRangeText: "500000 - 600000"
    });

    expect(grading.grade).toBeUndefined();
    expect(grading.missingInputs).toContain("bankValue");
  });

  it("clamps market position outside competitor range and emits a note", () => {
    const grading = calculateListingGrading({
      askingPrice: 650000,
      bankValue: 640000,
      competitorPriceRangeText: "500000 - 600000"
    });

    expect(grading.marketPositionPct).toBe(100);
    expect(grading.notes.join(" ")).toMatch(/above the competitor maximum/i);
  });
});

