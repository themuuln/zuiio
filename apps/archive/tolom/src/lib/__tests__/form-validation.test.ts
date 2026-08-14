import { describe, expect, it } from "vitest";

import {
  flattenFieldErrors,
  isValidMongolianPhone,
  isValidMongolianPlate,
  isValidNonNegativeNumber,
  isValidPositiveNumber,
  isValidVehicleYear,
  isValidVin,
  normalizeMongolianPhone,
  normalizeMongolianPlate,
  transliterateMongolianPlate,
} from "../form-validation";

// ── flattenFieldErrors ─────────────────────────────────────────

describe("flattenFieldErrors", () => {
  it("flattens issues by first path element only", () => {
    const issues = [
      { path: ["name"], message: "Name is required" },
      { path: ["email"], message: "Invalid email" },
    ] as const;

    expect(flattenFieldErrors(issues)).toEqual({
      name: "Name is required",
      email: "Invalid email",
    });
  });

  it("uses only the top-level field from nested paths", () => {
    const issues = [
      { path: ["address", "city"], message: "City is required" },
      { path: ["address", "zip"], message: "Invalid zip" },
    ] as const;

    expect(flattenFieldErrors(issues)).toEqual({
      address: "City is required",
    });
  });

  it("uses first error per field", () => {
    const issues = [
      { path: ["email"], message: "Required" },
      { path: ["email"], message: "Invalid format" },
    ] as const;

    expect(flattenFieldErrors(issues)).toEqual({
      email: "Required",
    });
  });

  it("returns empty object for empty issues", () => {
    expect(flattenFieldErrors([])).toEqual({});
  });
});

// ── normalizeMongolianPhone ────────────────────────────────────

describe("normalizeMongolianPhone", () => {
  it("keeps already normalized +976 phone", () => {
    expect(normalizeMongolianPhone("+97688112233")).toBe("+97688112233");
  });

  it("adds + to 976-prefixed number at 11-digit length", () => {
    // 976 + 8 digits = 11 total — standard Mongolian phone format
    expect(normalizeMongolianPhone("97688112233")).toBe("+97688112233");
  });

  it("adds +976 to bare 8-digit number", () => {
    expect(normalizeMongolianPhone("88112233")).toBe("+97688112233");
  });

  it("adds +976 to 0-prefixed 8-char string (0 + 7 digits)", () => {
    expect(normalizeMongolianPhone("08811223")).toBe("+97608811223");
  });

  it("strips whitespace, dashes, parens", () => {
    expect(normalizeMongolianPhone("+976 88 11 22 33")).toBe("+97688112233");
    expect(normalizeMongolianPhone("+976-88-11-22-33")).toBe("+97688112233");
    expect(normalizeMongolianPhone("(+976)88112233")).toBe("+97688112233");
  });

  it("returns unrecognised phone as-is", () => {
    expect(normalizeMongolianPhone("123")).toBe("123");
  });

  it("does not add + for 12-digit 976-prefixed number (non-standard)", () => {
    // 976 + 9 digits = 12 total — not a valid Mongolian phone format
    expect(normalizeMongolianPhone("976881122334")).toBe("976881122334");
  });
});

// ── isValidMongolianPhone ──────────────────────────────────────

describe("isValidMongolianPhone", () => {
  it("accepts valid +976 phone", () => {
    expect(isValidMongolianPhone("+97688112233")).toBe(true);
  });

  it("accepts bare 8-digit number", () => {
    expect(isValidMongolianPhone("88112233")).toBe(true);
  });

  it("rejects short phone", () => {
    expect(isValidMongolianPhone("+976123")).toBe(false);
  });

  it("rejects non-Mongolian prefix", () => {
    expect(isValidMongolianPhone("+15551234567")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidMongolianPhone("")).toBe(false);
  });
});

// ── isValidMongolianPlate ──────────────────────────────────────

describe("isValidMongolianPlate", () => {
  it("accepts valid plate with Cyrillic letters", () => {
    expect(isValidMongolianPlate("1234УБА")).toBe(true);
  });

  it("accepts valid plate with Latin letters (transliterated)", () => {
    expect(isValidMongolianPlate("1234UBA")).toBe(true);
  });

  it("accepts plate with dashes stripped", () => {
    expect(isValidMongolianPlate("1234-УБА")).toBe(true);
  });

  it("rejects plate with wrong format", () => {
    expect(isValidMongolianPlate("AB1234")).toBe(false);
  });

  it("rejects empty plate", () => {
    expect(isValidMongolianPlate("")).toBe(false);
  });

  it("rejects plate with too few letters", () => {
    expect(isValidMongolianPlate("1234УБ")).toBe(false);
  });
});

// ── normalizeMongolianPlate ────────────────────────────────────

