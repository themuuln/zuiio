import { describe, expect, it } from "vitest";
import {
  colors,
  formatAmount,
  formatDate,
  formatDateTime,
  sharedStyles,
  t,
} from "../pdf-styles";

describe("t", () => {
  it("returns the English translation for existing keys", () => {
    expect(t("en", "invoice")).toBe("INVOICE");
    expect(t("en", "grandTotal")).toBe("Total");
    expect(t("en", "walkIn")).toBe("Walk-in Customer");
  });

  it("returns the Mongolian translation for existing keys", () => {
    expect(t("mn", "invoice")).toBe("НЭХЭЛГЭЭ");
    expect(t("mn", "grandTotal")).toBe("Нийт дүн");
    expect(t("mn", "walkIn")).toBe("Зочин үйлчлүүлэгч");
  });

  it("prefers the locale-specific translation over English", () => {
    expect(t("mn", "manual")).toBe("Гараар");
    expect(t("mn", "vatAbbr")).toBe("НӨАТ");
  });

  it("falls back to the key itself when no locale has a translation", () => {
    expect(t("en", "noSuchKey")).toBe("noSuchKey");
    expect(t("mn", "noSuchKey")).toBe("noSuchKey");
  });
});

describe("colors", () => {
  it("exposes the exact palette used by document styles", () => {
    expect(colors).toEqual({
      black: "#1a1a1a",
      dark: "#333333",
      gray: "#666666",
      lightGray: "#999999",
      border: "#e5e7eb",
      background: "#f9fafb",
      white: "#ffffff",
      primary: "#2563eb",
      destructive: "#dc2626",
      success: "#16a34a",
    });
  });
});

describe("formatAmount", () => {
  it("formats MNT with the ₮ symbol and mn-MN grouping", () => {
    expect(formatAmount(15000)).toBe("₮15,000");
    expect(formatAmount(0)).toBe("₮0");
    expect(formatAmount(123456789)).toBe("₮123,456,789");
  });

  it("formats USD as a currency", () => {
    expect(formatAmount(1234.5, "USD")).toBe("$1,234.50");
  });

  it("is case-insensitive for the currency key", () => {
    expect(formatAmount(1000, "mnt")).toBe("₮1,000");
  });

  it("falls back to a plain labeled number for unknown currencies", () => {
    expect(formatAmount(1234, "XYZ")).toBe("XYZ 1,234");
  });
});

describe("formatDate", () => {
  it("formats a valid date as day-month-year", () => {
    expect(formatDate("2026-08-09T12:00:00Z")).toBe("09 Aug 2026");
  });

  it("returns an em dash for null or empty input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("includes the time for a valid date", () => {
    // Local-time string (no Z) so the assertion is timezone-independent
    const formatted = formatDateTime("2026-08-09T14:30:00");
    expect(formatted).toContain("09 Aug 2026");
    expect(formatted).toContain("14:30");
  });

  it("returns an em dash for null or empty input", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("")).toBe("—");
  });
});

describe("sharedStyles", () => {
  it("uses the page typography invariants", () => {
    expect(sharedStyles.page).toMatchObject({
      padding: 40,
      fontSize: 9,
      fontFamily: "Helvetica",
      color: colors.black,
    });
  });

  it("uses a horizontal space-between header layout", () => {
    expect(sharedStyles.header).toMatchObject({
      flexDirection: "row",
      justifyContent: "space-between",
    });
  });

  it("uses the primary color for the invoice title and grand total", () => {
    expect(sharedStyles.invoiceTitle).toMatchObject({
      fontSize: 20,
      color: colors.primary,
    });
    expect(sharedStyles.grandTotalValue).toMatchObject({
      fontSize: 12,
      color: colors.primary,
    });
  });

  it("keeps the footer absolutely positioned at the page bottom", () => {
    expect(sharedStyles.footer).toMatchObject({
      position: "absolute",
      bottom: 30,
      textAlign: "center",
    });
  });

  it("sizes the totals table and status badge consistently", () => {
    expect(sharedStyles.totalsTable).toMatchObject({ width: 240 });
    expect(sharedStyles.statusText).toMatchObject({
      textTransform: "uppercase",
    });
  });
});
