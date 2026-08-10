// ── Shared utilities used across report-service modules ──────

/**
 * Format a number with k/M suffixes for compact display.
 */
export function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * Format a number as USD currency (no decimals).
 */
export function formatCurrencyHelper(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compute an ISO week key (YYYY-Www) from a date string.
 */
export function getWeekKey(dateStr: string): string {
  // Parse as UTC so the getUTC* date math below operates on the same date
  // as the input — parsing without Z makes the internal UTC representation
  // shift to the previous day in positive-offset timezones, which rolled
  // ISO week boundaries back by one week (e.g. 2025-06-16 → 2025-W24).
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
