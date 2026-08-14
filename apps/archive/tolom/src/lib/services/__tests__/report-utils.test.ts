import { describe, expect, it } from "vitest";

import {
  formatCurrencyHelper,
  formatNum,
  getWeekKey,
} from "../report-service/utils";

// ── formatNum ───────────────────────────────────────────────────

describe("formatNum", () => {
  it("formats small numbers without suffix", () => {
    expect(formatNum(0)).toBe("0");
    expect(formatNum(999)).toBe("999");
    expect(formatNum(-42)).toBe("-42");
  });

  it("formats thousands with a k suffix and one decimal", () => {
    expect(formatNum(1_000)).toBe("1.0k");
    expect(formatNum(1_234)).toBe("1.2k");
    expect(formatNum(999_999)).toBe("1000.0k");
    expect(formatNum(-1_500)).toBe("-1.5k");
  });

  it("formats millions with an M suffix and one decimal", () => {
    expect(formatNum(1_000_000)).toBe("1.0M");
    expect(formatNum(1_500_000)).toBe("1.5M");
    expect(formatNum(12_345_678)).toBe("12.3M");
    expect(formatNum(-2_500_000)).toBe("-2.5M");
  });
});

// ── formatCurrencyHelper ────────────────────────────────────────

describe("formatCurrencyHelper", () => {
  it("formats amounts as USD currency without decimals", () => {
    expect(formatCurrencyHelper(0)).toBe("$0");
    expect(formatCurrencyHelper(999)).toBe("$999");
    expect(formatCurrencyHelper(1_234.5)).toBe("$1,235");
    expect(formatCurrencyHelper(1_234_567)).toBe("$1,234,567");
    expect(formatCurrencyHelper(-50)).toBe("-$50");
  });
});

// ── getWeekKey ──────────────────────────────────────────────────

describe("getWeekKey", () => {
  it("computes week keys", () => {
    expect(getWeekKey("2025-06-22")).toBe("2025-W25"); // Sunday
    expect(getWeekKey("2025-01-01")).toBe("2025-W01");
    expect(getWeekKey("2025-12-31")).toBe("2026-W01");
    expect(getWeekKey("2024-12-29")).toBe("2024-W52");
  });

  it("matches ISO 8601 across week boundaries", () => {
    expect(getWeekKey("2025-06-16")).toBe("2025-W25"); // Monday of ISO W25
    expect(getWeekKey("2025-06-23")).toBe("2025-W26"); // Monday of ISO W26
    expect(getWeekKey("2024-12-30")).toBe("2025-W01"); // Monday of ISO 2025-W01
  });
});
