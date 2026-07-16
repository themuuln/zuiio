/**
 * Currency service — multi-currency support for Zer
 */
import { formatCurrency as coreFormatCurrency } from "@zuiio/core";

export interface Currency {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
  exchange_rate: number;
  last_updated: string;
  created_at: string;
}

export const DEFAULT_CURRENCIES = [
  { code: "MNT", name: "Монгол төгрөг", symbol: "₮", rate: 1.0 },
  { code: "USD", name: "US Dollar", symbol: "$", rate: 3400.0 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 470.0 },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", rate: 38.0 },
  { code: "EUR", name: "Euro", symbol: "€", rate: 3700.0 },
] as const;

export type CurrencyCode = (typeof DEFAULT_CURRENCIES)[number]["code"];

export function formatAmount(amount: number, currency?: { code: string; symbol: string }): string {
  return coreFormatCurrency(amount, currency);
}

export function convertCurrency(amount: number, fromRate: number, toRate: number): number {
  return (amount * fromRate) / toRate;
}

export function toMNT(amount: number, exchangeRate: number): number {
  return amount * exchangeRate;
}

export function fromMNT(mntAmount: number, exchangeRate: number): number {
  return mntAmount / exchangeRate;
}

export function formatPrice(amount: number, currencyCode = "MNT", currencySymbol = "₮"): string {
  return formatAmount(amount, { code: currencyCode, symbol: currencySymbol });
}
