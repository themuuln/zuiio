import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDiscountFromPoints,
  calculatePointsEarned,
  canRedeemReward,
  formatPoints,
  getPointsTier,
} from "@/lib/loyalty";

// ─── calculatePointsEarned ──────────────────────────────────────────

test("calculatePointsEarned returns 0 when amount below minPurchase", () => {
  assert.equal(calculatePointsEarned(500, 0.1, 1000), 0);
});

test("calculatePointsEarned returns 0 when amount equals minPurchase", () => {
  // amount >= minPurchase → earns points
  assert.equal(calculatePointsEarned(1000, 0.1, 1000), 100);
});

test("calculatePointsEarned calculates floor of amount * pointsPerMnt", () => {
  assert.equal(calculatePointsEarned(1500, 0.1, 0), 150);
});

test("calculatePointsEarned floors fractional points", () => {
  // 1234 * 0.05 = 61.7 → floor = 61
  assert.equal(calculatePointsEarned(1234, 0.05, 0), 61);
});

test("calculatePointsEarned handles zero pointsPerMnt", () => {
  assert.equal(calculatePointsEarned(5000, 0, 0), 0);
});

test("calculatePointsEarned handles zero amount", () => {
  assert.equal(calculatePointsEarned(0, 0.1, 0), 0);
});

// ─── calculateDiscountFromPoints ────────────────────────────────────

test("calculateDiscountFromPoints divides points by rate", () => {
  assert.equal(calculateDiscountFromPoints(1000, 0.1), 10000);
});

test("calculateDiscountFromPoints handles zero points", () => {
  assert.equal(calculateDiscountFromPoints(0, 0.1), 0);
});

test("calculateDiscountFromPoints handles decimal result", () => {
  const result = calculateDiscountFromPoints(100, 0.15);
  assert.ok(Math.abs(result - 666.6666666666666) < 1e-12);
});

// ─── canRedeemReward ───────────────────────────────────────────────

test("canRedeemReward returns true when points >= cost", () => {
  assert.equal(canRedeemReward(500, 300), true);
});

test("canRedeemReward returns true when points equals cost", () => {
  assert.equal(canRedeemReward(300, 300), true);
});

test("canRedeemReward returns false when points below cost", () => {
  assert.equal(canRedeemReward(200, 300), false);
});

test("canRedeemReward returns false for zero points", () => {
  assert.equal(canRedeemReward(0, 100), false);
});

// ─── formatPoints ──────────────────────────────────────────────────

test("formatPoints formats with Mongolian locale", () => {
  const result = formatPoints(12345);
  assert.ok(result.length > 0);
  assert.match(result, /\d/); // contains digits
});

test("formatPoints handles zero", () => {
  assert.equal(formatPoints(0), "0");
});

// ─── getPointsTier ─────────────────────────────────────────────────

test("getPointsTier returns Энгийн for < 1000", () => {
  const tier = getPointsTier(500);
  assert.equal(tier.name, "Энгийн");
  assert.equal(tier.nextThreshold, 1000);
});

test("getPointsTier returns Хүрэн for 1000-4999", () => {
  const tier = getPointsTier(1000);
  assert.equal(tier.name, "Хүрэн");
  assert.equal(tier.nextThreshold, 5000);
});

test("getPointsTier returns Хүрэн at boundary 4999", () => {
  const tier = getPointsTier(4999);
  assert.equal(tier.name, "Хүрэн");
});

test("getPointsTier returns Мөнгөн for 5000-9999", () => {
  const tier = getPointsTier(5000);
  assert.equal(tier.name, "Мөнгөн");
  assert.equal(tier.nextThreshold, 10000);
});

test("getPointsTier returns Алтан for 10000+", () => {
  const tier = getPointsTier(10000);
  assert.equal(tier.name, "Алтан");
  assert.equal(tier.nextThreshold, null);
});

test("getPointsTier returns Алтан at high values", () => {
  const tier = getPointsTier(100000);
  assert.equal(tier.name, "Алтан");
});

test("getPointsTier returns Энгийн for zero earned", () => {
  const tier = getPointsTier(0);
  assert.equal(tier.name, "Энгийн");
  assert.equal(tier.color, "text-muted-foreground");
});

test("getPointsTier gives Хүрэн amber-600 color", () => {
  const tier = getPointsTier(2500);
  assert.equal(tier.color, "text-amber-600");
});

test("getPointsTier gives Мөнгөн gray-400 color", () => {
  const tier = getPointsTier(7500);
  assert.equal(tier.color, "text-gray-400");
});

test("getPointsTier gives Алтан yellow-500 color", () => {
  const tier = getPointsTier(15000);
  assert.equal(tier.color, "text-yellow-500");
});
