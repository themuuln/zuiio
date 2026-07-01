/** Strip ₮, commas, spaces → number. Returns NaN if unparseable. */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[₮,\s]/g, "").trim();
  return cleaned === "" ? 0 : Number(cleaned);
}

/** Compact display: 1_200_000 → "₮1.2M", 50_000 → "₮50K" */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `₮${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1_000) {
    return `₮${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}K`;
  }
  return `₮${amount}`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to N decimal places (avoids floating-point drift). */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
