/**
 * Tests for src/lib/domain-rules.ts — validation logic
 */
import { describe, expect, it, vi } from "vitest";

// Mock @zuiio/core — hoisted before static import below
vi.mock("@zuiio/core", () => ({
  requireEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  requirePassword: (pw: string) => pw.length >= 8,
}));

import {
  validateCategoryInput,
  validateContactInput,
  validateExpenseInput,
  validateLoginInput,
  validateOrganizationInput,
  validatePasswordResetRequestInput,
  validatePasswordUpdateInput,
  validateProductInput,
  validateRegistrationInput,
  validateSaleInput,
  validateStockMovementInput,
} from "../domain-rules";

describe("validateProductInput", () => {
  it("returns null for valid product", () => {
    expect(
      validateProductInput({
        name: "Бүтээгдэхүүн",
        costPrice: 1000,
        salePrice: 2000,
        currentStock: 10,
        minStock: 5,
      }),
    ).toBeNull();
  });

  it("returns error for empty name", () => {
    const r = validateProductInput({
      name: "",
      costPrice: 0,
      salePrice: 0,
      currentStock: 0,
      minStock: 0,
    });
    expect(r).toContain("нэр");
  });

  it("returns error for negative prices", () => {
    const r = validateProductInput({
      name: "Test",
      costPrice: -100,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    });
    expect(r).toContain("Үнэ");
  });

  it("returns error for NaN values", () => {
    const r = validateProductInput({
      name: "Test",
      costPrice: Infinity,
      salePrice: 2000,
      currentStock: 10,
      minStock: 5,
    });
    expect(r).toContain("Үнэ");
  });
});

describe("validateRegistrationInput", () => {
  it("returns null for valid registration input", () => {
    expect(
      validateRegistrationInput({
        fullName: "Тест Хэрэглэгч",
        email: "test@example.com",
        password: "password123",
      }),
    ).toBeNull();
  });

  it("returns error for short name", () => {
    expect(
      validateRegistrationInput({
        fullName: "A",
        email: "test@example.com",
        password: "password123",
      }),
    ).toContain("Нэр");
  });

  it("returns error for invalid email", () => {
    expect(
      validateRegistrationInput({
        fullName: "Тест",
        email: "invalid",
        password: "password123",
      }),
    ).toContain("имэйл");
  });

  it("returns error for short password", () => {
    expect(
      validateRegistrationInput({
        fullName: "Тест",
        email: "test@example.com",
        password: "123",
      }),
    ).toContain("Нууц");
  });
});

describe("validateLoginInput", () => {
  it("returns null for valid login input", () => {
    expect(
      validateLoginInput({ email: "test@example.com", password: "pw" }),
    ).toBeNull();
  });

  it("returns error for invalid email", () => {
    expect(validateLoginInput({ email: "bad", password: "pw" })).toContain(
      "имэйл",
    );
  });

  it("returns error for empty password", () => {
    expect(
      validateLoginInput({ email: "test@example.com", password: "" }),
    ).toContain("Нууц");
  });
});

describe("validatePasswordResetRequestInput", () => {
  it("returns null for valid email", () => {
    expect(
      validatePasswordResetRequestInput({ email: "test@example.com" }),
    ).toBeNull();
  });

  it("returns error for invalid email", () => {
    expect(validatePasswordResetRequestInput({ email: "bad" })).toContain(
      "имэйл",
    );
  });
});

describe("validatePasswordUpdateInput", () => {
  it("returns null when passwords match", () => {
    expect(
      validatePasswordUpdateInput({
        password: "password123",
        confirmPassword: "password123",
      }),
    ).toBeNull();
  });

  it("returns error for short password", () => {
    expect(
      validatePasswordUpdateInput({ password: "123", confirmPassword: "123" }),
    ).toContain("Нууц");
  });

  it("returns error when passwords don't match", () => {
    expect(
      validatePasswordUpdateInput({
        password: "password123",
        confirmPassword: "different",
      }),
    ).toContain("таарахгүй");
  });
});

