import { describe, expect, it, vi } from "vitest";
import {
  AppError,
  apiRateLimiter,
  authRateLimiter,
  ConflictError,
  clamp,
  clearAllRateLimits,
  cn,
  createRateLimiter,
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
  mutationRateLimiter,
  NotFoundError,
  normalizeMongolianPhone,
  normalizeMongolianPlate,
  parseCurrencyInput,
  rateLimit,
  resetRateLimit,
  stableStringify,
  toApiErrorResponse,
  transliterateMongolianPlate,
  UnauthorizedError,
  ValidationError,
} from "./core";

// ── cn ──────────────────────────────────────────────────────────────────────

describe("cn", () => {
  it("joins a single string", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional objects via clsx", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, 0, "b")).toBe("a b");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4", "px-8")).toBe("px-8");
  });

  it("resolves deeply merged objects", () => {
    expect(cn("px-2", "p-4", "px-6")).toBe("p-4 px-6");
  });
});

// ── clamp ───────────────────────────────────────────────────────────────────

describe("clamp", () => {
  it("returns the value when it is within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below min", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("returns max when value is above max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("works with decimal values", () => {
    expect(clamp(3.14, 0, 5)).toBe(3.14);
    expect(clamp(-0.5, 0, 1)).toBe(0);
    expect(clamp(5.1, 0, 5)).toBe(5);
  });

  it("handles edge case where min equals max", () => {
    expect(clamp(100, 5, 5)).toBe(5);
    expect(clamp(-100, 5, 5)).toBe(5);
  });

  it("handles negative ranges", () => {
    expect(clamp(-10, -20, -5)).toBe(-10);
    expect(clamp(-30, -20, -5)).toBe(-20);
    expect(clamp(0, -20, -5)).toBe(-5);
  });
});

// ── parseCurrencyInput ──────────────────────────────────────────────────────

describe("parseCurrencyInput", () => {
  it("returns 0 for empty string", () => {
    expect(parseCurrencyInput("")).toBe(0);
  });

  it("parses a plain number string", () => {
    expect(parseCurrencyInput("12345")).toBe(12345);
  });

  it("parses a number with commas", () => {
    expect(parseCurrencyInput("12,345")).toBe(12345);
    expect(parseCurrencyInput("1,234,567")).toBe(1234567);
  });

  it("strips the ₮ symbol", () => {
    expect(parseCurrencyInput("₮ 5000")).toBe(5000);
  });

  it("strips spaces", () => {
    expect(parseCurrencyInput("  1 000 ")).toBe(1000);
  });

  it("parses K suffix as thousands", () => {
    expect(parseCurrencyInput("5k")).toBe(5000);
    expect(parseCurrencyInput("5 K")).toBe(5000);
    expect(parseCurrencyInput("12.5k")).toBe(12500);
  });

  it("parses M suffix as millions", () => {
    expect(parseCurrencyInput("2m")).toBe(2_000_000);
    expect(parseCurrencyInput("2 M")).toBe(2_000_000);
    expect(parseCurrencyInput("1.5m")).toBe(1_500_000);
  });

  it("returns NaN for invalid input", () => {
    expect(parseCurrencyInput("abc")).toBeNaN();
    expect(parseCurrencyInput("₮ abc")).toBeNaN();
  });

  it("returns NaN for suffix on non-number prefix", () => {
    expect(parseCurrencyInput("abcK")).toBeNaN();
  });
});

// ── formatCurrency / formatMNT ──────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("₮ 0");
  });

  it("formats a whole number", () => {
    expect(formatCurrency(1000)).toBe("₮ 1,000");
  });

  it("formats a number with decimals (up to 2)", () => {
    expect(formatCurrency(1234567.89)).toBe("₮ 1,234,567.89");
  });

  it("formats a negative number", () => {
    expect(formatCurrency(-500)).toBe("₮ -500");
  });

  it("rounds to max 2 decimal places", () => {
    expect(formatCurrency(99.999)).toBe("₮ 100");
  });

  it("formats zero decimals when integer part is present", () => {
    expect(formatCurrency(42)).toBe("₮ 42");
  });
});

