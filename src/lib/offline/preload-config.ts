import type { StoreName } from "./idb-store";

// ─── Types ────────────────────────────────────────────────────

export interface PreloadEndpoint {
  /** IndexedDB store to cache into */
  store: StoreName;
  /** API path relative to /api/organizations/:orgId */
  path: string;
  /** Loading priority — critical loads first, low loads last */
  priority: "critical" | "high" | "medium" | "low";
  /** Optional query params */
  params?: Record<string, string>;
  /** Optional label for the progress UI */
  label?: string;
}

// ─── Endpoint Registry ────────────────────────────────────────

/**
 * All endpoints to preload after login.
 * Ordered by priority within each group.
 */
export const PRELOAD_ENDPOINTS: PreloadEndpoint[] = [
  // ── Critical: needed for sidebar, nav, basic functionality ──
  {
    store: "organizations",
    path: "",
    priority: "critical",
    label: "Organization",
  },
  {
    store: "branches",
    path: "/branches",
    priority: "critical",
    label: "Branches",
  },
  {
    store: "mechanics",
    path: "/reports",
    priority: "critical",
    label: "Mechanics",
    params: { type: "mechanics" },
  },
  {
    store: "services",
    path: "/services",
    priority: "critical",
    label: "Services catalog",
  },

  // ── High: needed for main workflows ──
  {
    store: "customers",
    path: "/customers",
    priority: "high",
    label: "Customers",
    params: { pageSize: "1000" },
  },
  {
    store: "vehicles",
    path: "/vehicles",
    priority: "high",
    label: "Vehicles",
    params: { pageSize: "1000" },
  },
  {
    store: "work-orders",
    path: "/work-orders",
    priority: "high",
    label: "Work orders",
  },
  {
    store: "inventory-parts",
    path: "/inventory/parts",
    priority: "high",
    label: "Inventory parts",
    params: { pageSize: "1000" },
  },
  {
    store: "expenses",
    path: "/expenses",
    priority: "medium",
    label: "Expenses",
    params: { limit: "1000" },
  },
  {
    store: "payroll",
    path: "/payroll/records",
    priority: "medium",
    label: "Payroll",
    params: {
      year: String(new Date().getFullYear()),
      month: String(new Date().getMonth() + 1),
    },
  },
  {
    store: "service-reminders",
    path: "/service-reminders",
    priority: "medium",
    label: "Service reminders",
  },
  {
    store: "commission-rules",
    path: "/commission-rules",
    priority: "medium",
    label: "Commission rules",
  },
  {
    store: "inventory-suppliers",
    path: "/inventory/suppliers",
    priority: "medium",
    label: "Suppliers",
  },
  {
    store: "inventory-purchase-orders",
    path: "/inventory/purchase-orders",
    priority: "medium",
    label: "Purchase orders",
  },
  {
    store: "day-close",
    path: "/day-close",
    priority: "medium",
    label: "Day close",
  },

  // ── Low: nice to have, load last ──
  {
    store: "vehicle-models",
    path: "/vehicle-models",
    priority: "low",
    label: "Vehicle models",
  },
  {
    store: "diagnosis-labels",
    path: "/diagnosis-labels",
    priority: "low",
    label: "Diagnosis labels",
  },
  {
    store: "mechanic-hours",
    path: "/mechanic-hours",
    priority: "low",
    label: "Mechanic hours",
  },
  {
    store: "mechanic-commissions",
    path: "/mechanic-commissions",
    priority: "low",
    label: "Mechanic commissions",
  },
];

// ─── Priority Groups ──────────────────────────────────────────

export function getEndpointsByPriority(): PreloadEndpoint[][] {
  const groups: PreloadEndpoint[][] = [[], [], [], []]; // critical, high, medium, low
  const priorityIndex = { critical: 0, high: 1, medium: 2, low: 3 };

  for (const ep of PRELOAD_ENDPOINTS) {
    groups[priorityIndex[ep.priority]].push(ep);
  }

  return groups;
}
