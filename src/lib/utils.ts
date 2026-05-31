import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function formatCurrency(
  amount: number,
  currency: string = "MNT",
): string {
  const key = currency.toUpperCase();
  const fmt = currencyFormatters[key];
  if (!fmt) return `${key} ${amount.toLocaleString()}`;
  const formatted = fmt.format(amount);
  return key === "MNT" ? `₮${formatted}` : formatted;
}

export function formatMNT(amount: number): string {
  return `₮${mntDecimal.format(amount)}`;
}

/** Format a Mongolian license plate (e.g. "1234АБВ" → "1234 АБВ"). */
export function formatPlateNumber(plate: string): string {
  const cleaned = plate.trim().toUpperCase();
  // Match leading digits + trailing letters
  const match = cleaned.match(/^(\d+)([A-ZА-ЯӨҮЁ]+)$/);
  if (match) return `${match[1]} ${match[2]}`;
  return cleaned;
}

/** Get uppercase initials from a full name. */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/** Set a browser cookie by name with expiry in days. */
export function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
}
