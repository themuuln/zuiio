/**
 * Pure checkout math shared by the public checkout flow.
 *
 * These helpers mirror the authoritative PL/pgSQL rules inside
 * `submit_shop_order` (migration 20260810190000_public_checkout_full_flow.sql).
 * The SQL is what actually runs at checkout time; these functions exist so
 * the pricing rules are unit-testable and reusable by server-side previews /
 * the confirmation-email seam.
 *
 * All amounts are plain numbers (MNT). Rounding: two decimals, half away
 * from zero via Math.round(x * 100) / 100 — matches NUMERIC(12,2) storage.
 */

export type CouponDiscountType = "percentage" | "fixed_amount";

export interface CouponDiscountInput {
  discountType: CouponDiscountType;
  discountValue: number;
  /** Item subtotal (server-priced) the coupon applies to. */
  subtotal: number;
  /** Optional cap; discount never exceeds this when set. */
  maxDiscountAmount: number | null;
}

/** round2: NUMERIC(12,2)-style rounding. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Coupon discount = percent/fixed, capped by max_discount_amount, then by
 * the subtotal (a coupon can never push the merchandise below zero).
 */
export function computeCouponDiscount(input: CouponDiscountInput): number {
  const { discountType, discountValue, subtotal, maxDiscountAmount } = input;
  if (subtotal <= 0) return 0;
  const raw =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;
  const cappedByMax =
    maxDiscountAmount != null ? Math.min(raw, maxDiscountAmount) : raw;
  return round2(Math.min(Math.max(cappedByMax, 0), subtotal));
}

/**
 * Scoped-coupon discount (applies_to = selected_products / selected_categories).
 * The discount is computed against the ELIGIBLE SUBTOTAL — the server-priced
 * sum of the cart lines the coupon is scoped to — and capped by it, so a
 * scoped coupon never discounts a non-matching line. Mirrors the SQL in
 * submit_shop_order (migration 20260810200000): min_purchase_amount,
 * percent/fixed base and max_discount_amount all compare against the
 * eligible subtotal. Returns null when no eligible line exists — the
 * checkout rejects such coupons ('Купон энэ захиалгад тохирохгүй байна').
 * For 'all'-scope coupons pass the full subtotal (same as computeCouponDiscount).
 */
export function computeCouponDiscountWithEligible(
  input: CouponDiscountInput,
  eligibleSubtotal: number,
): number | null {
  if (eligibleSubtotal <= 0) return null;
  return computeCouponDiscount({ ...input, subtotal: eligibleSubtotal });
}

export type PromotionRewardType =
  | "percentage_discount"
  | "fixed_discount"
  | "free_shipping"
  | "free_product";

export interface PromotionDiscountInput {
  rewardType: PromotionRewardType;
  /** reward_value from promotion_rewards. */
  rewardValue: number;
  /** Item subtotal (before any discount). */
  subtotal: number;
  /** free_product: number of free units (floor(qty / buyN), capped). */
  freeUnits?: number;
  /** free_product: sale price of the reward product. */
  freeUnitPrice?: number;
}

export interface PromotionDiscountResult {
  /** Monetary discount (0 for free_shipping). */
  discount: number;
  /** true when the reward is free_shipping (delivery fee forced to 0). */
  freeShipping: boolean;
}

/**
 * Promotion reward math. `free_product` discounts `freeUnits × price`;
 * percentage discounts apply to the subtotal; fixed is taken verbatim;
 * free_shipping carries no monetary discount but waives the delivery fee.
 * The discount is capped at the subtotal (never below zero).
 */
export function computePromotionDiscount(
  input: PromotionDiscountInput,
): PromotionDiscountResult {
  const { rewardType, rewardValue, subtotal } = input;
  if (rewardType === "free_shipping") {
    return { discount: 0, freeShipping: true };
  }
  let discount = 0;
  if (rewardType === "percentage_discount") {
    discount = (subtotal * rewardValue) / 100;
  } else if (rewardType === "fixed_discount") {
    discount = rewardValue;
  } else if (rewardType === "free_product") {
    discount = (input.freeUnits ?? 0) * (input.freeUnitPrice ?? 0);
  }
  return {
    discount: round2(Math.min(Math.max(discount, 0), subtotal)),
    freeShipping: false,
  };
}

export interface DeliveryFeeInput {
  deliveryType: "delivery" | "pickup";
  /** organization_public_profiles.delivery_fee_amount. */
  feeAmount: number;
  /** organization_public_profiles.free_delivery_threshold; 0 = disabled. */
  freeDeliveryThreshold: number;
  /** Merchandise payable = subtotal − coupon − promotion discounts. */
  payable: number;
  /** true when an applicable promotion has a free_shipping reward. */
  freeShipping: boolean;
}

/**
 * Delivery fee rules (mirrors submit_shop_order):
 *  - pickup → 0
 *  - free_shipping promotion → 0 (takes precedence)
 *  - threshold > 0 AND payable < threshold → feeAmount
 *  - otherwise → 0
 */
export function computeDeliveryFee(input: DeliveryFeeInput): number {
  if (input.deliveryType !== "delivery") return 0;
  if (input.freeShipping) return 0;
  if (
    input.freeDeliveryThreshold > 0 &&
    input.payable < input.freeDeliveryThreshold
  ) {
    return round2(Math.max(input.feeAmount, 0));
  }
  return 0;
}

/** Gift card redemption = min(balance, merchandise payable), never negative. */
export function computeGiftCardAmount(
  balance: number,
  payable: number,
): number {
  return round2(Math.min(Math.max(balance, 0), Math.max(payable, 0)));
}

export interface OrderTotalsInput {
  /** Item subtotal (original_amount). */
  subtotal: number;
  couponDiscount: number;
  promotionDiscount: number;
  giftCardAmount: number;
  deliveryFee: number;
}

export interface OrderTotalsResult {
  /** coupon + promotion, capped at subtotal. */
  discountAmount: number;
  /** max(0, subtotal − discount). */
  payable: number;
  /** payable + delivery fee. */
  totalAmount: number;
  /** portion covered by the gift card. */
  paidAmount: number;
}

/**
 * Final order totals (mirrors submit_shop_order step 10):
 *   discount_amount = min(subtotal, coupon + promotion)
 *   total_amount    = max(0, subtotal − discount) + delivery_fee
 *   paid_amount     = gift_card_amount (rest collected by staff on confirm)
 */
export function computeOrderTotals(input: OrderTotalsInput): OrderTotalsResult {
  const discountAmount = round2(
    Math.min(input.subtotal, input.couponDiscount + input.promotionDiscount),
  );
  const payable = round2(Math.max(input.subtotal - discountAmount, 0));
  const totalAmount = round2(payable + input.deliveryFee);
  return {
    discountAmount,
    payable,
    totalAmount,
    paidAmount: round2(Math.min(input.giftCardAmount, payable)),
  };
}