describe("formatMNT", () => {
  it("is an alias for formatCurrency", () => {
    expect(formatMNT(12345)).toBe(formatCurrency(12345));
    expect(formatMNT(0)).toBe("₮ 0");
    expect(formatMNT(999.5)).toBe("₮ 999.5");
  });
});

// ── getInitials ─────────────────────────────────────────────────────────────

describe("getInitials", () => {
  it("returns ? for null", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("returns ? for undefined", () => {
    expect(getInitials(undefined)).toBe("?");
  });

  it("returns first character for a single word", () => {
    expect(getInitials("batman")).toBe("B");
  });

  it("returns first and last initials for two words", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("returns first and last initials for three+ words", () => {
    expect(getInitials("john michael doe")).toBe("JM");
    expect(getInitials("j r r tolkien")).toBe("JR");
  });

  it("uppercases initials", () => {
    expect(getInitials("john doe")).toBe("JD");
    expect(getInitials("JOHN DOE")).toBe("JD");
  });

  it("returns ? for empty string", () => {
    expect(getInitials("")).toBe("?");
  });

  it("handles leading/trailing whitespace", () => {
    expect(getInitials("  alice   bob  ")).toBe("AB");
  });
});

// ── generateUUID ────────────────────────────────────────────────────────────

describe("generateUUID", () => {
  it("returns a string of correct length (36 chars)", () => {
    const uuid = generateUUID();
    expect(uuid).toHaveLength(36);
  });

  it("matches UUID v4 format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)", () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("uses crypto.randomUUID when available", () => {
    const fakeUUID = "00000000-0000-4000-8000-000000000000";
    const randomUUID = vi.fn().mockReturnValue(fakeUUID);
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "crypto",
    );
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID },
      configurable: true,
      writable: true,
    });

    try {
      const result = generateUUID();
      expect(randomUUID).toHaveBeenCalledOnce();
      expect(result).toBe(fakeUUID);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "crypto", originalDescriptor);
      } else {
        // Named variable for the dynamic globalThis delete
        const gt = globalThis as unknown as Record<string, unknown>;
        delete gt.crypto;
      }
    }
  });

  it("falls back to Math.random when crypto.randomUUID is unavailable", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "crypto",
    );
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      const uuid = generateUUID();
      expect(uuid).toHaveLength(36);
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "crypto", originalDescriptor);
      } else {
        // Named variable for the dynamic globalThis delete
        const gt = globalThis as unknown as Record<string, unknown>;
        delete gt.crypto;
      }
    }
  });

  it("generates unique values on successive calls", () => {
    const a = generateUUID();
    const b = generateUUID();
    expect(a).not.toBe(b);
  });
});

// ── stableStringify ─────────────────────────────────────────────────────────

describe("stableStringify", () => {
  it("stringifies a primitive", () => {
    expect(stableStringify("hello")).toBe('"hello"');
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify(true)).toBe("true");
  });

  it("stringifies null and undefined", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(undefined)).toBe(undefined);
  });

  it("sorts object keys alphabetically", () => {
    const result = stableStringify({ b: 2, a: 1, c: 3 });
    expect(result).toBe('{"a":1,"b":2,"c":3}');
  });

  it("sorts nested object keys", () => {
    const input = { z: { b: "second", a: "first" }, y: "outer" };
    const result = stableStringify(input);
    expect(result).toBe('{"y":"outer","z":{"a":"first","b":"second"}}');
  });

  it("preserves array element order", () => {
    const result = stableStringify(["c", "a", "b"]);
    expect(result).toBe('["c","a","b"]');
  });

  it("handles arrays of objects with sorted keys", () => {
    const input = [
      { b: 2, a: 1 },
      { d: 4, c: 3 },
    ];
    const result = stableStringify(input);
    expect(result).toBe('[{"a":1,"b":2},{"c":3,"d":4}]');
  });

  it("produces deterministic output for the same input", () => {
    const input = { name: "test", count: 5, nested: { x: 1, y: 2 } };
    const a = stableStringify(input);
    const b = stableStringify(input);
    expect(a).toBe(b);
  });

  it("round-trips via JSON.parse", () => {
    const input = { b: 2, a: 1, nested: { y: "second", x: "first" } };
    const str = stableStringify(input);
    const parsed = JSON.parse(str);
    expect(parsed).toEqual(input);
  });
});

