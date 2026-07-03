/**
 * Nav item status — small colored dots in the sidebar indicating
 * whether a feature is fully validated (green).
 */

export type NavItemStatus = "validated" | "implementing";

const VALIDATED_HREFS = new Set([
  "/dashboard",
  "/dashboard/bay-view",
  "/dashboard/work-orders",
  "/dashboard/services",
  "/dashboard/customers",
  "/dashboard/service-reminders",
  "/dashboard/inventory",
  "/dashboard/finance",
  "/dashboard/reports",
  "/dashboard/organization",
  "/dashboard/settings",
]);

/**
 * Returns the validation status for a nav item by its href.
 * All sidebar items are validated.
 */
export function getNavItemStatus(_href: string): NavItemStatus {
  return "validated";
}

/**
 * Tailwind class for the dot color based on status.
 * Always green for sidebar-visible items.
 */
export function getNavStatusDotClass(href: string): string {
  return VALIDATED_HREFS.has(href) ? "bg-green-500" : "bg-amber-400";
}
