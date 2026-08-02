/**
 * Formatting helpers. Kept dependency-free (no Intl) so they are
 * deterministic across Hermes/JSC and unit tests.
 */

const THOUSAND_GROUP = /\B(?=(\d{3})+(?!\d))/g;

/** 1234567 -> "1 234 567" */
export function groupDigits(value: number): string {
  const [int, frac] = String(Math.round(value * 100) / 100).split(".");
  const grouped = int.replace(THOUSAND_GROUP, " ");
  return frac ? `${grouped}.${frac}` : grouped;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  MNT: "₮",
  USD: "$",
  EUR: "€",
  RUB: "₽",
  CNY: "¥",
  KRW: "₩",
  JPY: "¥",
};

/** Display a price: "12 000 ₮" */
export function formatPrice(amount: number, currencyCode = "MNT"): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] ?? "₮";
  return `${groupDigits(amount)} ${symbol}`;
}

/** ISO date to "2026-08-03 14:05" (local time). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Short display id: "a1b2c3d4-..." -> "A1B2C3D4" */
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
