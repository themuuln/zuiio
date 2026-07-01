import { describe, it, expect } from "vitest";
import { calculateIncomeTax } from "./income-tax";
import { calculateSocialInsurance } from "./social-insurance";

describe("calculateIncomeTax", () => {
  const si = calculateSocialInsurance(1_000_000, "low", 792_000);

  it("calculates 10% PIT with allowance", () => {
    const result = calculateIncomeTax(1_000_000, si, 792_000);
    expect(result.taxableIncome).toBe(885_000);
    expect(result.allowance).toBe(18_000);
    expect(result.netTax).toBe(70_500);
  });

  it("returns 0 allowance for salaries over 3M", () => {
    const highSi = calculateSocialInsurance(3_500_000, "low", 792_000);
    const result = calculateIncomeTax(3_500_000, highSi, 792_000);
    expect(result.allowance).toBe(0);
  });

  it("applies progressive rate for annual income over 120M", () => {
    const monthlyGross = 11_000_000;
    const si = calculateSocialInsurance(monthlyGross, "low", 792_000);
    const result = calculateIncomeTax(monthlyGross, si, 792_000);

    const annualTaxable = (monthlyGross - si.employeeShare) * 12;
    expect(annualTaxable).toBeGreaterThan(120_000_000);
    const expectedMonthly =
      (12_000_000 + (annualTaxable - 120_000_000) * 0.15) / 12;
    expect(result.netTax).toBe(expectedMonthly);
  });
});