// ── formatPlateNumber ───────────────────────────────────────────────────────

describe("formatPlateNumber", () => {
  it("returns empty string for null", () => {
    expect(formatPlateNumber(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatPlateNumber(undefined)).toBe("");
  });

  it("formats a standard Mongolian plate with space", () => {
    expect(formatPlateNumber("1234УБН")).toBe("1234 УБН");
  });

  it("formats a plate with Latin letters (transliterates)", () => {
    // У = U, Б = B, Н = N — Latin input should be transliterated and spaced
    expect(formatPlateNumber("1234UBN")).toBe("1234 УБН");
  });

  it("formats a plate with mixed separators", () => {
    expect(formatPlateNumber("1234-УБН")).toBe("1234 УБН");
    expect(formatPlateNumber("1234 УБН")).toBe("1234 УБН");
  });

  it("returns normalized string when plate does not match expected format", () => {
    // Latin letters are transliterated to Cyrillic (A→А, B→Б, C→Ц)
    expect(formatPlateNumber("ABC")).toBe("АБЦ");
    expect(formatPlateNumber("12")).toBe("12");
  });
});

// ── Error Classes ────────────────────────────────────────────────────────────

describe("AppError", () => {
  it("creates error with defaults", () => {
    const err = new AppError("Something went wrong");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Something went wrong");
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.statusCode).toBe(500);
    expect(err.details).toBeUndefined();
    expect(err.name).toBe("AppError");
  });

  it("creates error with explicit params", () => {
    const err = new AppError("Not found", "NOT_FOUND", 404, { id: 42 });
    expect(err.message).toBe("Not found");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.details).toEqual({ id: 42 });
  });
});

describe("NotFoundError", () => {
  it("creates with correct status and code", () => {
    const err = new NotFoundError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Resource not found");
  });

  it("accepts custom message", () => {
    const err = new NotFoundError("Customer not found", { customerId: 1 });
    expect(err.message).toBe("Customer not found");
    expect(err.details).toEqual({ customerId: 1 });
  });
});

describe("UnauthorizedError", () => {
  it("creates with 401 status", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });
});

describe("ForbiddenError", () => {
  it("creates with 403 status", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});

describe("ValidationError", () => {
  it("creates with 400 status", () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });
});

describe("ConflictError", () => {
  it("creates with 409 status", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});

describe("toApiErrorResponse", () => {
  it("formats AppError correctly", () => {
    const err = new NotFoundError("User not found");
    const res = toApiErrorResponse(err);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toBe("User not found");
  });

  it("adds X-Auth-Required header for UnauthorizedError", () => {
    const err = new UnauthorizedError();
    const res = toApiErrorResponse(err);
    expect(res.headers).toEqual({ "X-Auth-Required": "true" });
  });

  it("handles unknown errors", () => {
    const res = toApiErrorResponse("something broke");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(res.body.error.message).toBe("An unexpected error occurred");
  });

  it("includes error message in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const res = toApiErrorResponse(new Error("dev details"));
    expect(res.body.error.message).toBe("dev details");
    process.env.NODE_ENV = originalEnv;
  });
});

// ── flattenFieldErrors ──────────────────────────────────────────────────────

