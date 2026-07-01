import { format } from "date-fns";

/** Format a date to "yyyy-MM-dd", returns "-" for null/undefined. */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy-MM-dd");
}

/** Format a date for routing, defaults to today. */
export function formatRouteDate(date?: string | Date | null): string {
  if (!date) return format(new Date(), "yyyy-MM-dd");
  return format(new Date(date), "yyyy-MM-dd");
}

/** Slugify a string — URL-safe and lowercase. */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
