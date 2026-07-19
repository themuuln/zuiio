import { describe, expect, it } from "vitest";

// The digit formatting and zero-padding logic from ScoreFlip
function formatScore(value: number, digits: number): string {
  return String(value).padStart(digits, "0");
}

function splitDigits(value: number, digits: number): string[] {
  return formatScore(value, digits).split("");
}

describe("ScoreFlip formatting", () => {
  it("pads to minimum digits", () => {
    expect(formatScore(5, 2)).toBe("05");
    expect(formatScore(42, 2)).toBe("42");
  });

  it("handles zero", () => {
    expect(formatScore(0, 2)).toBe("00");
  });

  it("handles large numbers beyond digits", () => {
    // If the number exceeds the digit count, padStart preserves the full number
    expect(formatScore(100, 2)).toBe("100");
  });

  it("splits into digit array", () => {
    expect(splitDigits(42, 2)).toEqual(["4", "2"]);
    expect(splitDigits(89, 2)).toEqual(["8", "9"]);
  });

  it("handles single digit with split", () => {
    expect(splitDigits(7, 2)).toEqual(["0", "7"]);
  });

  it("handles triple-digit scores", () => {
    expect(splitDigits(112, 2)).toEqual(["1", "1", "2"]);
  });
});