describe("flattenFieldErrors", () => {
  it("returns empty for empty array", () => {
    expect(flattenFieldErrors([])).toEqual({});
  });

  it("flattens single issue", () => {
    const issues = [{ path: ["name"], message: "Name is required" }];
    expect(flattenFieldErrors(issues)).toEqual({ name: "Name is required" });
  });

  it("keeps first error per key", () => {
    const issues = [
      { path: ["email"], message: "Email is required" },
      { path: ["email"], message: "Invalid format" },
    ];
    expect(flattenFieldErrors(issues)).toEqual({ email: "Email is required" });
  });

  it("handles multiple keys", () => {
    const issues = [
      { path: ["name"], message: "Required" },
      { path: ["email"], message: "Required" },
    ];
    expect(flattenFieldErrors(issues)).toEqual({
      name: "Required",
      email: "Required",
    });
  });

  it("skips issues with empty path", () => {
    const issues = [{ path: [], message: "General error" }];
    expect(flattenFieldErrors(issues)).toEqual({});
  });
});

// ── Phone Functions ─────────────────────────────────────────────────────────

describe("normalizeMongolianPhone", () => {
  it("keeps already normalized +976 number", () => {
    expect(normalizeMongolianPhone("+97699111234")).toBe("+97699111234");
  });

  it("adds + to 976 prefix", () => {
    expect(normalizeMongolianPhone("97699111234")).toBe("+97699111234");
  });

  it("keeps +976 with dashes stripped", () => {
    expect(normalizeMongolianPhone("+976-99-11-12-34")).toBe("+97699111234");
  });

  it("adds +976 for 0-prefixed 8-digit", () => {
    expect(normalizeMongolianPhone("09911123")).toBe("+97609911123");
  });

  it("adds +976 for plain 8-digit", () => {
    expect(normalizeMongolianPhone("99111234")).toBe("+97699111234");
  });

  it("strips spaces and dashes", () => {
    expect(normalizeMongolianPhone("+976 99 111 234")).toBe("+97699111234");
  });
});

describe("isValidMongolianPhone", () => {
  it("returns true for valid +976 format", () => {
    expect(isValidMongolianPhone("+97699111234")).toBe(true);
  });

  it("returns true for plain 8-digit (normalizes internally)", () => {
    expect(isValidMongolianPhone("99111234")).toBe(true);
  });

  it("returns false for too-short number", () => {
    expect(isValidMongolianPhone("+976123")).toBe(false);
  });

  it("returns false for invalid country code", () => {
    expect(isValidMongolianPhone("+976991112345")).toBe(false);
  });
});

// ── Vehicle Validation ──────────────────────────────────────────────────────

describe("isValidVehicleYear", () => {
  it("accepts valid years", () => {
    expect(isValidVehicleYear("2024")).toBe(true);
    expect(isValidVehicleYear("2000")).toBe(true);
    expect(isValidVehicleYear("1950")).toBe(true);
  });

  it("rejects year before 1950", () => {
    expect(isValidVehicleYear("1949")).toBe(false);
  });

  it("rejects non-integer", () => {
    expect(isValidVehicleYear("2024.5")).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidVehicleYear("abc")).toBe(false);
  });
});

describe("isValidVin", () => {
  it("accepts valid 17-char VIN", () => {
    expect(isValidVin("1HGCM82633A004352")).toBe(true);
  });

  it("rejects VIN with I, O, or Q", () => {
    expect(isValidVin("1HGCM82633A0O4352")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidVin("123")).toBe(false);
  });

  it("returns true for empty string (optional field)", () => {
    expect(isValidVin("")).toBe(true);
  });
});

// ── Number Validation ───────────────────────────────────────────────────────

describe("isValidPositiveNumber", () => {
  it("accepts positive numbers", () => {
    expect(isValidPositiveNumber("5")).toBe(true);
    expect(isValidPositiveNumber("0.01")).toBe(true);
  });

  it("rejects zero", () => {
    expect(isValidPositiveNumber("0")).toBe(false);
  });

  it("rejects negative numbers", () => {
    expect(isValidPositiveNumber("-1")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidPositiveNumber("")).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidPositiveNumber("abc")).toBe(false);
  });
});

describe("isValidNonNegativeNumber", () => {
  it("accepts positive numbers", () => {
    expect(isValidNonNegativeNumber("5")).toBe(true);
  });

  it("accepts zero", () => {
    expect(isValidNonNegativeNumber("0")).toBe(true);
  });

  it("rejects negative", () => {
    expect(isValidNonNegativeNumber("-1")).toBe(false);
  });

  it("accepts empty (optional field)", () => {
    expect(isValidNonNegativeNumber("")).toBe(true);
  });
});

