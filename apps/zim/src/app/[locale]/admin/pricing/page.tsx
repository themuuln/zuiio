import { getDb } from "@/lib/db";
import { loadPricingContext, quotePackage } from "@/lib/pricing/quote";
import { PricingManager } from "./_manager";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const db = getDb();
  const [rules, regions, packages, ctx] = await Promise.all([
    db.listPricingRules(),
    db.listRegions(false),
    db.listPackages(),
    loadPricingContext(),
  ]);
  const regionById = new Map(regions.map((r) => [r.id, r.name_en]));
  const packageById = new Map(packages.map((p) => [p.id, p.name]));

  const activeRules = rules
    .filter((r) => r.is_active)
    .map((rule) => ({
      id: rule.id,
      scope: rule.scope,
      target:
        rule.scope === "global"
          ? "everything"
          : rule.scope === "region"
            ? (regionById.get(rule.region_id ?? "") ?? "?")
            : (packageById.get(rule.package_id ?? "") ?? "?"),
      markupPercent: Number(rule.markup_percent),
      note: rule.note,
    }));

  // Live preview data: every sellable package quoted with current rules
  const preview = packages
    .filter((p) => !p.is_archived)
    .map((pkg) => {
      const quote = quotePackage(pkg, ctx);
      return {
        id: pkg.id,
        name: pkg.name,
        regionId: pkg.region_id,
        regionName: regionById.get(pkg.region_id) ?? "?",
        costUsd: Number(pkg.cost_usd),
        costMnt: quote.costMnt,
        markupPercent: quote.markupPercent,
        retailMnt: quote.retailMnt,
        marginMnt: quote.marginMnt,
        minMarginApplied: quote.minMarginApplied,
      };
    });

  const regionOptions = regions.map((r) => ({ id: r.id, name: r.name_en }));
  const packageOptions = packages
    .filter((p) => !p.is_archived)
    .map((p) => ({
      id: p.id,
      name: `${regionById.get(p.region_id) ?? "?"} — ${p.name}`,
    }));

  return (
    <PricingManager
      rules={activeRules}
      preview={preview}
      regionOptions={regionOptions}
      packageOptions={packageOptions}
      settings={{
        fxRate: Number(ctx.fx.rate),
        minMarginPercent: ctx.minMarginPercent,
        roundingStep: ctx.rounding.step,
      }}
    />
  );
}
