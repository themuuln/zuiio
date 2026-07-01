import { describe, it, expect } from "vitest";
import { calculateSocialInsurance } from "./social-insurance";

describe("calculateSocialInsurance", () => {
  it("calculates employee share at 11.5% of capped salary", () => {
    const result = calculateSocialInsurance(1_000_000, "low", 792_000);
    expect(result.employeeShare).toBe(115_000);
    expect(result.employerShare).toBe(125_000);
  });

  it("caps salary at 10x min wage", () => {
    const result = calculateSocialInsurance(10_000_000, "low", 792_000);
    const cappedSi = 7_920_000 * 0.115;
    expect(result.employeeShare).toBe(cappedSi);
  });

  it("uses different employer rates for risk classes", () => {
    const low = calculateSocialInsurance(1_000_000, "low", 792_000);
    const high = calculateSocialInsurance(1_000_000, "high", 792_000);
    expect(high.employerShare).toBeGreaterThan(low.employerShare);
  });
});
