import { describe, expect, it } from "vitest";
import { computeRetailMnt } from "@/lib/pricing/engine";
import { resolveRule } from "@/lib/pricing/resolve";
import { roundPrice } from "@/lib/pricing/rounding";
import type { PricingRuleRow } from "@/lib/supabase/types";

const ROUND_500 = { mode: "ceil_to" as const, step: 500 };

describe("roundPrice", () => {
  it("ceils to the nearest step", () => {
    expect(roundPrice(29371, ROUND_500)).toBe(29500);
    expect(roundPrice(29501, ROUND_500)).toBe(30000);
  });

  it("keeps exact-step values unchanged", () => {
    expect(roundPrice(29500, ROUND_500)).toBe(29500);
    expect(roundPrice(500, ROUND_500)).toBe(500);
  });

  it("rejects invalid steps", () => {
    expect(() => roundPrice(1000, { mode: "ceil_to", step: 0 })).toThrow();
  });
});

describe("computeRetailMnt", () => {
  it("applies markup, then rounds up to step", () => {
    // $8 × 3450 = 27,600₮ → +20% = 33,120 → ceil → 33,500
    const result = computeRetailMnt({
      costUsd: 8,
      fxRate: 3450,
      markupPercent: 20,
      minMarginPercent: 10,
      rounding: ROUND_500,
    });
    expect(result.costMnt).toBe(27600);
    expect(result.retailMnt).toBe(33500);
    expect(result.minMarginApplied).toBe(false);
    expect(result.marginMnt).toBe(5900);
  });

  it("enforces the min-margin floor when markup is below it", () => {
    // markup 5% < floor 10%: 27,600 × 1.10 = 30,360 → ceil → 30,500
    const result = computeRetailMnt({
      costUsd: 8,
      fxRate: 3450,
      markupPercent: 5,
      minMarginPercent: 10,
      rounding: ROUND_500,
    });
    expect(result.minMarginApplied).toBe(true);
    expect(result.retailMnt).toBe(30500);
  });

  it("never returns a price below the floor even at exact boundaries", () => {
    // Construct a case where floor lands exactly on a step
    // cost 10,000₮, floor 10% → 11,000 → exact step (500) → stays 11,000
    const result = computeRetailMnt({
      costUsd: 10000 / 3450,
      fxRate: 3450,
      markupPercent: 0,
      minMarginPercent: 10,
      rounding: ROUND_500,
    });
    expect(result.retailMnt).toBeGreaterThanOrEqual(
      result.costMnt * 1.1 - 1, // allow for integer cost rounding
    );
    expect(result.minMarginApplied).toBe(true);
  });

  it("rounding never dips below the un-rounded floor", () => {
    for (const costUsd of [2.5, 3.33, 7.77, 13.5, 45]) {
      const result = computeRetailMnt({
        costUsd,
        fxRate: 3457.1234,
        markupPercent: 3,
        minMarginPercent: 12,
        rounding: ROUND_500,
      });
      expect(result.retailMnt).toBeGreaterThanOrEqual(
        result.costMnt * 1.12 - 1,
      );
    }
  });

  it("rejects invalid inputs", () => {
    expect(() =>
      computeRetailMnt({
        costUsd: -1,
        fxRate: 3450,
        markupPercent: 20,
        minMarginPercent: 10,
        rounding: ROUND_500,
      }),
    ).toThrow();
    expect(() =>
      computeRetailMnt({
        costUsd: 5,
        fxRate: 0,
        markupPercent: 20,
        minMarginPercent: 10,
        rounding: ROUND_500,
      }),
    ).toThrow();
  });
});

describe("resolveRule", () => {
  const rule = (over: Partial<PricingRuleRow>): PricingRuleRow => ({
    id: over.id ?? "r-global",
    scope: over.scope ?? "global",
    region_id: over.region_id ?? null,
    package_id: over.package_id ?? null,
    markup_percent: over.markup_percent ?? 20,
    is_active: over.is_active ?? true,
    note: null,
    created_at: "2026-07-11T00:00:00Z",
  });

  const pkg = { id: "pkg-1", region_id: "reg-china" };

  it("package override beats region and global", () => {
    const rules = [
      rule({ id: "r-global", scope: "global" }),
      rule({ id: "r-region", scope: "region", region_id: "reg-china" }),
      rule({ id: "r-pkg", scope: "package", package_id: "pkg-1" }),
    ];
    expect(resolveRule(pkg, rules).id).toBe("r-pkg");
  });

  it("region override beats global", () => {
    const rules = [
      rule({ id: "r-global", scope: "global" }),
      rule({ id: "r-region", scope: "region", region_id: "reg-china" }),
    ];
    expect(resolveRule(pkg, rules).id).toBe("r-region");
  });

  it("falls back to global", () => {
    const rules = [
      rule({ id: "r-global", scope: "global" }),
      rule({ id: "r-other-region", scope: "region", region_id: "reg-japan" }),
      rule({ id: "r-other-pkg", scope: "package", package_id: "pkg-2" }),
    ];
    expect(resolveRule(pkg, rules).id).toBe("r-global");
  });

  it("ignores inactive rules", () => {
    const rules = [
      rule({ id: "r-global", scope: "global" }),
      rule({
        id: "r-pkg-off",
        scope: "package",
        package_id: "pkg-1",
        is_active: false,
      }),
    ];
    expect(resolveRule(pkg, rules).id).toBe("r-global");
  });

  it("throws without an active global rule", () => {
    expect(() =>
      resolveRule(pkg, [rule({ id: "r-off", is_active: false })]),
    ).toThrow(/global pricing rule/);
  });
});
