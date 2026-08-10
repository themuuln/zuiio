/**
 * Pure checkout math — mirrors the PL/pgSQL rules in
 * migration 20260810190000_public_checkout_full_flow.sql
 * (submit_shop_order). Kept in TS so the pricing rules are unit-testable.
 */

import { describe, expect, it } from "vitest";
import {
  computeCouponDiscount,
  computeCouponDiscountWithEligible,
  computeDeliveryFee,
  computeGiftCardAmount,
  computeOrderTotals,
  computePromotionDiscount,
  round2,
} from "../public-checkout";

describe("round2", () => {
  it("rounds to two decimals", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10.0);
  });
});

describe("computeCouponDiscount", () => {
  it("applies a percentage to the subtotal", () => {
    expect(
      computeCouponDiscount({
        discountType: "percentage",
        discountValue: 10,
        subtotal: 10000,
        maxDiscountAmount: null,
      }),
    ).toBe(1000);
  });

  it("applies a fixed amount verbatim", () => {
    expect(
      computeCouponDiscount({
        discountType: "fixed_amount",
        discountValue: 1500,
        subtotal: 10000,
        maxDiscountAmount: null,
      }),
    ).toBe(1500);
  });

  it("caps the discount at max_discount_amount", () => {
    expect(
      computeCouponDiscount({
        discountType: "percentage",
        discountValue: 50,
        subtotal: 10000,
        maxDiscountAmount: 3000,
      }),
    ).toBe(3000);
  });

  it("never discounts more than the subtotal", () => {
    expect(
      computeCouponDiscount({
        discountType: "fixed_amount",
        discountValue: 20000,
        subtotal: 10000,
        maxDiscountAmount: null,
      }),
    ).toBe(10000);
  });

  it("returns 0 for an empty cart", () => {
    expect(
      computeCouponDiscount({
        discountType: "percentage",
        discountValue: 10,
        subtotal: 0,
        maxDiscountAmount: null,
      }),
    ).toBe(0);
  });
});

describe("computeCouponDiscountWithEligible", () => {
  it("applies a percentage against the eligible subtotal only", () => {
    // Full cart 10000, but only 6000 is eligible → 10% of 6000 = 600.
    expect(
      computeCouponDiscountWithEligible(
        {
          discountType: "percentage",
          discountValue: 10,
          subtotal: 10000,
          maxDiscountAmount: null,
        },
        6000,
      ),
    ).toBe(600);
  });

  it("caps the percentage at max_discount_amount against the eligible subtotal", () => {
    // 50% of 2000 eligible = 1000, capped by max 500 → 500.
    expect(
      computeCouponDiscountWithEligible(
        {
          discountType: "percentage",
          discountValue: 50,
          subtotal: 10000,
          maxDiscountAmount: 500,
        },
        2000,
      ),
    ).toBe(500);
  });

  it("caps a fixed discount at the eligible subtotal", () => {
    // Fixed 20000 can never exceed the 4000 eligible subtotal.
    expect(
      computeCouponDiscountWithEligible(
        {
          discountType: "fixed_amount",
          discountValue: 20000,
          subtotal: 10000,
          maxDiscountAmount: null,
        },
        4000,
      ),
    ).toBe(4000);
  });

  it("returns null when no eligible line exists (zero eligible subtotal)", () => {
    expect(
      computeCouponDiscountWithEligible(
        {
          discountType: "percentage",
          discountValue: 10,
          subtotal: 10000,
          maxDiscountAmount: null,
        },
        0,
      ),
    ).toBeNull();
  });

  it("equals the plain helper when the whole cart is eligible", () => {
    const input = {
      discountType: "percentage" as const,
      discountValue: 10,
      subtotal: 10000,
      maxDiscountAmount: null as number | null,
    };
    expect(computeCouponDiscountWithEligible(input, 10000)).toBe(
      computeCouponDiscount(input),
    );
  });
});

