import { describe, expect, it } from "vitest";
import {
  getMongolianBank,
  isMongolianBankId,
  MONGOLIAN_BANK_IDS,
  MONGOLIAN_BANKS,
  type MongolianBankId,
} from "../payments/mongolian-banks";

describe("MONGOLIAN_BANK_IDS", () => {
  it("lists the canonical set of bank ids", () => {
    expect(MONGOLIAN_BANK_IDS).toEqual([
      "khanbank",
      "tdb",
      "golomt",
      "xacbank",
      "state_bank",
      "capitron",
      "bogd",
      "mbank",
      "arig",
      "ckbank",
      "nib",
      "transbank",
    ]);
  });

  it("contains no duplicate ids", () => {
    expect(new Set(MONGOLIAN_BANK_IDS).size).toBe(MONGOLIAN_BANK_IDS.length);
  });
});

describe("MONGOLIAN_BANKS", () => {
  it("has one entry per canonical id", () => {
    expect(MONGOLIAN_BANKS).toHaveLength(MONGOLIAN_BANK_IDS.length);
    expect(MONGOLIAN_BANKS.map((bank) => bank.id)).toEqual([
      ...MONGOLIAN_BANK_IDS,
    ]);
  });

  it("defines complete display data for every bank", () => {
    for (const bank of MONGOLIAN_BANKS) {
      expect(MONGOLIAN_BANK_IDS).toContain(bank.id);
      expect(bank.nameEn.length).toBeGreaterThan(0);
      expect(bank.nameMn.length).toBeGreaterThan(0);
      expect(bank.logo.length).toBeGreaterThan(0);
      expect(bank.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("keeps brand colors distinct per bank", () => {
    const colors = MONGOLIAN_BANKS.map((bank) => bank.brandColor);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe("getMongolianBank", () => {
  it("returns the bank entry for a known id", () => {
    const khan = getMongolianBank("khanbank");
    expect(khan?.nameEn).toBe("Khan Bank");
    expect(khan?.nameMn).toBe("Хаан банк");
  });

  it("returns undefined for an unknown id", () => {
    expect(getMongolianBank("not-a-bank")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(getMongolianBank("")).toBeUndefined();
  });
});

describe("isMongolianBankId", () => {
  it("returns true for every canonical id", () => {
    for (const id of MONGOLIAN_BANK_IDS) {
      expect(isMongolianBankId(id)).toBe(true);
    }
  });

  it("narrows the type of known ids", () => {
    const id: string = "tdb";
    if (isMongolianBankId(id)) {
      const bank: MongolianBankId = id;
      expect(getMongolianBank(bank)).toBeDefined();
    }
  });

  it("returns false for unknown ids", () => {
    expect(isMongolianBankId("hsbc")).toBe(false);
    expect(isMongolianBankId("")).toBe(false);
  });
});
