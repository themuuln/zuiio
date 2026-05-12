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

/**
 * Format a monetary amount in the given currency.
 */
export function formatCurrency(amount: number, currency: string = "MNT"): string {
  const currencyMap: Record<string, { locale: string; options: Intl.NumberFormatOptions }> = {
    MNT: { locale: "mn-MN", options: { style: "currency", currency: "MNT", minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    CNY: { locale: "zh-CN", options: { style: "currency", currency: "CNY", minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    USD: { locale: "en-US", options: { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    EUR: { locale: "de-DE", options: { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 } },
  };

  const cfg = currencyMap[currency.toUpperCase()];
  if (cfg) {
    try {
      return new Intl.NumberFormat(cfg.locale, cfg.options).format(amount);
    } catch {
      // fallback
    }
  }
  return `${currency} ${amount.toLocaleString()}`;
}
