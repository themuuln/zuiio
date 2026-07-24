import { describe, expect, it } from "vitest";
import {
  FEATURE_KEYS,
  type FeatureKey,
  getNextPlanWithFeature,
  getPlanFeatures,
  isPlanFeatureEnabled,
  PLAN_FEATURES,
} from "./plan-features";

describe("PLAN_FEATURES", () => {
  it("has all 4 plan tiers", () => {
    expect(Object.keys(PLAN_FEATURES)).toEqual([
      "starter",
      "pro",
      "business",
      "enterprise",
    ]);
  });

  it("enterprise has 'all' sentinel", () => {
    expect(PLAN_FEATURES.enterprise).toBe("all");
  });

  it("starter plan has reasonable features", () => {
    const features = getPlanFeatures("starter");
    expect(features).toContain(FEATURE_KEYS.WORK_ORDERS);
    expect(features).toContain(FEATURE_KEYS.CUSTOMERS);
    expect(features).toContain(FEATURE_KEYS.VEHICLES);
    expect(features).toContain(FEATURE_KEYS.FINANCE);
  });

  it("starter plan does NOT have inventory/payroll", () => {
    const features = getPlanFeatures("starter");
    expect(features).not.toContain(FEATURE_KEYS.INVENTORY);
    expect(features).not.toContain(FEATURE_KEYS.PAYROLL);
  });

  it("pro plan adds inventory and payroll", () => {
    const features = getPlanFeatures("pro");
    expect(features).toContain(FEATURE_KEYS.INVENTORY);
    expect(features).toContain(FEATURE_KEYS.PAYROLL);
    expect(features).toContain(FEATURE_KEYS.WORK_ORDERS); // inherited from starter
  });

  it("business plan adds purchase orders and price rules", () => {
    const features = getPlanFeatures("business");
    expect(features).toContain(FEATURE_KEYS.PURCHASE_ORDERS);
    expect(features).toContain(FEATURE_KEYS.PRICE_RULES);
    expect(features).toContain(FEATURE_KEYS.PAYROLL); // inherited from pro
  });

  it("enterprise plan returns all known feature keys", () => {
    const features = getPlanFeatures("enterprise");
    const allKeys = Object.values(FEATURE_KEYS);
    for (const key of allKeys) {
      expect(features).toContain(key);
    }
  });
});

describe("isPlanFeatureEnabled", () => {
  it("returns true for features in the plan", () => {
    expect(isPlanFeatureEnabled("starter", FEATURE_KEYS.WORK_ORDERS)).toBe(
      true,
    );
  });

  it("returns false for features not in the plan", () => {
    expect(isPlanFeatureEnabled("starter", FEATURE_KEYS.INVENTORY)).toBe(false);
  });

  it("returns true for all features on enterprise", () => {
    const allKeys = Object.values(FEATURE_KEYS) as FeatureKey[];
    for (const key of allKeys) {
      expect(isPlanFeatureEnabled("enterprise", key)).toBe(true);
    }
  });
});

describe("getNextPlanWithFeature", () => {
  it("returns pro for inventory on starter", () => {
    expect(getNextPlanWithFeature("starter", FEATURE_KEYS.INVENTORY)).toBe(
      "pro",
    );
  });

  it("returns null for feature already available on current plan", () => {
    expect(
      getNextPlanWithFeature("starter", FEATURE_KEYS.WORK_ORDERS),
    ).toBeNull();
    expect(getNextPlanWithFeature("pro", FEATURE_KEYS.INVENTORY)).toBeNull();
  });

  it("returns null for enterprise (no higher tier)", () => {
    expect(
      getNextPlanWithFeature("enterprise", FEATURE_KEYS.INVENTORY),
    ).toBeNull();
  });
});
