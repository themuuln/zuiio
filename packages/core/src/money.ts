/** Strip ₮, commas, spaces → number. Supports k/m shorthand (e.g. "400k" →400000). Returns NaN if unparseable. */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[₮,\s]/g, "").trim();
  if (cleaned === "") return 0;

  const match = cleaned.match(/^([\d.]+)\s*([km])$/i);
  if (match) {
    const num = Number(match[1]);
    if (Number.isNaN(num)) return NaN;
    return match[2]?.toLowerCase() === "k" ? num * 1_000 : num * 1_000_000;
  }

  return Number(cleaned);
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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to N decimal places (avoids floating-point drift). */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