describe("computePromotionDiscount", () => {
  it("percentage discount applies to the subtotal", () => {
    expect(
      computePromotionDiscount({
        rewardType: "percentage_discount",
        rewardValue: 10,
        subtotal: 10000,
      }),
    ).toEqual({ discount: 1000, freeShipping: false });
  });

  it("fixed discount applies verbatim", () => {
    expect(
      computePromotionDiscount({
        rewardType: "fixed_discount",
        rewardValue: 2000,
        subtotal: 10000,
      }),
    ).toEqual({ discount: 2000, freeShipping: false });
  });

  it("free_shipping carries no monetary discount but forces free shipping", () => {
    expect(
      computePromotionDiscount({
        rewardType: "free_shipping",
        rewardValue: 5000,
        subtotal: 10000,
      }),
    ).toEqual({ discount: 0, freeShipping: true });
  });

  it("free_product discounts free units × reward price", () => {
    expect(
      computePromotionDiscount({
        rewardType: "free_product",
        rewardValue: 0,
        subtotal: 10000,
        freeUnits: 2,
        freeUnitPrice: 2500,
      }),
    ).toEqual({ discount: 5000, freeShipping: false });
  });

  it("never discounts more than the subtotal", () => {
    expect(
      computePromotionDiscount({
        rewardType: "percentage_discount",
        rewardValue: 200,
        subtotal: 10000,
      }),
    ).toEqual({ discount: 10000, freeShipping: false });
  });
});

describe("computeDeliveryFee", () => {
  const base = {
    feeAmount: 5000,
    freeDeliveryThreshold: 20000,
    payable: 10000,
    freeShipping: false,
  };

  it("pickup is always free", () => {
    expect(computeDeliveryFee({ ...base, deliveryType: "pickup" })).toBe(0);
  });

  it("charges the fee below the free-delivery threshold", () => {
    expect(computeDeliveryFee({ ...base, deliveryType: "delivery" })).toBe(
      5000,
    );
  });

  it("waives the fee at/above the threshold", () => {
    expect(
      computeDeliveryFee({
        ...base,
        deliveryType: "delivery",
        payable: 20000,
      }),
    ).toBe(0);
    expect(
      computeDeliveryFee({
        ...base,
        deliveryType: "delivery",
        payable: 25000,
      }),
    ).toBe(0);
  });

  it("threshold 0 disables fee charging (delivery is free)", () => {
    expect(
      computeDeliveryFee({
        ...base,
        deliveryType: "delivery",
        freeDeliveryThreshold: 0,
      }),
    ).toBe(0);
  });

  it("free_shipping promotion takes precedence over the fee", () => {
    expect(
      computeDeliveryFee({
        ...base,
        deliveryType: "delivery",
        freeShipping: true,
      }),
    ).toBe(0);
  });
});

describe("computeGiftCardAmount", () => {
  it("redeems the full balance when it covers the payable", () => {
    expect(computeGiftCardAmount(10000, 8000)).toBe(8000);
  });

  it("redeems partially when the balance is smaller", () => {
    expect(computeGiftCardAmount(3000, 8000)).toBe(3000);
  });

  it("returns 0 for an empty balance", () => {
    expect(computeGiftCardAmount(0, 8000)).toBe(0);
  });
});

describe("computeOrderTotals", () => {
  it("subtotal − coupon − promo + delivery fee, gift card as paid", () => {
    const totals = computeOrderTotals({
      subtotal: 10000,
      couponDiscount: 1000,
      promotionDiscount: 500,
      giftCardAmount: 3000,
      deliveryFee: 5000,
    });
    expect(totals.discountAmount).toBe(1500);
    expect(totals.payable).toBe(8500);
    expect(totals.totalAmount).toBe(13500);
    expect(totals.paidAmount).toBe(3000);
  });

  it("caps combined discounts at the subtotal", () => {
    const totals = computeOrderTotals({
      subtotal: 10000,
      couponDiscount: 8000,
      promotionDiscount: 8000,
      giftCardAmount: 0,
      deliveryFee: 0,
    });
    expect(totals.discountAmount).toBe(10000);
    expect(totals.payable).toBe(0);
    expect(totals.totalAmount).toBe(0);
  });

  it("gift card never exceeds the payable", () => {
    const totals = computeOrderTotals({
      subtotal: 10000,
      couponDiscount: 0,
      promotionDiscount: 0,
      giftCardAmount: 50000,
      deliveryFee: 0,
    });
    expect(totals.paidAmount).toBe(10000);
    expect(totals.totalAmount).toBe(10000);
  });
});
