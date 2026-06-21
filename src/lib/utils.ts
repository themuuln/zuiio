import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₮${amount.toLocaleString("mn-MN")}`;
}

/** Alias for `formatCurrency` — formats as Mongolian Tugrik (₮) */
export const formatMNT = formatCurrency;

/**
 * Deterministic JSON.stringify that sorts object keys.
 * Prevents cache key mismatches when the same object has different key ordering.
 */
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object" || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = (value as Record<string, unknown>)[key];
  }
  return JSON.stringify(sorted);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function hasMultipleBranches<T extends unknown[]>(branches: T): boolean {
  return branches.length > 1;
}

/** Format a Mongolian license plate number (e.g. 1234УАБ → 1234 УАБ). */
export function formatPlateNumber(plate: string | null | undefined): string {
  if (!plate) return "";
  const trimmed = plate.trim().toUpperCase();
  // Match Mongolian standard: 4 digits + 3 Cyrillic letters
  const match = trimmed.match(/^(\d{4})([А-ЯӨҮ]{3})$/);
  if (match) return `${match[1]} ${match[2]}`;
  return trimmed;
}

export function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/`;
}