describe("normalizeMongolianPlate", () => {
  it("strips spaces and dashes", () => {
    expect(normalizeMongolianPlate("1234-УБА")).toBe("1234УБА");
    expect(normalizeMongolianPlate("1234 УБА")).toBe("1234УБА");
  });

  it("transliterates Latin to Cyrillic", () => {
    expect(normalizeMongolianPlate("1234UBA")).toBe("1234УБА");
  });

  it("handles mixed separators", () => {
    expect(normalizeMongolianPlate("12_34/УБА")).toBe("1234УБА");
  });
});

// ── transliterateMongolianPlate ────────────────────────────────

describe("transliterateMongolianPlate", () => {
  it("maps each Latin letter to Cyrillic equivalent", () => {
    expect(transliterateMongolianPlate("UBA")).toBe("УБА");
  });

  it("maps all Latin letters per specification", () => {
    // W→Ү not Ш, U→У not Ү — from the actual LATIN_TO_CYRILLIC mapping
    expect(transliterateMongolianPlate("ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe(
      "АБЦДЭФГХИЖКЛМНОПӨРСТУВҮХЫЗ",
    );
  });

  it("leaves Cyrillic letters unchanged", () => {
    expect(transliterateMongolianPlate("УБА")).toBe("УБА");
  });

  it("uppercases input before transliterating", () => {
    expect(transliterateMongolianPlate("uba")).toBe("УБА");
  });

  it("keeps digits unchanged", () => {
    expect(transliterateMongolianPlate("1234")).toBe("1234");
  });
});

// ── isValidVehicleYear ─────────────────────────────────────────

describe("isValidVehicleYear", () => {
  it("accepts current year", () => {
    const currentYear = new Date().getFullYear();
    expect(isValidVehicleYear(String(currentYear))).toBe(true);
  });

  it("accepts next year (1 year ahead)", () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(isValidVehicleYear(String(nextYear))).toBe(true);
  });

  it("accepts 1950", () => {
    expect(isValidVehicleYear("1950")).toBe(true);
  });

  it("rejects year before 1950", () => {
    expect(isValidVehicleYear("1949")).toBe(false);
  });

  it("rejects year too far in the future", () => {
    const farFuture = new Date().getFullYear() + 2;
    expect(isValidVehicleYear(String(farFuture))).toBe(false);
  });

  it("rejects non-integer strings", () => {
    expect(isValidVehicleYear("abc")).toBe(false);
    expect(isValidVehicleYear("20.5")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidVehicleYear("")).toBe(false);
  });
});

// ── isValidVin ─────────────────────────────────────────────────

describe("isValidVin", () => {
  it("accepts valid 17-char VIN", () => {
    expect(isValidVin("WBAAB5401M1234567")).toBe(true);
  });

  it("accepts valid VIN with lowercase letters", () => {
    expect(isValidVin("wbaab5401m1234567")).toBe(true);
  });

  it("returns true for empty VIN (optional field)", () => {
    expect(isValidVin("")).toBe(true);
  });

  it("rejects VIN with I, O, or Q", () => {
    expect(isValidVin("I1234567890123456")).toBe(false);
    expect(isValidVin("O1234567890123456")).toBe(false);
    expect(isValidVin("Q1234567890123456")).toBe(false);
  });

  it("rejects VIN of wrong length", () => {
    expect(isValidVin("1234567890123456")).toBe(false); // 16 chars
    expect(isValidVin("123456789012345678")).toBe(false); // 18 chars
  });

  it("accepts VIN with digits only", () => {
    expect(isValidVin("12345678901234567")).toBe(true);
  });
});

// ── isValidPositiveNumber ──────────────────────────────────────

describe("isValidPositiveNumber", () => {
  it("accepts positive integer string", () => {
    expect(isValidPositiveNumber("42")).toBe(true);
  });

  it("accepts positive decimal string", () => {
    expect(isValidPositiveNumber("3.14")).toBe(true);
  });

  it("rejects zero", () => {
    expect(isValidPositiveNumber("0")).toBe(false);
  });

  it("rejects negative number", () => {
    expect(isValidPositiveNumber("-1")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidPositiveNumber("")).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(isValidPositiveNumber("   ")).toBe(false);
  });

  it("rejects non-numeric string", () => {
    expect(isValidPositiveNumber("abc")).toBe(false);
  });
});

// ── isValidNonNegativeNumber ───────────────────────────────────

describe("isValidNonNegativeNumber", () => {
  it("accepts positive integer", () => {
    expect(isValidNonNegativeNumber("42")).toBe(true);
  });

  it("accepts zero", () => {
    expect(isValidNonNegativeNumber("0")).toBe(true);
  });

  it("accepts positive decimal", () => {
    expect(isValidNonNegativeNumber("1.5")).toBe(true);
  });

  it("rejects negative number", () => {
    expect(isValidNonNegativeNumber("-1")).toBe(false);
  });

  it("returns true for empty string (optional field)", () => {
    expect(isValidNonNegativeNumber("")).toBe(true);
  });

  it("returns true for whitespace-only string", () => {
    expect(isValidNonNegativeNumber("   ")).toBe(true);
  });

  it("rejects non-numeric string", () => {
    expect(isValidNonNegativeNumber("abc")).toBe(false);
  });
});
