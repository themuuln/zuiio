/**
 * Weighted random selection utilities for A/B Test node.
 * These functions are used by both the Edge Function (Deno) and unit tests (Vitest).
 */

export interface AbVariant {
  id?: string;
  weight: number;
  message?: string;
}

/**
 * Select a variant index using weighted random selection.
 * @param variants - Array of variants with weight property
 * @param randomValue - A random value in [0, 1) for deterministic testing
 * @returns The index of the selected variant
 */
export function selectAbVariant(
  variants: AbVariant[],
  randomValue: number = Math.random(),
): number {
  if (!variants || variants.length === 0) {
    return 0;
  }

  const totalWeight = variants.reduce(
    (sum: number, v: AbVariant) => sum + (typeof v.weight === "number" ? v.weight : 0),
    0,
  );

  if (totalWeight <= 0) {
    // If no weights, pick first variant
    return 0;
  }

  const random = randomValue * totalWeight;
  let cumulative = 0;

  for (let i = 0; i < variants.length; i++) {
    const weight = typeof variants[i]?.weight === "number" ? variants[i].weight : 0;
    cumulative += weight;
    if (random < cumulative) {
      return i;
    }
  }

  // Fallback (should not reach here if weights sum > 0 and randomValue < 1)
  return variants.length - 1;
}
