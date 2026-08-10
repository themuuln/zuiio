import { describe, expect, it } from "vitest";
import { postServiceSchema } from "../_schema";

describe("postServiceSchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = postServiceSchema.parse({ paymentMethod: "cash" });
    expect(result).toEqual({ paymentMethod: "cash" });
  });

  it("accepts all four payment methods", () => {
    for (const method of ["cash", "card", "bank_transfer", "manual"]) {
      expect(
        postServiceSchema.parse({ paymentMethod: method }).paymentMethod,
      ).toBe(method);
    }
  });

  it("accepts optional odometer, mechanicNotes and transferBankId", () => {
    const result = postServiceSchema.parse({
      odometer: "12345",
      mechanicNotes: "Oil change done",
      paymentMethod: "bank_transfer",
      transferBankId: "khanbank",
    });
    expect(result).toEqual({
      odometer: "12345",
      mechanicNotes: "Oil change done",
      paymentMethod: "bank_transfer",
      transferBankId: "khanbank",
    });
  });

  it("accepts empty optional strings", () => {
    expect(
      postServiceSchema.parse({
        odometer: "",
        mechanicNotes: "",
        paymentMethod: "card",
      }),
    ).toEqual({ odometer: "", mechanicNotes: "", paymentMethod: "card" });
  });

  it("rejects an unknown payment method", () => {
    const result = postServiceSchema.safeParse({ paymentMethod: "bitcoin" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["paymentMethod"]);
    }
  });

  it("rejects a missing payment method", () => {
    const result = postServiceSchema.safeParse({ odometer: "100" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-string odometer", () => {
    const result = postServiceSchema.safeParse({
      odometer: 12345,
      paymentMethod: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown keys", () => {
    const result = postServiceSchema.parse({
      paymentMethod: "manual",
      extra: "dropped",
    });
    expect(result).toEqual({ paymentMethod: "manual" });
  });
});
