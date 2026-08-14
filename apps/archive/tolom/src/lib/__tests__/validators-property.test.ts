import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  clamp,
  cn,
  ForbiddenError,
  flattenFieldErrors,
  formatCurrency,
  formatMNT,
  formatPlateNumber,
  generateUUID,
  getInitials,
  isValidMongolianPhone,
  isValidMongolianPlate,
  isValidNonNegativeNumber,
  isValidPositiveNumber,
  isValidVehicleYear,
  isValidVin,
  NotFoundError,
  normalizeMongolianPhone,
  parseCurrencyInput,
  stableStringify,
  toApiErrorResponse,
  UnauthorizedError,
} from "@/lib/zuiio/core";

/**
 * Property-based tests for the @zuiio/core validation/formatting layer.
 *
 * These assert invariants over generated inputs instead of hand-picked
 * examples, so a subtle regression in a validator's regex or normalization
 * (e.g. a character class drift) fails here even when example tests pass.
 */

const DIGITS = "0123456789";
const MN_PLATE_CYRILLIC = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯӨҮҢ";
const VIN_CHARS = "0123456789ABCDEFGHJKLMNPRSTUVWXYZ";
const SEPARATORS = [" ", "-", "–", "_", ".", "/", "\\"];

/** fast-check v4 has no stringOf — build a char-pool string generator. */
const pool = (chars: string, minLength: number, maxLength: number) =>
  fc
    .array(fc.constantFrom(...chars), { minLength, maxLength })
    .map((chars_) => chars_.join(""));

const digit8 = pool(DIGITS, 8, 8);

const validPlate = fc
  .record({
    digits: pool(DIGITS, 4, 4),
    letters: pool(MN_PLATE_CYRILLIC, 3, 3),
  })
  .map(({ digits, letters }) => `${digits}${letters}`);

const validVin = pool(VIN_CHARS, 17, 17);

describe("isValidMongolianPhone", () => {
  it("accepts +976, bare 8-digit, and 0-prefixed local numbers", () => {
    fc.assert(
      fc.property(digit8, pool(DIGITS, 7, 7), (d, d7) => {
        expect(isValidMongolianPhone(`+976${d}`)).toBe(true);
        expect(isValidMongolianPhone(d)).toBe(true);
        // 0-prefix local form is 8 chars total: 0 + 7 digits.
        expect(isValidMongolianPhone(`0${d7}`)).toBe(true);
        expect(isValidMongolianPhone(`976${d}`)).toBe(true);
      }),
    );
  });

  it("rejects wrong country prefixes and wrong lengths", () => {
    fc.assert(
      fc.property(digit8, (d) => {
        expect(isValidMongolianPhone(`+996${d}`)).toBe(false);
        expect(isValidMongolianPhone(`+976${d}0`)).toBe(false);
      }),
    );
  });

  it("normalizes formatted inputs to the canonical +976 form", () => {
    fc.assert(
      fc.property(digit8, (d) => {
        expect(
          normalizeMongolianPhone(`+976 ${d.slice(0, 4)}-${d.slice(4)}`),
        ).toBe(`+976${d}`);
      }),
    );
  });
});

