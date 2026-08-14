import { describe, expect, it } from "vitest";
import {
  computePaymentFeeAmount,
  computePaymentTotal,
  DEFAULT_PAYMENT_METHOD_FEES,
  resolvePaymentMethodFees,
} from "./_payment-fees";

describe("payment fees", () => {
  it("defaults card to 1% and bank transfer to 0%", () => {
    const fees = resolvePaymentMethodFees(null);
    expect(fees.card).toBe(DEFAULT_PAYMENT_METHOD_FEES.card);
    expect(fees.bank_transfer).toBe(0);
  });

  it("merges org overrides", () => {
    const fees = resolvePaymentMethodFees({ card: 2.5, cash: 0.5 });
    expect(fees.card).toBe(2.5);
    expect(fees.cash).toBe(0.5);
    expect(fees.bank_transfer).toBe(0);
  });

  it("computes fee and total for card payments", () => {
    const fees = resolvePaymentMethodFees(null);
    expect(computePaymentFeeAmount(100_000, "card", fees)).toBe(1_000);
    expect(computePaymentTotal(100_000, "card", fees)).toBe(101_000);
  });

  it("returns zero fee for bank transfer", () => {
    const fees = resolvePaymentMethodFees(null);
    expect(computePaymentFeeAmount(100_000, "bank_transfer", fees)).toBe(0);
    expect(computePaymentTotal(100_000, "bank_transfer", fees)).toBe(100_000);
  });
});
