import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Set a client-side cookie with the given name, value, and expiry.
 * Used for locale switching and other frontend-side cookie writes.
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 365,
): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Module-scoped Intl formatters (created once, not per call)
const mntDecimal = new Intl.NumberFormat("mn-MN", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const mntCurrency = new Intl.NumberFormat("mn-MN", {
  style: "currency",
  currency: "MNT",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const cnyCurrency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const usdCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const eurCurrency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatters: Record<string, Intl.NumberFormat> = {
  MNT: mntCurrency,
  CNY: cnyCurrency,
  USD: usdCurrency,
  EUR: eurCurrency,
};

/**
 * Format a monetary amount in the given currency.
 */
export function formatCurrency(amount: number, currency: string = "MNT"): string {
  const fmt = currencyFormatters[currency.toUpperCase()];
  if (fmt) return fmt.format(amount);
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Format as ₮ + decimal (no currency symbol from Intl).
 * Used across the app for price displays.
 */
export function formatMNT(amount: number): string {
  return `₮${mntDecimal.format(amount)}`;
}
