import type { StoreName } from "./idb-store";

/**
 * Maps API paths to IndexedDB store names.
 * Used by createOrgQuery to know which store to cache into.
 *
 * Keys are the API path suffix (relative to /api/organizations/:orgId).
 * Values are the corresponding IndexedDB store names.
 */
export const PATH_TO_STORE: Record<string, StoreName> = {
  "/customers": "customers",
  "/vehicles": "vehicles",
  "/work-orders": "work-orders",
  "/services": "services",
  "/inventory/parts": "inventory-parts",
  "/inventory/movements": "inventory-movements",
  "/inventory/suppliers": "inventory-suppliers",
  "/inventory/purchase-orders": "inventory-purchase-orders",
  "/users": "organizations",
  "/appointments": "organizations",
  "/clock/devices": "organizations",
  "/mechanic-hours": "mechanic-hours",
  "/mechanic-commissions": "mechanic-commissions",
  "/branches": "branches",
  "/reports": "reports",
  "/expenses": "expenses",
  "/expense-categories": "expenses",
  "/payroll/records": "payroll",
  "/payroll/pay-rates": "payroll",
  "/service-reminders": "service-reminders",
  "/service-reminder-logs": "service-reminders",
  "/commission-rules": "commission-rules",
  "/vehicle-models": "vehicle-models",
  "/diagnosis-labels": "diagnosis-labels",
  "/day-close": "day-close",
  "/day-close/close": "day-close",
  "/price-history": "price-memory",
  "/price-rules": "price-memory",
  "/members": "organizations",
  "/roles": "organizations",
  "/features": "organizations",
  "/subscription": "organizations",
  "/invites": "organizations",
  "/estimates": "work-orders",
  "/invoices": "work-orders",
  "/export": "reports",
};

/**
 * Look up the IndexedDB store for a given API path.
 * Returns undefined if the path isn't mapped (no caching for that endpoint).
 */
export function getStoreForPath(apiPath: string): StoreName | undefined {
  // Try exact match first
  if (PATH_TO_STORE[apiPath]) return PATH_TO_STORE[apiPath];

  // Try prefix match (e.g. /customers/123 → /customers)
  for (const [prefix, store] of Object.entries(PATH_TO_STORE)) {
    if (apiPath.startsWith(`${prefix}/`) || apiPath === prefix) {
      return store;
    }
  }

  return undefined;
}
