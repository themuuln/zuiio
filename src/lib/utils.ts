import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a plate string: strip whitespace/dashes, uppercase.
 */
export function normalizePlate(plate: string): string {
  return plate.replace(/[\s\-–—._/\\]/g, "").toUpperCase()
}

export function formatPlateNumber(plate: string | null | undefined): string {
  if (!plate) return "—"
  return normalizePlate(plate)
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
  MNT: mntDecimal,
  CNY: cnyCurrency,
  USD: usdCurrency,
  EUR: eurCurrency,
};

/**
 * Format a monetary amount in the given currency.
 */
export function formatCurrency(amount: number, currency: string = "MNT"): string {
  const key = currency.toUpperCase();
  const fmt = currencyFormatters[key];
  if (!fmt) return `${key} ${amount.toLocaleString()}`;
  const formatted = fmt.format(amount);
  // Always use ₮ symbol explicitly — Intl may emit "MNT" for mn-MN + currency
  return key === "MNT" ? `₮${formatted}` : formatted;
}

/**
 * Format as ₮ + decimal (no currency symbol from Intl).
 * Used across the app for price displays.
 */
export function formatMNT(amount: number): string {
  return `₮${mntDecimal.format(amount)}`;
}

/**
 * Extract initials from a full name (up to 2 characters).
 * Returns "?" for null/undefined/empty input.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
