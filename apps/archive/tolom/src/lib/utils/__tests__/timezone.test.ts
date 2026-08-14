import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDateRange,
  formatFullDateTime,
  formatInUB,
  formatRelative,
  formatShortDate,
  formatTime,
  formatWithDayOfWeek,
  getUBDayEnd,
  getUBDayStart,
  toUBDate,
} from "../timezone";

describe("formatInUB", () => {
  it("formats a Date with default pattern (dd MMM yyyy, HH:mm)", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatInUB(date)).toBe("29 May 2026, 14:00");
  });

  it("formats a Date with custom pattern", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatInUB(date, "dd MMM yyyy")).toBe("29 May 2026");
  });

  it("formats an ISO string", () => {
    expect(formatInUB("2026-05-29T06:00:00Z", "dd MMM yyyy")).toBe(
      "29 May 2026",
    );
  });
});

describe("formatShortDate", () => {
  it("returns dd MMM yyyy format from a Date", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatShortDate(date)).toBe("29 May 2026");
  });

  it("returns dd MMM yyyy format from an ISO string", () => {
    expect(formatShortDate("2026-05-29T06:00:00Z")).toBe("29 May 2026");
  });
});

describe("formatTime", () => {
  it("returns HH:mm format from a Date", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatTime(date)).toBe("14:00");
  });

  it("returns HH:mm format from an ISO string", () => {
    expect(formatTime("2026-05-29T06:00:00Z")).toBe("14:00");
  });

  it("handles midnight correctly", () => {
    const date = new Date("2026-05-29T16:00:00Z");
    // 16:00 UTC = 00:00 UB next day
    expect(formatTime(date)).toBe("00:00");
  });
});

describe("formatFullDateTime", () => {
  it("returns dd MMM yyyy, HH:mm format from a Date", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatFullDateTime(date)).toBe("29 May 2026, 14:00");
  });

  it("returns dd MMM yyyy, HH:mm format from an ISO string", () => {
    expect(formatFullDateTime("2026-05-29T06:00:00Z")).toBe(
      "29 May 2026, 14:00",
    );
  });
});

describe("formatRelative", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Just now' for a date less than 1 minute ago", () => {
    vi.setSystemTime(new Date("2026-05-29T06:00:00Z"));
    expect(formatRelative(new Date("2026-05-29T05:59:30Z"))).toBe("Just now");
  });

  it("returns Xm ago for minutes", () => {
    vi.setSystemTime(new Date("2026-05-29T06:00:00Z"));
    expect(formatRelative(new Date("2026-05-29T05:45:00Z"))).toBe("15m ago");
  });

  it("returns Xh ago for hours", () => {
    vi.setSystemTime(new Date("2026-05-29T12:00:00Z"));
    expect(formatRelative(new Date("2026-05-29T06:00:00Z"))).toBe("6h ago");
  });

  it("returns 'Yesterday' for 1 day ago", () => {
    vi.setSystemTime(new Date("2026-05-29T06:00:00Z"));
    expect(formatRelative(new Date("2026-05-28T05:00:00Z"))).toBe("Yesterday");
  });

  it("returns Xd ago for less than 7 days", () => {
    vi.setSystemTime(new Date("2026-05-29T06:00:00Z"));
    expect(formatRelative(new Date("2026-05-26T06:00:00Z"))).toBe("3d ago");
  });

  it("falls back to short date for 7 or more days", () => {
    vi.setSystemTime(new Date("2026-06-05T06:00:00Z"));
    expect(formatRelative(new Date("2026-05-29T06:00:00Z"))).toBe(
      "29 May 2026",
    );
  });

  it("accepts an ISO string", () => {
    vi.setSystemTime(new Date("2026-05-29T12:00:00Z"));
    expect(formatRelative("2026-05-29T06:00:00Z")).toBe("6h ago");
  });
});

describe("toUBDate", () => {
  it("converts a UTC date to a Date representing UB local time", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    const result = toUBDate(date);

    expect(result).toBeInstanceOf(Date);
    // UB (UTC+8): 06:00 UTC = 14:00 UB, so hours should be 14
    expect(result.getHours()).toBe(14);
  });
});

describe("getUBDayStart", () => {
  it("returns midnight in UB timezone for a given date", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    const result = getUBDayStart(date);

    expect(result).toBeInstanceOf(Date);
    // UB day start for 29 May = 00:00:00 UB = 28 May 16:00:00 UTC
    expect(result.getTime()).toBe(new Date("2026-05-28T16:00:00Z").getTime());
  });

  it("defaults to current date when no argument given", () => {
    const result = getUBDayStart();
    expect(result).toBeInstanceOf(Date);
  });
});

describe("getUBDayEnd", () => {
  it("returns 23:59:59 in UB timezone for a given date", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    const result = getUBDayEnd(date);

    expect(result).toBeInstanceOf(Date);
    // UB day end for 29 May = 23:59:59 UB = 29 May 15:59:59 UTC
    expect(result.getTime()).toBe(new Date("2026-05-29T15:59:59Z").getTime());
  });

  it("returns a time after getUBDayStart for the same date", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(getUBDayEnd(date).getTime()).toBeGreaterThan(
      getUBDayStart(date).getTime(),
    );
  });

  it("defaults to current date when no argument given", () => {
    const result = getUBDayEnd();
    expect(result).toBeInstanceOf(Date);
  });
});

describe("formatDateRange", () => {
  it("formats same-month range with en-dash: dd–dd MMM yyyy", () => {
    const from = new Date("2026-05-15T06:00:00Z");
    const to = new Date("2026-05-29T06:00:00Z");
    expect(formatDateRange(from, to)).toBe("15–29 May 2026");
  });

  it("formats different-months range: dd MMM – dd MMM yyyy", () => {
    const from = new Date("2026-04-15T06:00:00Z");
    const to = new Date("2026-05-29T06:00:00Z");
    expect(formatDateRange(from, to)).toBe("15 Apr – 29 May 2026");
  });

  it("accepts ISO strings", () => {
    expect(
      formatDateRange("2026-04-15T06:00:00Z", "2026-05-29T06:00:00Z"),
    ).toBe("15 Apr – 29 May 2026");
  });

  it("handles cross-year ranges", () => {
    const from = new Date("2025-12-28T06:00:00Z");
    const to = new Date("2026-01-05T06:00:00Z");
    expect(formatDateRange(from, to)).toBe("28 Dec – 05 Jan 2026");
  });
});

describe("formatWithDayOfWeek", () => {
  it("includes the weekday name", () => {
    // 29 May 2026 is a Friday
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatWithDayOfWeek(date)).toBe("29 May 2026, Friday");
  });

  it("accepts an ISO string", () => {
    expect(formatWithDayOfWeek("2026-05-29T06:00:00Z")).toBe(
      "29 May 2026, Friday",
    );
  });

  it("works for a Sunday", () => {
    // 31 May 2026 is a Sunday
    const date = new Date("2026-05-31T06:00:00Z");
    expect(formatWithDayOfWeek(date)).toBe("31 May 2026, Sunday");
  });
});
