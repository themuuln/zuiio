/**
 * Nav item status — small colored dots in the sidebar indicating
 * whether a feature is fully validated (green) or still being implemented (yellow).
 */

export type NavItemStatus = "validated" | "implementing";

const VALIDATED_HREFS = new Set([
  "/dashboard",
  "/dashboard/bay-view",
  "/dashboard/customers",
  "/dashboard/vehicles",
  "/dashboard/inventory",
  "/dashboard/services",
  "/dashboard/settings",
  "/guide",
]);

/**
 * Returns the validation status for a nav item by its href.
 */
export function getNavItemStatus(href: string): NavItemStatus {
  return VALIDATED_HREFS.has(href) ? "validated" : "implementing";
}

/**
 * Tailwind class for the dot color based on status.
 */
export function getNavStatusDotClass(href: string): string {
  return getNavItemStatus(href) === "validated"
    ? "bg-green-500"
    : "bg-amber-400";
}
