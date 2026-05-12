/** Query key factory — single source of truth for cache keys */

export const orgKeys = {
  all: ["organizations"] as const,
  current: () => [...orgKeys.all, "current"] as const,
  detail: (id: string) => [...orgKeys.all, id] as const,
  settings: (id: string) => [...orgKeys.all, id, "settings"] as const,
};

export const customerKeys = {
  all: (orgId: string) => ["organizations", orgId, "customers"] as const,
  list: (orgId: string, query?: string) =>
    [...customerKeys.all(orgId), "list", query ?? ""] as const,
  detail: (orgId: string, id: string) =>
    [...customerKeys.all(orgId), "detail", id] as const,
};

export const vehicleKeys = {
  all: (orgId: string) => ["organizations", orgId, "vehicles"] as const,
  list: (orgId: string, query?: string) =>
    [...vehicleKeys.all(orgId), "list", query ?? ""] as const,
  detail: (orgId: string, id: string) =>
    [...vehicleKeys.all(orgId), "detail", id] as const,
};

export const workOrderKeys = {
  all: (orgId: string) => ["organizations", orgId, "work-orders"] as const,
  list: (orgId: string, status?: string) =>
    [...workOrderKeys.all(orgId), "list", status ?? "All"] as const,
  detail: (orgId: string, id: string) =>
    [...workOrderKeys.all(orgId), "detail", id] as const,
};

export const dashboardKeys = {
  all: (orgId: string) => ["organizations", orgId, "dashboard"] as const,
  summary: (orgId: string, period: string) =>
    [...dashboardKeys.all(orgId), "summary", period] as const,
};

export const inventoryKeys = {
  all: (orgId: string) => ["organizations", orgId, "inventory"] as const,
  parts: (orgId: string) => [...inventoryKeys.all(orgId), "parts"] as const,
  movements: (orgId: string) =>
    [...inventoryKeys.all(orgId), "movements"] as const,
  suppliers: (orgId: string) =>
    [...inventoryKeys.all(orgId), "suppliers"] as const,
  purchaseOrders: (orgId: string) =>
    [...inventoryKeys.all(orgId), "purchase-orders"] as const,
};
