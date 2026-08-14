/**
 * Pure promo reward-label math — mirrors get_promo_reward_label() in
 * migration 20260811100000_storefront_gaps.sql (kept in TS so the label
 * rules are unit-testable against the SQL).
 */

export type PromotionRewardType =
  | "free_product"
  | "percentage_discount"
  | "fixed_discount"
  | "free_shipping";

/**
 * Short MN label shown on the storefront for a promotion reward:
 *   - free_product   → "<buy qty>+1" (buy quantity from the min_quantity
 *     condition; default 2 → "2+1", min_quantity 1 → "1+1"),
 *   - free_shipping  → "Үнэгүй хүргэлт",
 *   - any discount   → "Хямдрал".
 */
export function promoRewardLabel(
  rewardType: PromotionRewardType,
  buyQuantity?: number | null,
): string {
  switch (rewardType) {
    case "free_product":
      return `${buyQuantity && buyQuantity > 0 ? buyQuantity : 2}+1`;
    case "free_shipping":
      return "Үнэгүй хүргэлт";
    default:
      return "Хямдрал";
  }
}
