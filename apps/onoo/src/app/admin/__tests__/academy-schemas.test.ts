import { describe, expect, it } from "vitest";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1),
  logo_url: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  timezone: z.string().optional(),
  settings: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
});

describe("academyProfileSchema", () => {
  it("accepts minimal valid data", () => {
    expect(profileSchema.safeParse({ name: "Test Academy" }).success).toBe(
      true,
    );
  });
  it("rejects empty name", () => {
    const r = profileSchema.safeParse({ name: "" });
    expect(r.success).toBe(false);
  });
  it("accepts all optional fields", () => {
    const r = profileSchema.safeParse({
      name: "Acad",
      logo_url: "https://example.com/logo.png",
      contact_phone: "99112233",
      contact_email: "info@acad.mn",
      timezone: "Asia/Ulaanbaatar",
      settings: '{"key": "value"}',
    });
    expect(r.success).toBe(true);
  });
});

describe("paymentSchema", () => {
  it("accepts positive amount", () => {
    expect(paymentSchema.safeParse({ amount: "50000" }).success).toBe(true);
  });
  it("rejects zero amount", () => {
    expect(paymentSchema.safeParse({ amount: "0" }).success).toBe(false);
  });
  it("rejects negative amount", () => {
    expect(paymentSchema.safeParse({ amount: "-100" }).success).toBe(false);
  });
  it("accepts amount with optional description", () => {
    const r = paymentSchema.safeParse({
      amount: "30000",
      description: "Сургалтын төлбөр",
    });
    expect(r.success).toBe(true);
  });
});
