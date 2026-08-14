import { describe, expect, it } from "vitest";
import {
  maxRedeemablePoints,
  type PublicLoyaltyPointEntry,
  pointsToMoney,
  sortHistoryNewestFirst,
} from "./storefront-loyalty";

describe("pointsToMoney", () => {
  it("converts points at the org earn rate", () => {
    expect(pointsToMoney(500, 1)).toBe(500);
    expect(pointsToMoney(500, 10)).toBe(50);
    expect(pointsToMoney(10, 0.5)).toBe(20);
  });

  it("guards a zero/negative rate", () => {
    expect(pointsToMoney(500, 0)).toBe(0);
    expect(pointsToMoney(500, -1)).toBe(0);
  });
});

describe("maxRedeemablePoints", () => {
  it("caps redemption at the payable amount", () => {
    // 100,000₮ payable, 1 point = 1₮ (ppm=1) → max 100,000 points.
    expect(maxRedeemablePoints(100_000, 1)).toBe(100_000);
    // ppm=10 → 10 points per ₮; 100,000₮ payable → max 1,000,000 points.
    expect(maxRedeemablePoints(100_000, 10)).toBe(1_000_000);
    // ppm=0.1 → 1 point per 10₮; 100,000₮ payable → max 10,000 points.
    expect(maxRedeemablePoints(100_000, 0.1)).toBe(10_000);
  });

  it("floors fractional results", () => {
    expect(maxRedeemablePoints(99_999, 0.1)).toBe(9_999);
  });

  it("guards zero payable and zero rate", () => {
    expect(maxRedeemablePoints(0, 1)).toBe(0);
    expect(maxRedeemablePoints(100, 0)).toBe(0);
    expect(maxRedeemablePoints(-50, 1)).toBe(0);
  });
});

describe("sortHistoryNewestFirst", () => {
  const mk = (id: string, created_at: string): PublicLoyaltyPointEntry => ({
    id,
    points: 1,
    type: "earned",
    notes: null,
    reference_id: null,
    created_at,
  });

  it("sorts newest first without mutating the input", () => {
    const input = [
      mk("a", "2026-08-01T00:00:00Z"),
      mk("b", "2026-08-13T00:00:00Z"),
    ];
    const sorted = sortHistoryNewestFirst(input);
    expect(sorted.map((e) => e.id)).toEqual(["b", "a"]);
    expect(input.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