// ── Plate Functions ─────────────────────────────────────────────────────────

describe("transliterateMongolianPlate", () => {
  it("converts Latin to Cyrillic", () => {
    expect(transliterateMongolianPlate("UBN")).toBe("УБН");
  });

  it("preserves already Cyrillic characters", () => {
    expect(transliterateMongolianPlate("УБН")).toBe("УБН");
  });

  it("uppercases lowercase input", () => {
    expect(transliterateMongolianPlate("ubn")).toBe("УБН");
  });

  it("handles mixed Latin and Cyrillic", () => {
    expect(transliterateMongolianPlate("1234УBН")).toBe("1234УБН");
  });
});

describe("normalizeMongolianPlate", () => {
  it("removes spaces", () => {
    expect(normalizeMongolianPlate("1234 УБН")).toBe("1234УБН");
  });

  it("removes dashes", () => {
    expect(normalizeMongolianPlate("1234-УБН")).toBe("1234УБН");
  });

  it("transliterates Latin letters", () => {
    expect(normalizeMongolianPlate("1234 UBN")).toBe("1234УБН");
  });
});

describe("isValidMongolianPlate", () => {
  it("accepts valid 4-digit 3-cyrillic plate", () => {
    expect(isValidMongolianPlate("1234УБН")).toBe(true);
  });

  it("accepts plate with Latin letters (normalizes internally)", () => {
    expect(isValidMongolianPlate("1234UBN")).toBe(true);
  });

  it("accepts plate with spaces (normalizes internally)", () => {
    expect(isValidMongolianPlate("1234 УБН")).toBe(true);
  });

  it("rejects wrong character count", () => {
    expect(isValidMongolianPlate("123")).toBe(false);
  });
});

// ── Rate Limiters ───────────────────────────────────────────────────────────

describe("createRateLimiter", () => {
  it("allows requests within limit", async () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    const r1 = await limiter.check("key1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    await limiter.check("key1");
    const r3 = await limiter.check("key1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks when limit exceeded", async () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 5000 });
    await limiter.check("key2");
    await limiter.check("key2");
    const r3 = await limiter.check("key2");
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("has separate windows per key", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 5000 });
    const r1 = await limiter.check("a");
    expect(r1.allowed).toBe(true);
    const r2 = await limiter.check("b");
    expect(r2.allowed).toBe(true);
  });
});

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    resetRateLimit("rl-key");
    const r1 = rateLimit("rl-key", 3);
    expect(r1.error).toBeUndefined();
  });

  it("blocks when limit exceeded", () => {
    resetRateLimit("rl-key2");
    rateLimit("rl-key2", 1);
    const r2 = rateLimit("rl-key2", 1);
    expect(r2.error).toBeDefined();
  });
});

describe("resetRateLimit", () => {
  it("resets a specific key", () => {
    resetRateLimit("reset-key");
    rateLimit("reset-key", 1); // consumes
    rateLimit("reset-key", 1); // blocked
    resetRateLimit("reset-key");
    const r = rateLimit("reset-key", 1);
    expect(r.error).toBeUndefined();
  });
});

describe("clearAllRateLimits", () => {
  it("clears all rate limit state", () => {
    clearAllRateLimits();
    rateLimit("clr-a", 1);
    rateLimit("clr-b", 1);
    clearAllRateLimits();
    expect(rateLimit("clr-a", 1).error).toBeUndefined();
    expect(rateLimit("clr-b", 1).error).toBeUndefined();
  });
});

describe("Built-in rate limiters", () => {
  it("apiRateLimiter has correct config", () => {
    expect(apiRateLimiter.check).toBeDefined();
  });

  it("authRateLimiter has correct config", () => {
    expect(authRateLimiter.check).toBeDefined();
  });

  it("mutationRateLimiter has correct config", () => {
    expect(mutationRateLimiter.check).toBeDefined();
  });
});
