import { describe, expect, it } from "vitest";
import { isOverdue, syncForm } from "../_expense-detail-utils";

describe("syncForm", () => {
  it("maps a stored expense to editable form values", () => {
    const values = syncForm({
      description: "Diesel refill",
      amount: 120000,
      tax_amount: 10000,
      expense_date: "2026-08-01",
      due_date: "2026-09-01",
      category_id: "cat-1",
      vendor_name: "Fuel Station",
      payment_method: "cash",
      reference_number: "INV-123",
      paid_at: "2026-08-02T10:00:00Z",
      notes: "Office van",
    });

    expect(values).toEqual({
      description: "Diesel refill",
      amount: "120000",
      taxAmount: "10000",
      expenseDate: "2026-08-01",
      dueDate: "2026-09-01",
      categoryId: "cat-1",
      vendorName: "Fuel Station",
      paymentMethod: "cash",
      referenceNumber: "INV-123",
      paid: true,
      notes: "Office van",
    });
  });

  it("handles nulls, zeros and missing optional fields", () => {
    const values = syncForm({
      description: "Fee",
      amount: 0,
      tax_amount: null,
      expense_date: null,
      due_date: null,
      category_id: null,
      vendor_name: null,
      payment_method: null,
      reference_number: null,
      paid_at: null,
      notes: null,
    });

    expect(values).toEqual({
      description: "Fee",
      amount: "0",
      taxAmount: "",
      expenseDate: "",
      dueDate: "",
      categoryId: "",
      vendorName: "",
      paymentMethod: "",
      referenceNumber: "",
      paid: false,
      notes: "",
    });
  });
});

it("maps a zero tax amount to '0' instead of an empty string", () => {
  const values = syncForm({
    description: "Fee",
    amount: 1000,
    tax_amount: 0,
    paid_at: null,
  });

  expect(values.taxAmount).toBe("0");
});

describe("isOverdue", () => {
  it("returns true for an unpaid expense with a past due date", () => {
    expect(isOverdue({ paid_at: null, due_date: "2020-01-01T00:00:00Z" })).toBe(
      true,
    );
  });

  it("returns false when the expense is paid", () => {
    expect(
      isOverdue({ paid_at: "2026-08-02T10:00:00Z", due_date: "2020-01-01" }),
    ).toBe(false);
  });

  it("returns false when there is no due date", () => {
    expect(isOverdue({ paid_at: null, due_date: null })).toBe(false);
  });

  it("returns false when the due date is in the future", () => {
    expect(isOverdue({ paid_at: null, due_date: "2099-01-01T00:00:00Z" })).toBe(
      false,
    );
  });
});
