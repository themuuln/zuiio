import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeNextDueDate,
  computeNextDueKm,
  elapsedMinutes,
  formatDate,
  formatKm,
} from "../_helpers";

describe("elapsedMinutes", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for null/undefined timestamps", () => {
    expect(elapsedMinutes(null)).toBeNull();
    expect(elapsedMinutes(undefined)).toBeNull();
  });

  it("returns rounded minutes since the timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    expect(elapsedMinutes("2026-08-09T11:30:00Z")).toBe(30);
    // 90 seconds rounds up to 2 minutes
    expect(elapsedMinutes("2026-08-09T11:58:30Z")).toBe(2);
  });

  it("returns null for future timestamps (clock skew guard)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    expect(elapsedMinutes("2026-08-09T12:30:00Z")).toBeNull();
  });
});

describe("computeNextDueDate", () => {
  it("returns null for falsy intervals", () => {
    expect(computeNextDueDate(null)).toBeNull();
    expect(computeNextDueDate(0)).toBeNull();
  });

  it("adds the month interval to today and returns YYYY-MM-DD", () => {
    vi.useFakeTimers();
    // Noon UTC keeps the calendar date stable across timezones
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    expect(computeNextDueDate(6)).toBe("2026-07-15");
    expect(computeNextDueDate(1)).toBe("2026-02-15");
  });
});

describe("computeNextDueKm", () => {
  it("returns null when either input is falsy", () => {
    expect(computeNextDueKm(null, 1000)).toBeNull();
    expect(computeNextDueKm(5000, null)).toBeNull();
    expect(computeNextDueKm(0, 1000)).toBeNull();
  });

  it("sums interval and current odometer", () => {
    expect(computeNextDueKm(5000, 12345)).toBe(17345);
  });
});

describe("formatDate", () => {
  it("formats an ISO date as short month/day/year", () => {
    expect(formatDate("2026-08-09")).toBe("Aug 9, 2026");
  });
});

describe("formatKm", () => {
  it("groups thousands with en-US separators", () => {
    expect(formatKm(12345)).toBe("12,345");
    expect(formatKm(1000)).toBe("1,000");
  });
});
