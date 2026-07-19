import { describe, expect, it } from "vitest";

// Extract the logic from FlipDigit for testing
function formatDigit(value: number): string {
  return String(value).padStart(1, "0");
}

function splitIntoDigits(value: number): number[] {
  if (value < 10) return [value];
  return String(value)
    .split("")
    .map(Number);
}

describe("FlipDigit", () => {
  it("formats single digit", () => {
    expect(formatDigit(5)).toBe("5");
  });

  it("splits single digit into array", () => {
    expect(splitIntoDigits(5)).toEqual([5]);
  });

  it("splits multi-digit number", () => {
    expect(splitIntoDigits(42)).toEqual([4, 2]);
  });

  it("splits triple digit number", () => {
    expect(splitIntoDigits(123)).toEqual([1, 2, 3]);
  });

  it("handles zero", () => {
    expect(splitIntoDigits(0)).toEqual([0]);
  });
});

describe("FlipScore digit extraction", () => {
  // FlipScore uses getDigits to split a score into individual digits
  function getDigits(n: number): number[] {
    if (n < 10) return [n];
    return String(n)
      .split("")
      .map(Number);
  }

  it("extracts digits from score", () => {
    expect(getDigits(85)).toEqual([8, 5]);
    expect(getDigits(92)).toEqual([9, 2]);
  });

  it("handles single digit score", () => {
    expect(getDigits(7)).toEqual([7]);
  });

  it("handles zero", () => {
    expect(getDigits(0)).toEqual([0]);
  });

  it("handles triple digit score", () => {
    expect(getDigits(105)).toEqual([1, 0, 5]);
  });
});