describe("isValidMongolianPlate", () => {
  it("accepts 4 digits followed by 3 Mongolian letters", () => {
    fc.assert(
      fc.property(validPlate, (plate) => {
        expect(isValidMongolianPlate(plate)).toBe(true);
      }),
    );
  });

  it("still accepts plates with separators between digits and letters", () => {
    fc.assert(
      fc.property(validPlate, fc.constantFrom(...SEPARATORS), (plate, sep) => {
        const [digits, letters] = [plate.slice(0, 4), plate.slice(4)];
        expect(isValidMongolianPlate(`${digits}${sep}${letters}`)).toBe(true);
      }),
    );
  });

  it("accepts latin letters via transliteration", () => {
    const latinPlate = fc
      .tuple(pool(DIGITS, 4, 4), pool("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 3, 3))
      .map(([digits, letters]) => `${digits}${letters}`);

    fc.assert(
      fc.property(latinPlate, (plate) => {
        expect(isValidMongolianPlate(plate)).toBe(true);
      }),
    );
  });

  it("rejects wrong digit/letter counts and out-of-set letters", () => {
    fc.assert(
      fc.property(validPlate, (plate) => {
        const [digits, letters] = [plate.slice(0, 4), plate.slice(4)];
        expect(isValidMongolianPlate(`${digits}${letters.slice(0, 2)}`)).toBe(
          false,
        );
        expect(isValidMongolianPlate(`${digits.slice(0, 3)}${letters}`)).toBe(
          false,
        );
        // Ё (U+0401) sits outside the [А-Я] range used by the validator.
        expect(isValidMongolianPlate(`${digits}ЁЁЁ`)).toBe(false);
      }),
    );
  });
});

describe("isValidVin", () => {
  it("accepts any 17-char VIN alphabet string (no I, O, Q)", () => {
    fc.assert(
      fc.property(validVin, (vin) => {
        expect(isValidVin(vin)).toBe(true);
        expect(isValidVin(vin.toLowerCase())).toBe(true);
      }),
    );
  });

  it("rejects strings containing I, O, or Q and wrong lengths", () => {
    fc.assert(
      fc.property(validVin, (vin) => {
        expect(isValidVin(`I${vin.slice(1)}`)).toBe(false);
        expect(isValidVin(`O${vin.slice(1)}`)).toBe(false);
        expect(isValidVin(`Q${vin.slice(1)}`)).toBe(false);
        expect(isValidVin(vin.slice(0, 16))).toBe(false);
        expect(isValidVin(`${vin}0`)).toBe(false);
      }),
    );
  });

  it("treats empty input as valid (per the documented contract)", () => {
    expect(isValidVin("")).toBe(true);
  });
});

describe("isValidVehicleYear", () => {
  it("accepts every integer in the supported window", () => {
    const currentYear = new Date().getFullYear();
    fc.assert(
      fc.property(fc.integer({ min: 1950, max: currentYear + 1 }), (year) => {
        expect(isValidVehicleYear(String(year))).toBe(true);
      }),
    );
  });

  it("rejects years outside the window and non-integers", () => {
    const currentYear = new Date().getFullYear();
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 1900, max: 1949 }),
          fc.integer({ min: currentYear + 2, max: currentYear + 50 }),
        ),
        (year) => {
          expect(isValidVehicleYear(String(year))).toBe(false);
        },
      ),
    );
    expect(isValidVehicleYear("2024.5")).toBe(false);
    expect(isValidVehicleYear("abc")).toBe(false);
  });
});

describe("formatCurrency / parseCurrencyInput", () => {
  it("round-trips any integer amount", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
        (amount) => {
          expect(parseCurrencyInput(formatCurrency(amount))).toBe(amount);
        },
      ),
    );
  });

  it("supports k and m suffixes", () => {
    expect(parseCurrencyInput("5k")).toBe(5_000);
    expect(parseCurrencyInput("2.5m")).toBe(2_500_000);
    expect(parseCurrencyInput("")).toBe(0);
  });
});

describe("clamp", () => {
  it("always returns a value within [min, max] and honors the boundary rules", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.integer(), fc.integer(), fc.integer()),
        ([a, b, value]) => {
          const min = Math.min(a, b);
          const max = Math.max(a, b);
          const result = clamp(value, min, max);

          expect(result).toBeGreaterThanOrEqual(min);
          expect(result).toBeLessThanOrEqual(max);
          if (value < min) expect(result).toBe(min);
          if (value > max) expect(result).toBe(max);
          if (value >= min && value <= max) expect(result).toBe(value);
        },
      ),
    );
  });
});

describe("stableStringify", () => {
  it("produces the same output regardless of object key order", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          count: fc.integer(),
          nested: fc.record({ b: fc.boolean(), a: fc.integer() }),
          list: fc.array(fc.string()),
        }),
        (obj) => {
          const shuffled = {
            nested: { a: obj.nested.a, b: obj.nested.b },
            list: obj.list,
            id: obj.id,
            count: obj.count,
          };
          expect(stableStringify(shuffled)).toBe(stableStringify(obj));
        },
      ),
    );
  });
});

