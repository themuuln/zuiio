/**
 * Advantage tag engine — computes per-package badges for the storefront.
 * Users see advantages, not provider names.
 */

export type AdvantageTag =
  | "best_price"
  | "best_value"
  | "most_coverage"
  | "longest_validity";

export interface AdvantagePackage {
  id: string;
  name: string;
  regionSlug: string;
  dataMb: number | null;
  isUnlimited: boolean;
  validityDays: number;
  retailMnt: number;
  provider: string;
  coverageCountries: string[];
  advantages: AdvantageTag[];
}

interface TagInput {
  id: string;
  dataMb: number | null;
  isUnlimited: boolean;
  validityDays: number;
  retailMnt: number;
  provider: string;
  coverageCount: number;
}

/**
 * Compute advantage tags for a group of packages in the same region.
 * Returns a map of package id → tags.
 */
export function computeAdvantages(
  packages: TagInput[],
): Map<string, AdvantageTag[]> {
  const tags = new Map<string, AdvantageTag[]>();

  if (packages.length === 0) return tags;

  // Best price: lowest retailMnt
  const sorted = [...packages].sort((a, b) => a.retailMnt - b.retailMnt);
  const cheapest = sorted[0];
  if (cheapest) addTag(tags, cheapest.id, "best_price");

  // Best value: most data per ₮ (MB per Mnt, higher = better)
  // Unlimited data gets maximum value score
  const byValue = [...packages].sort((a, b) => {
    const aVal = a.isUnlimited
      ? Infinity
      : (a.dataMb ?? 0) / Math.max(a.retailMnt, 1);
    const bVal = b.isUnlimited
      ? Infinity
      : (b.dataMb ?? 0) / Math.max(b.retailMnt, 1);
    return bVal - aVal;
  });
  if (byValue[0]) addTag(tags, byValue[0].id, "best_value");

  // Most coverage: highest coverageCountries count
  const byCoverage = [...packages].sort(
    (a, b) => b.coverageCount - a.coverageCount,
  );
  if (byCoverage[0] && byCoverage[0].coverageCount > 1) {
    addTag(tags, byCoverage[0].id, "most_coverage");
  }

  // Longest validity: most days
  const byValidity = [...packages].sort(
    (a, b) => b.validityDays - a.validityDays,
  );
  if (byValidity[0] && byValidity[0].validityDays > 7) {
    addTag(tags, byValidity[0].id, "longest_validity");
  }

  return tags;
}

function addTag(
  map: Map<string, AdvantageTag[]>,
  id: string,
  tag: AdvantageTag,
): void {
  const existing = map.get(id) ?? [];
  existing.push(tag);
  map.set(id, existing);
}

/**
 * Human-readable label for each advantage tag.
 */
export const ADVANTAGE_LABELS: Record<AdvantageTag, string> = {
  best_price: "Best Price",
  best_value: "Best Value",
  most_coverage: "Most Coverage",
  longest_validity: "Longest Validity",
};

/**
 * Emoji prefix for each advantage tag (for storefront display).
 */
export const ADVANTAGE_EMOJI: Record<AdvantageTag, string> = {
  best_price: "🏷️",
  best_value: "💎",
  most_coverage: "🌍",
  longest_validity: "⏰",
};
