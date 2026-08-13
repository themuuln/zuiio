import { describe, expect, it } from "vitest";
import {
  calculateDiscountFromPoints,
  calculatePointsEarned,
  canRedeemReward,
  formatPoints,
  getPointsTier,
} from "./loyalty";

describe("calculatePointsEarned", () => {
  it("floors amount × rate when the order clears min_purchase", () => {
    expect(calculatePointsEarned(5000, 1, 0)).toBe(5000);
    expect(calculatePointsEarned(4999, 1, 0)).toBe(4999);
    // 12,345₮ at 0.5 pts/₮ → 6172.5 → floor 6172
    expect(calculatePointsEarned(12345, 0.5, 0)).toBe(6172);
  });

  it("returns 0 below min_purchase and for a zero/negative rate", () => {
    expect(calculatePointsEarned(9000, 1, 10000)).toBe(0);
    expect(calculatePointsEarned(10000, 1, 10000)).toBe(10000);
    expect(calculatePointsEarned(5000, 0, 0)).toBe(0);
    expect(calculatePointsEarned(5000, -1, 0)).toBe(0);
  });
});

describe("calculateDiscountFromPoints", () => {
  it("converts points to money at the org rate", () => {
    expect(calculateDiscountFromPoints(500, 1)).toBe(500);
    expect(calculateDiscountFromPoints(500, 10)).toBe(50);
  });
});

describe("canRedeemReward", () => {
  it("requires points to cover the reward cost, inclusive of equal", () => {
    expect(canRedeemReward(1000, 1000)).toBe(true);
    expect(canRedeemReward(1001, 1000)).toBe(true);
    expect(canRedeemReward(999, 1000)).toBe(false);
    expect(canRedeemReward(0, 1)).toBe(false);
  });
});

describe("formatPoints", () => {
  it("groups with mn-MN locale separators", () => {
    expect(formatPoints(0)).toBe("0");
    expect(formatPoints(5000)).toBe("5,000");
    expect(formatPoints(1000000)).toBe("1,000,000");
  });
});

describe("getPointsTier", () => {
  it("returns Энгийн below 1,000 with the next threshold", () => {
    expect(getPointsTier(0)).toEqual({
      name: "Энгийн",
      color: "text-muted-foreground",
      nextThreshold: 1000,
    });
    expect(getPointsTier(999).name).toBe("Энгийн");
  });

  it("promotes at exact thresholds", () => {
    expect(getPointsTier(1000)).toEqual({
      name: "Хүрэн",
      color: "text-amber-600",
      nextThreshold: 5000,
    });
    expect(getPointsTier(5000)).toEqual({
      name: "Мөнгөн",
      color: "text-gray-400",
      nextThreshold: 10000,
    });
    expect(getPointsTier(10000)).toEqual({
      name: "Алтан",
      color: "text-yellow-500",
      nextThreshold: null,
    });
  });

  it("keeps Мөнгөн/Алтан across their ranges", () => {
    expect(getPointsTier(4999).name).toBe("Хүрэн");
    expect(getPointsTier(9999).name).toBe("Мөнгөн");
    expect(getPointsTier(25000).name).toBe("Алтан");
    expect(getPointsTier(25000).nextThreshold).toBeNull();
  });
});
