import { describe, expect, it } from "vitest";
import { expenseCategorySchema, expenseSchema } from "./expense-schema";

describe("expenseSchema", () => {
  it("accepts valid expense", () => {
    expect(
      expenseSchema.safeParse({
        description: "Office supplies",
        amount: "50000",
        paid: true,
      }).success,
    ).toBe(true);
  });

  it("accepts expense with all fields", () => {
    expect(
      expenseSchema.safeParse({
        description: "Rent",
        amount: "1000000",
        paid: false,
        expenseDate: "2026-05-01",
        categoryId: "cat-1",
        vendorName: "Landlord LLC",
        paymentMethod: "bank_transfer",
        notes: "Monthly rent",
      }).success,
    ).toBe(true);
  });

  it("rejects empty description", () => {
    expect(
      expenseSchema.safeParse({ description: "", amount: "50000", paid: true })
        .success,
    ).toBe(false);
  });

  it("rejects missing description", () => {
    expect(
      expenseSchema.safeParse({ amount: "50000", paid: true }).success,
    ).toBe(false);
  });

  it("rejects invalid amount", () => {
    expect(
      expenseSchema.safeParse({
        description: "Test",
        amount: "abc",
        paid: true,
      }).success,
    ).toBe(false);
  });

  it("rejects zero amount", () => {
    expect(
      expenseSchema.safeParse({ description: "Test", amount: "0", paid: true })
        .success,
    ).toBe(false);
  });

  it("rejects invalid payment method", () => {
    expect(
      expenseSchema.safeParse({
        description: "Test",
        amount: "100",
        paid: true,
        paymentMethod: "crypto",
      }).success,
    ).toBe(false);
  });

  it("accepts valid payment methods", () => {
    for (const method of ["cash", "card", "bank_transfer", "manual"]) {
      expect(
        expenseSchema.safeParse({
          description: "Test",
          amount: "100",
          paid: true,
          paymentMethod: method,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects missing paid field", () => {
    expect(
      expenseSchema.safeParse({ description: "Test", amount: "100" }).success,
    ).toBe(false);
  });
});

describe("expenseCategorySchema", () => {
  it("accepts valid category", () => {
    expect(expenseCategorySchema.safeParse({ name: "Office" }).success).toBe(
      true,
    );
  });

  it("accepts category with optional fields", () => {
    expect(
      expenseCategorySchema.safeParse({
        name: "Utilities",
        description: "Electric, water",
        color: "#FF0000",
      }).success,
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(expenseCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects missing name", () => {
    expect(expenseCategorySchema.safeParse({}).success).toBe(false);
  });
});
