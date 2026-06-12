import type { BayPaymentMethod } from "./_schema";

/** Default processing fee % per payment method (overridable via org settings). */
export const DEFAULT_PAYMENT_METHOD_FEES: Record<BayPaymentMethod, number> = {
  cash: 0,
  card: 1,
  bank_transfer: 0,
  manual: 0,
};

export type PaymentMethodFees = Record<BayPaymentMethod, number>;

export function resolvePaymentMethodFees(
  orgFees?: Partial<Record<string, number>> | null,
): PaymentMethodFees {
  return {
    cash: orgFees?.cash ?? DEFAULT_PAYMENT_METHOD_FEES.cash,
    card: orgFees?.card ?? DEFAULT_PAYMENT_METHOD_FEES.card,
    bank_transfer:
      orgFees?.bank_transfer ?? DEFAULT_PAYMENT_METHOD_FEES.bank_transfer,
    manual: orgFees?.manual ?? DEFAULT_PAYMENT_METHOD_FEES.manual,
  };
}

export function computePaymentFeeAmount(
  subtotal: number,
  method: BayPaymentMethod,
  fees: PaymentMethodFees,
): number {
  if (subtotal <= 0) return 0;
  const percent = fees[method] ?? 0;
  if (percent <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}

export function computePaymentTotal(
  subtotal: number,
  method: BayPaymentMethod,
  fees: PaymentMethodFees,
): number {
  return subtotal + computePaymentFeeAmount(subtotal, method, fees);
}