describe("core formatting helpers", () => {
  it("cn merges class names in order and handles falsy inputs", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    expect(cn("a", undefined, "b", null, "", false)).toBe("a b");
    expect(cn()).toBe("");
  });

  it("formatMNT delegates to formatCurrency", () => {
    expect(formatMNT(1234)).toBe("₮ 1,234");
  });

  it("getInitials handles empty, single, and multi-name inputs", () => {
    expect(getInitials(null)).toBe("?");
    expect(getInitials(undefined)).toBe("?");
    expect(getInitials("")).toBe("?");
    expect(getInitials("  Бат  ")).toBe("Б");
    expect(getInitials("Бат Дорж")).toBe("БД");
    expect(getInitials("john smith")).toBe("JS");
  });

  it("formatPlateNumber formats valid plates and passes through invalid ones", () => {
    expect(formatPlateNumber(null)).toBe("");
    expect(formatPlateNumber("1234АБВ")).toBe("1234 АБВ");
    expect(formatPlateNumber("1234-АБВ")).toBe("1234 АБВ");
    // Latin letters transliterate before matching — "ZZZ" becomes "ЗЗЗ".
    expect(formatPlateNumber("1234ZZZ")).toBe("1234 ЗЗЗ");
    expect(formatPlateNumber("12345")).toBe("12345");
    expect(formatPlateNumber("XYZ")).toBe("ХЫЗ");
  });

  it("generateUUID returns a v4-shaped id", () => {
    expect(generateUUID()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(generateUUID()).not.toBe(generateUUID());
  });
});

describe("core error contract", () => {
  it("maps AppError subclasses to structured responses", () => {
    expect(toApiErrorResponse(new NotFoundError("nope"))).toEqual({
      status: 404,
      body: { error: { code: "NOT_FOUND", message: "nope" } },
    });
    expect(toApiErrorResponse(new UnauthorizedError())).toEqual({
      status: 401,
      body: { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      headers: { "X-Auth-Required": "true" },
    });
    expect(toApiErrorResponse(new ForbiddenError("no"))).toMatchObject({
      status: 403,
      body: { error: { code: "FORBIDDEN", message: "no" } },
    });
  });

  it("maps unknown errors to 500 INTERNAL_ERROR with a generic message", () => {
    expect(toApiErrorResponse(new Error("boom"))).toEqual({
      status: 500,
      body: {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
    });
  });
});

describe("flattenFieldErrors", () => {
  it("keeps the first error per field and skips empty paths", () => {
    expect(
      flattenFieldErrors([
        { path: ["name"], message: "required" },
        { path: ["name"], message: "too long" },
        { path: [], message: "form-level" },
        { path: ["age"], message: "must be a number" },
      ]),
    ).toEqual({ name: "required", age: "must be a number" });
    expect(flattenFieldErrors([])).toEqual({});
  });
});

describe("numeric validators", () => {
  it("isValidPositiveNumber accepts positives only", () => {
    expect(isValidPositiveNumber("5")).toBe(true);
    expect(isValidPositiveNumber("0.5")).toBe(true);
    expect(isValidPositiveNumber("0")).toBe(false);
    expect(isValidPositiveNumber("-1")).toBe(false);
    expect(isValidPositiveNumber("")).toBe(false);
    expect(isValidPositiveNumber("abc")).toBe(false);
  });

  it("isValidNonNegativeNumber accepts zero but not negatives", () => {
    expect(isValidNonNegativeNumber("5")).toBe(true);
    expect(isValidNonNegativeNumber("0")).toBe(true);
    expect(isValidNonNegativeNumber("")).toBe(true);
    expect(isValidNonNegativeNumber("-1")).toBe(false);
    expect(isValidNonNegativeNumber("abc")).toBe(false);
  });
});
