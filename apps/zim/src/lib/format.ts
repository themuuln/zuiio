/** Client-safe formatting helpers (no server imports). */

export function formatMnt(amount: number): string {
  return `₮${new Intl.NumberFormat("mn-MN").format(amount)}`;
}

export function formatData(dataMb: number | null): string | null {
  if (dataMb === null) return null;
  return dataMb >= 1024 ? `${Math.round(dataMb / 1024)} GB` : `${dataMb} MB`;
}

/** ISO2 country code → emoji flag. */
export function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "🌐";
  const base = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    base + upper.charCodeAt(0) - 65,
    base + upper.charCodeAt(1) - 65,
  );
}
