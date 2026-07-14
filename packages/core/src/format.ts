import { format } from "date-fns";

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("mn-MN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₮ ${formatted}`;
}

/** Mongolian Tugrik — alias for `formatCurrency`. */
export function formatMNT(amount: number): string {
  return formatCurrency(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy-MM-dd");
}

export function formatRouteDate(date?: string | Date | null): string {
  if (!date) return format(new Date(), "yyyy-MM-dd");
  return format(new Date(date), "yyyy-MM-dd");
}

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
