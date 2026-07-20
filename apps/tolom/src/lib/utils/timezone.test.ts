import { describe, expect, it } from "vitest";
import {
  formatInUB,
  formatShortDate,
  formatTime,
  formatFullDateTime,
  formatDateRange,
  formatWithDayOfWeek,
  toUBDate,
  getUBDayStart,
  getUBDayEnd,
  TOLOM_TZ,
} from "./timezone";

describe("TOLOM_TZ", () => {
  it("is Asia/Ulaanbaatar", () => {
    expect(TOLOM_TZ).toBe("Asia/Ulaanbaatar");
  });
});

describe("formatInUB", () => {
  it("formats a Date in UB timezone", () => {
    const date = new Date("2026-05-29T06:00:00Z"); // 14:00 UB
    const result = formatInUB(date, "HH:mm");
    expect(result).toBe("14:00");
  });

  it("formats an ISO string", () => {
    const result = formatInUB("2026-05-29T06:00:00Z", "HH:mm");
    expect(result).toBe("14:00");
  });

  it("uses default pattern when not specified", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    const result = formatInUB(date);
    expect(result).toContain("May 2026");
  });
});

describe("formatShortDate", () => {
  it("formats as dd MMM yyyy", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatShortDate(date)).toBe("29 May 2026");
  });
});

describe("formatTime", () => {
  it("formats as HH:mm", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatTime(date)).toBe("14:00");
  });
});

describe("formatFullDateTime", () => {
  it("formats as full datetime", () => {
    const date = new Date("2026-05-29T06:00:00Z");
    expect(formatFullDateTime(date)).toBe("29 May 2026, 14:00");
  });
});

describe("toUBDate", () => {
  it("converts UTC Date to UB-local Date", () => {
    const utcDate = new Date("2026-05-29T00:00:00Z"); // 08:00 UB = May 29
    const ubDate = toUBDate(utcDate);
    // The resulting Date object should represent the same clock time in UB
    expect(ubDate.getDate()).toBe(29);
  });
});

describe("getUBDayStart", () => {
  it("returns start of day in UB timezone", () => {
    const date = new Date("2026-05-29T10:00:00Z"); // 18:00 UB on May 29
    const start = getUBDayStart(date);
    // Should return midnight May 29 UB = May 28 16:00Z
    expect(start.getUTCHours()).toBe(16); // 00:00 UB = 16:00Z prev day
  });

  it("defaults to current date when no argument", () => {
    const start = getUBDayStart();
    expect(start).toBeInstanceOf(Date);
  });
});

describe("getUBDayEnd", () => {
  it("returns end of day in UB timezone", () => {
    const date = new Date("2026-05-29T10:00:00Z"); // 18:00 UB on May 29
    const end = getUBDayEnd(date);
    // Should return 23:59:59 UB = 15:59:59Z
    expect(end.getUTCHours()).toBe(15); // 23:59 UB = 15:59Z (actually 15:59Z + 8 = 23:59)
    expect(end.getUTCMinutes()).toBe(59);
    expect(end.getUTCSeconds()).toBe(59);
  });
});

describe("formatDateRange", () => {
  it("formats same-month range", () => {
    const from = new Date("2026-05-15T00:00:00Z");
    const to = new Date("2026-05-29T00:00:00Z");
    expect(formatDateRange(from, to)).toContain("May 2026");
  });

  it("handles string inputs", () => {
    const from = "2026-05-15T00:00:00Z";
    const to = "2026-06-15T00:00:00Z";
    const result = formatDateRange(from, to);
    expect(result).toContain("May");
    expect(result).toContain("Jun");
  });
});

describe("formatWithDayOfWeek", () => {
  it("includes day of week", () => {
    const date = new Date("2026-05-29T06:00:00Z"); // Friday
    const result = formatWithDayOfWeek(date);
    expect(result).toContain("Friday");
  });
});
