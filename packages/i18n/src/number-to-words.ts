const ONES = [
  "",
  "нэг",
  "хоёр",
  "гурав",
  "дөрөв",
  "тав",
  "зургаа",
  "долоо",
  "найм",
  "ес",
];
const TENS = [
  "",
  "арав",
  "хорь",
  "гуч",
  "дөч",
  "тавь",
  "жар",
  "дал",
  "ная",
  "ер",
];

function below1000(n: number): string {
  if (n === 0) return "";
  const parts: string[] = [];

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;

  if (hundreds > 0) parts.push(`${ONES[hundreds]} зуун`);

  if (tens === 1 && ones > 0) {
    parts.push(`арван ${ONES[ones]}`);
  } else {
    if (tens > 0) parts.push(TENS[tens] ?? "");
    if (ones > 0) parts.push(ONES[ones] ?? "");
  }

  return parts.join(" ").trim();
}

/**
 * Convert a non-negative integer to Mongolian words.
 * Supports up to 999,999,999,999 (999 billion).
 */
export function numberToWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return "";
  const n = Math.floor(amount);
  if (n === 0) return "тэг";

  const parts: string[] = [];

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1_000;

  if (billions > 0) parts.push(`${below1000(billions)} тэрбум`);
  if (millions > 0) parts.push(`${below1000(millions)} сая`);
  if (thousands > 0) parts.push(`${below1000(thousands)} мянга`);
  if (remainder > 0) parts.push(below1000(remainder));

  return parts.join(" ").trim();
}

/**
 * Format an amount as Mongolian currency words, e.g. for invoice legal text.
 * "Тавин мянга найман зуун төгрөг"
 */
export function amountToWords(amount: number, currency = "төгрөг"): string {
  const words = numberToWords(Math.floor(amount));
  if (!words) return `тэг ${currency}`;
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} ${currency}`;
}
