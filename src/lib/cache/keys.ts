// Cache tag generators for granular invalidation

export const cacheTags = {
  // Work Orders
  workOrders: (orgId: string) => `work-orders:${orgId}`,
  workOrder: (id: string) => `work-order:${id}`,
  workOrderDetail: (id: string) => `work-order-detail:${id}`,
  dailyWorkOrders: (orgId: string, date: string) =>
    `daily-work-orders:${orgId}:${date}`,

  // Reference data (rarely changes)
  serviceCatalog: (orgId: string) => `service-catalog:${orgId}`,
  branches: (orgId: string) => `branches:${orgId}`,
  customers: (orgId: string) => `customers:${orgId}`,
  vehicles: (orgId: string) => `vehicles:${orgId}`,

  // Reports (expensive queries)
  reports: (orgId: string) => `reports:${orgId}`,
  dashboardMetrics: (orgId: string, branchId?: string) =>
    branchId ? `dashboard:${orgId}:${branchId}` : `dashboard:${orgId}:all`,
} as const;

// Cache duration constants (in seconds)
export const cacheDurations = {
  // Frequently changing data
  workOrders: 60, // 1 minute
  workOrderDetail: 30, // 30 seconds

  // Reference data - cache longer
  serviceCatalog: 3600, // 1 hour
  branches: 3600,
  customers: 300, // 5 minutes
  vehicles: 300,

  // Expensive reports - cache aggressively
  reports: 300, // 5 minutes
  dashboardMetrics: 60, // 1 minute
} as const;
