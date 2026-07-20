import { describe, expect, it } from "vitest";
import {
  PLAN_FEATURES,
  FEATURE_KEYS,
  getPlanFeatures,
  isPlanFeatureEnabled,
  getNextPlanWithFeature,
} from "./plan-features";

describe("FEATURE_KEYS", () => {
  it("defines expected feature keys", () => {
    expect(FEATURE_KEYS).toHaveProperty("WORK_ORDERS");
    expect(FEATURE_KEYS).toHaveProperty("BAY_VIEW");
    expect(FEATURE_KEYS).toHaveProperty("CUSTOMERS");
    expect(FEATURE_KEYS).toHaveProperty("VEHICLES");
    expect(FEATURE_KEYS).toHaveProperty("INVENTORY");
    expect(FEATURE_KEYS).toHaveProperty("FINANCE");
    expect(FEATURE_KEYS).toHaveProperty("SETTINGS");
  });
});

describe("PLAN_FEATURES", () => {
  it("has all plan types", () => {
    expect(PLAN_FEATURES).toHaveProperty("starter");
    expect(PLAN_FEATURES).toHaveProperty("pro");
    expect(PLAN_FEATURES).toHaveProperty("business");
    expect(PLAN_FEATURES).toHaveProperty("enterprise");
  });

  it("enterprise has 'all'", () => {
    expect(PLAN_FEATURES.enterprise).toBe("all");
  });
});

describe("getPlanFeatures", () => {
  it("returns array of features for starter", () => {
    const features = getPlanFeatures("starter");
    expect(Array.isArray(features)).toBe(true);
    expect(features.length).toBeGreaterThan(0);
  });

  it("returns all features for enterprise", () => {
    const features = getPlanFeatures("enterprise");
    expect(features).toEqual(Object.values(FEATURE_KEYS));
  });

  it("starter has fewer features than business", () => {
    const starter = getPlanFeatures("starter");
    const business = getPlanFeatures("business");
    expect(starter.length).toBeLessThan(business.length);
  });
});

describe("isPlanFeatureEnabled", () => {
  it("returns true for core features on starter", () => {
    expect(isPlanFeatureEnabled("starter", FEATURE_KEYS.WORK_ORDERS)).toBe(true);
    expect(isPlanFeatureEnabled("starter", FEATURE_KEYS.CUSTOMERS)).toBe(true);
  });

  it("returns false for pro features on starter", () => {
    expect(isPlanFeatureEnabled("starter", FEATURE_KEYS.INVENTORY)).toBe(false);
    expect(isPlanFeatureEnabled("starter", FEATURE_KEYS.PAYROLL)).toBe(false);
  });

  it("returns true for all features on enterprise", () => {
    expect(isPlanFeatureEnabled("enterprise", FEATURE_KEYS.INVENTORY)).toBe(true);
    expect(isPlanFeatureEnabled("enterprise", FEATURE_KEYS.PAYROLL)).toBe(true);
  });
});

describe("getNextPlanWithFeature", () => {
  it("returns null for enterprise (already highest)", () => {
    const result = getNextPlanWithFeature("enterprise", FEATURE_KEYS.CUSTOMERS);
    expect(result).toBeNull();
  });

  it("returns a plan upgrade suggestion for missing features", () => {
    const result = getNextPlanWithFeature("starter", FEATURE_KEYS.INVENTORY);
    expect(result).toBe("pro");
  });
});
