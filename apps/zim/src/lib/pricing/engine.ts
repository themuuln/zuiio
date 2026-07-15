import { roundPrice } from "./rounding";
import type { PricingInput, PricingResult } from "./types";

/**
 * Pure retail-price computation:
 *   cost ₮ → markup → min-margin floor → ceil-to-step rounding.
 * No I/O; DB values are loaded by quote.ts.
 */
export function computeRetailMnt(input: PricingInput): PricingResult {
  const { costUsd, fxRate, markupPercent, minMarginPercent, rounding } = input;

  if (costUsd < 0 || fxRate <= 0) {
    throw new Error(
      `Invalid pricing input: costUsd=${costUsd}, fxRate=${fxRate}`,
    );
  }

  const costMnt = Math.round(costUsd * fxRate);

  const marked = costMnt * (1 + markupPercent / 100);
  const floor = costMnt * (1 + minMarginPercent / 100);
  const minMarginApplied = marked < floor;
  const raw = minMarginApplied ? floor : marked;

  const retailMnt = roundPrice(raw, rounding);
  const marginMnt = retailMnt - costMnt;

  return {
    retailMnt,
    costMnt,
    marginMnt,
    marginPercent: costMnt > 0 ? (marginMnt / costMnt) * 100 : 100,
    minMarginApplied,
  };
}
