import { calculateTenancyStampDuty } from "@leadlah/core";

describe("calculateTenancyStampDuty", () => {
  it("rounds annual rent up to the next RM250 block", () => {
    const result = calculateTenancyStampDuty({ monthlyRent: 2001, years: 1 });

    expect(result.blocks).toBe(97);
    expect(result.roundedAnnualRent).toBe(24_250);
    expect(result.rate).toBe(1);
    expect(result.stampDuty).toBe(107);
  });

  it("applies rate tiers (<=1:1, <=3:3, <=5:5, >5:7) and adds RM10", () => {
    expect(calculateTenancyStampDuty({ monthlyRent: 2500, years: 2 })).toMatchObject(
      {
        blocks: 120,
        rate: 3,
        stampDuty: 370,
      },
    );

    expect(calculateTenancyStampDuty({ monthlyRent: 2500, years: 6 })).toMatchObject(
      {
        blocks: 120,
        rate: 7,
        stampDuty: 850,
      },
    );
  });

  it("returns zeros for non-positive inputs", () => {
    expect(calculateTenancyStampDuty({ monthlyRent: 0, years: 2 })).toMatchObject({
      blocks: 0,
      stampDuty: 0,
    });
    expect(calculateTenancyStampDuty({ monthlyRent: 2500, years: 0 })).toMatchObject({
      blocks: 0,
      stampDuty: 0,
    });
  });
});

