import { describe, expect, it } from "vitest";

// Extract countdown logic for testing
function calculateTimeRemaining(targetIso: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const total = Math.floor(diff / 1000);

  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

describe("CountdownTimer", () => {
  it("returns positive total for future dates", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const remaining = calculateTimeRemaining(future);

    expect(remaining.total).toBeGreaterThan(0);
    expect(remaining.days).toBeGreaterThanOrEqual(0);
  });

  it("returns zero for past dates", () => {
    const past = new Date(Date.now() - 100000).toISOString();
    const remaining = calculateTimeRemaining(past);

    expect(remaining.total).toBe(0);
    expect(remaining.days).toBe(0);
  });

  it("pads single digits", () => {
    expect(pad(5)).toBe("05");
    expect(pad(12)).toBe("12");
    expect(pad(0)).toBe("00");
  });

  it("calculates hours and minutes correctly", () => {
    const twoHours30Min = new Date(
      Date.now() + 2 * 3600000 + 30 * 60000,
    ).toISOString();
    const remaining = calculateTimeRemaining(twoHours30Min);

    expect(remaining.hours).toBe(2);
    expect(remaining.minutes).toBe(30);
  });
});
