import "server-only";
import { getDb } from "@/lib/db";
import type {
  FxRateRow,
  PackageRow,
  PricingRuleRow,
} from "@/lib/supabase/types";
import { computeRetailMnt } from "./engine";
import { resolveRule } from "./resolve";
import type { PricingResult, RoundingConfig } from "./types";

export interface Quote extends PricingResult {
  packageId: string;
  fxRateId: string;
  fxRate: number;
  markupPercent: number;
  pricingRuleId: string;
}

export interface PricingContext {
  fx: FxRateRow;
  rules: PricingRuleRow[];
  minMarginPercent: number;
  rounding: RoundingConfig;
}

/**
 * Loads the live pricing context (latest FX + active rules + settings).
 * Catalog display and checkout share this, so the displayed price is
 * always the charged price.
 */
export async function loadPricingContext(): Promise<PricingContext> {
  const db = getDb();

  const [fx, rules, settings] = await Promise.all([
    db.getLatestFxRate("USD_MNT"),
    db.listPricingRules(true),
    db.getSettings(["min_margin_percent", "rounding"]),
  ]);

  if (!fx) throw new Error("No FX rate found — seed fx_rates");

  const minMarginPercent = Number(settings.get("min_margin_percent") ?? 10);
  const rounding = (settings.get("rounding") ?? {
    mode: "ceil_to",
    step: 500,
  }) as RoundingConfig;

  return { fx, rules, minMarginPercent, rounding };
}

/** Quote one package against a loaded context (no extra I/O). */
export function quotePackage(
  pkg: Pick<PackageRow, "id" | "region_id" | "cost_usd">,
  ctx: PricingContext,
): Quote {
  const rule = resolveRule(pkg, ctx.rules);
  const result = computeRetailMnt({
    costUsd: Number(pkg.cost_usd),
    fxRate: Number(ctx.fx.rate),
    markupPercent: Number(rule.markup_percent),
    minMarginPercent: ctx.minMarginPercent,
    rounding: ctx.rounding,
  });

  return {
    ...result,
    packageId: pkg.id,
    fxRateId: ctx.fx.id,
    fxRate: Number(ctx.fx.rate),
    markupPercent: Number(rule.markup_percent),
    pricingRuleId: rule.id,
  };
}
