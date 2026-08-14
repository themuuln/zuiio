import { describe, expect, it } from "vitest";
import {
  amountSchema,
  dateSchema,
  emailSchema,
  percentageSchema,
  phoneSchema,
  plateSchema,
} from "./schemas";

describe("phoneSchema", () => {
  it("accepts valid 8-digit Mongolian phone", () => {
    expect(phoneSchema.safeParse("99112233").success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(phoneSchema.safeParse("").success).toBe(false);
  });

  it("rejects too-short number", () => {
    expect(phoneSchema.safeParse("123").success).toBe(false);
  });
});

describe("amountSchema", () => {
  it("accepts valid amount string", () => {
    expect(amountSchema.safeParse("50000").success).toBe(true);
  });

  it("accepts decimal amount", () => {
    expect(amountSchema.safeParse("99.99").success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(amountSchema.safeParse("").success).toBe(false);
  });

  it("rejects non-numeric string", () => {
    expect(amountSchema.safeParse("abc").success).toBe(false);
  });

  it("rejects zero", () => {
    expect(amountSchema.safeParse("0").success).toBe(false);
  });

  it("rejects negative", () => {
    expect(amountSchema.safeParse("-100").success).toBe(false);
  });
});

describe("plateSchema", () => {
  it("accepts valid Mongolian plate", () => {
    // 4 digits + 3 Cyrillic letters
    expect(plateSchema.safeParse("4444УНА").success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(plateSchema.safeParse("").success).toBe(false);
  });

  it("rejects invalid format", () => {
    expect(plateSchema.safeParse("abc").success).toBe(false);
  });
});

describe("dateSchema", () => {
  it("accepts valid ISO date", () => {
    expect(dateSchema.safeParse("2026-05-29").success).toBe(true);
  });

  it("accepts empty string", () => {
    expect(dateSchema.safeParse("").success).toBe(true);
  });

  it("accepts undefined", () => {
    expect(dateSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejects invalid date string", () => {
    expect(dateSchema.safeParse("not-a-date").success).toBe(false);
  });
});

describe("percentageSchema", () => {
  it("accepts valid percentage", () => {
    expect(percentageSchema.safeParse(50).success).toBe(true);
  });

  it("accepts 0", () => {
    expect(percentageSchema.safeParse(0).success).toBe(true);
  });

  it("accepts 100", () => {
    expect(percentageSchema.safeParse(100).success).toBe(true);
  });

  it("rejects negative", () => {
    expect(percentageSchema.safeParse(-1).success).toBe(false);
  });

  it("rejects over 100", () => {
    expect(percentageSchema.safeParse(101).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts valid email", () => {
    expect(emailSchema.safeParse("test@example.com").success).toBe(true);
  });

  it("accepts empty string", () => {
    expect(emailSchema.safeParse("").success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("rejects string with no @", () => {
    expect(emailSchema.safeParse("test").success).toBe(false);
  });
});
