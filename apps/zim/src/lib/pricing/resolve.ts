import type { PricingRuleRow } from "@/lib/supabase/types";

/**
 * Rule precedence: package override > region override > global default.
 * Only active rules are considered; a global rule must exist.
 */
export function resolveRule(
  pkg: { id: string; region_id: string },
  rules: PricingRuleRow[],
): PricingRuleRow {
  const active = rules.filter((r) => r.is_active);

  const packageRule = active.find(
    (r) => r.scope === "package" && r.package_id === pkg.id,
  );
  if (packageRule) return packageRule;

  const regionRule = active.find(
    (r) => r.scope === "region" && r.region_id === pkg.region_id,
  );
  if (regionRule) return regionRule;

  const globalRule = active.find((r) => r.scope === "global");
  if (!globalRule) {
    throw new Error("No active global pricing rule — seed one");
  }
  return globalRule;
}
