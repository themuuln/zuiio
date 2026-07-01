import { describe, it, expect } from "vitest";
import { calculateOvertimePay } from "./overtime";

describe("calculateOvertimePay", () => {
  it("calculates weekday OT at 1.5x", () => {
    const result = calculateOvertimePay(
      [{ date: "2026-01-15", hours: 2, type: "weekday" }],
      5_000,
    );
    expect(result).toBe(15_000);
  });

  it("calculates weekend OT at 2x", () => {
    const result = calculateOvertimePay(
      [{ date: "2026-01-17", hours: 4, type: "weekend" }],
      5_000,
    );
    expect(result).toBe(40_000);
  });

  it("calculates night shift at 1.4x", () => {
    const result = calculateOvertimePay(
      [{ date: "2026-01-15", hours: 3, type: "night" }],
      5_000,
    );
    expect(result).toBe(21_000);
  });

  it("sums multiple entries", () => {
    const result = calculateOvertimePay(
      [
        { date: "2026-01-15", hours: 2, type: "weekday" },
        { date: "2026-01-17", hours: 4, type: "weekend" },
      ],
      5_000,
    );
    expect(result).toBe(55_000);
  });
});
