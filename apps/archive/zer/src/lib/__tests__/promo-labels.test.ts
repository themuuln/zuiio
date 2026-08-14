/**
 * Pure promo reward-label math — mirrors get_promo_reward_label() in
 * migration 20260811100000_storefront_gaps.sql.
 */

import { describe, expect, it } from "vitest";
import { promoRewardLabel } from "../promo-labels";

describe("promoRewardLabel", () => {
  it("free_product uses the min_quantity buy threshold", () => {
    expect(promoRewardLabel("free_product", 1)).toBe("1+1");
    expect(promoRewardLabel("free_product", 2)).toBe("2+1");
    expect(promoRewardLabel("free_product", 3)).toBe("3+1");
  });

  it("free_product falls back to 2+1 without a buy quantity", () => {
    expect(promoRewardLabel("free_product")).toBe("2+1");
    expect(promoRewardLabel("free_product", null)).toBe("2+1");
    expect(promoRewardLabel("free_product", 0)).toBe("2+1");
  });

  it("free_shipping label is the fixed MN string", () => {
    expect(promoRewardLabel("free_shipping")).toBe("Үнэгүй хүргэлт");
  });

  it("discount rewards label as Хямдрал", () => {
    expect(promoRewardLabel("percentage_discount")).toBe("Хямдрал");
    expect(promoRewardLabel("fixed_discount")).toBe("Хямдрал");
  });
});
