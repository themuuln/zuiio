import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * Decode literal `\uXXXX` escape sequences in a string.
 * Handles Recharts tooltip names that may contain escaped Cyrillic.
 */
export function decodeEscapedUnicode(str: string): string {
  if (!str.includes("\\u")) return str;
  try {
    return JSON.parse(`"${str.replace(/"/g, '\\"')}"`);
  } catch {
    return str;
  }
}