describe("validateOrganizationInput", () => {
  it("returns null for valid org input", () => {
    expect(
      validateOrganizationInput({
        name: "Миний Дэлгүүр",
        slug: "minii-delguur",
      }),
    ).toBeNull();
  });

  it("returns error for short name", () => {
    const r = validateOrganizationInput({ name: "A", slug: "minii" });
    expect(r).toContain("Байгууллагын");
  });

  it("returns error for short slug", () => {
    const r = validateOrganizationInput({ name: "Дэлгүүр", slug: "ab" });
    expect(r).toContain("Холбоос");
  });
});

describe("validateExpenseInput", () => {
  it("returns null for valid expense", () => {
    expect(
      validateExpenseInput({ category: "Хоол", amount: 10000 }),
    ).toBeNull();
  });

  it("returns error for empty category", () => {
    expect(validateExpenseInput({ category: "", amount: 1000 })).toContain(
      "Ангилал",
    );
  });

  it("returns error for zero amount", () => {
    expect(validateExpenseInput({ category: "Хоол", amount: 0 })).toContain(
      "дүн",
    );
  });
});

describe("validateCategoryInput", () => {
  it("returns null for valid name", () => {
    expect(validateCategoryInput({ name: "Хүнс" })).toBeNull();
  });

  it("returns error for empty name", () => {
    expect(validateCategoryInput({ name: "" })).toContain("нэр");
  });
});

describe("validateContactInput", () => {
  it("returns null for valid name", () => {
    expect(validateContactInput({ name: "Харилцагч" })).toBeNull();
  });

  it("returns error for empty name", () => {
    expect(validateContactInput({ name: "" })).toContain("нэр");
  });
});

describe("validateStockMovementInput", () => {
  it("accepts valid 'in' movement", () => {
    expect(
      validateStockMovementInput({ productId: "p1", type: "in", quantity: 10 }),
    ).toBeNull();
  });

  it("accepts valid 'adjustment' movement", () => {
    expect(
      validateStockMovementInput({
        productId: "p1",
        type: "adjustment",
        quantity: 5,
      }),
    ).toBeNull();
  });

  it("rejects unknown type", () => {
    expect(
      validateStockMovementInput({ productId: "p1", type: "out", quantity: 5 }),
    ).toContain("төрөл");
  });

  it("rejects empty product id", () => {
    const r = validateStockMovementInput({
      productId: "",
      type: "in",
      quantity: 5,
    });
    expect(r).toContain("Бүтээгдэхүүн");
  });

  it("rejects in movement with zero quantity", () => {
    const r = validateStockMovementInput({
      productId: "p1",
      type: "in",
      quantity: 0,
    });
    expect(r).toContain("Орлогын");
  });

  it("rejects adjustment with zero quantity", () => {
    const r = validateStockMovementInput({
      productId: "p1",
      type: "adjustment",
      quantity: 0,
    });
    expect(r).toContain("Тохируулгын");
  });
});

describe("validateSaleInput", () => {
  it("returns null for valid sale input", () => {
    expect(
      validateSaleInput({
        productId: "p1",
        quantity: 2,
        unitPrice: 5000,
        paidAmount: 10000,
        totalAmount: 10000,
      }),
    ).toBeNull();
  });

  it("rejects empty product", () => {
    const r = validateSaleInput({
      productId: "",
      quantity: 1,
      unitPrice: 1000,
      paidAmount: 1000,
      totalAmount: 1000,
    });
    expect(r).toContain("Бүтээгдэхүүн");
  });

  it("rejects zero quantity", () => {
    const r = validateSaleInput({
      productId: "p1",
      quantity: 0,
      unitPrice: 1000,
      paidAmount: 1000,
      totalAmount: 1000,
    });
    expect(r).toContain("зөв");
  });

  it("rejects paidAmount greater than totalAmount", () => {
    const r = validateSaleInput({
      productId: "p1",
      quantity: 1,
      unitPrice: 1000,
      paidAmount: 5000,
      totalAmount: 1000,
    });
    expect(r).toContain("Төлсөн");
  });
});
