import { describe, expect, it } from "vitest";
import { recordRefundSchema, refundListParamsSchema } from "./refunds";

describe("recordRefundSchema", () => {
  it("accepts valid refund", () => {
    expect(
      recordRefundSchema.safeParse({
        invoice_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 50000,
      }).success,
    ).toBe(true);
  });

  it("defaults method to cash", () => {
    const result = recordRefundSchema.safeParse({
      invoice_id: "550e8400-e29b-41d4-a716-446655440000",
      amount: 50000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.method).toBe("cash");
    }
  });

  it("accepts all refund methods", () => {
    for (const method of ["cash", "card", "bank_transfer", "store_credit"]) {
      expect(
        recordRefundSchema.safeParse({
          invoice_id: "550e8400-e29b-41d4-a716-446655440000",
          amount: 50000,
          method,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects invalid UUID for invoice_id", () => {
    expect(
      recordRefundSchema.safeParse({
        invoice_id: "bad-id",
        amount: 50000,
      }).success,
    ).toBe(false);
  });

  it("rejects zero amount", () => {
    expect(
      recordRefundSchema.safeParse({
        invoice_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(
      recordRefundSchema.safeParse({
        invoice_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: -100,
      }).success,
    ).toBe(false);
  });

  it("rejects invalid method", () => {
    expect(
      recordRefundSchema.safeParse({
        invoice_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 50000,
        method: "invalid",
      }).success,
    ).toBe(false);
  });

  it("rejects reason over 500 chars", () => {
    expect(
      recordRefundSchema.safeParse({
        invoice_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 50000,
        reason: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("accepts optional fields", () => {
    expect(
      recordRefundSchema.safeParse({
        invoice_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 50000,
        method: "bank_transfer",
        reason: "Customer returned item",
        reference: "REF-001",
        notes: "Processed at counter",
      }).success,
    ).toBe(true);
  });
});

describe("refundListParamsSchema", () => {
  it("accepts empty params", () => {
    expect(refundListParamsSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid status", () => {
    expect(
      refundListParamsSchema.safeParse({ status: "pending" }).success,
    ).toBe(true);
  });

  it("accepts all statuses", () => {
    for (const status of ["pending", "completed", "failed", "cancelled"]) {
      expect(refundListParamsSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    expect(
      refundListParamsSchema.safeParse({ status: "unknown" }).success,
    ).toBe(false);
  });

  it("accepts valid limit", () => {
    expect(refundListParamsSchema.safeParse({ limit: 50 }).success).toBe(true);
  });

  it("rejects limit over 100", () => {
    expect(refundListParamsSchema.safeParse({ limit: 200 }).success).toBe(
      false,
    );
  });

  it("rejects negative offset", () => {
    expect(refundListParamsSchema.safeParse({ offset: -1 }).success).toBe(
      false,
    );
  });
});
