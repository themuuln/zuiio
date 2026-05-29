import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Mongolian Tugrik (₮). */
export function formatMNT(value: number): string {
  return `${value.toLocaleString("mn-MN")} ₮`;
}

/** Alias used across the codebase for currency display. */
export const formatCurrency = formatMNT;

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
