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

  // Inventory
  partsCatalog: (orgId: string) => `parts-catalog:${orgId}`,
  inventoryBalances: (orgId: string) => `inventory-balances:${orgId}`,
  inventoryMovements: (orgId: string) => `inventory-movements:${orgId}`,
  purchaseOrders: (orgId: string) => `purchase-orders:${orgId}`,
  stockThresholds: (orgId: string) => `stock-thresholds:${orgId}`,
  suppliers: (orgId: string) => `suppliers:${orgId}`,

  // Invoices
  invoices: (orgId: string) => `invoices:${orgId}`,
  invoice: (id: string) => `invoice:${id}`,

  // Users
  organizationUsers: (orgId: string) => `org-users:${orgId}`,
  userProfile: (userId: string) => `user-profile:${userId}`,

  // Vehicle Models
  vehicleModels: (orgId: string) => `vehicle-models:${orgId}`,

  // Bay View
  bayView: (orgId: string, branchId: string) =>
    `bay-view:${orgId}:${branchId}`,

  // Expenses
  expenses: (orgId: string) => `expenses:${orgId}`,
  expense: (id: string) => `expense:${id}`,
  expenseCategories: (orgId: string) => `expense-categories:${orgId}`,

  // Service Reminders
  serviceSchedules: (orgId: string) => `service-schedules:${orgId}`,
  serviceSchedule: (id: string) => `service-schedule:${id}`,
  reminderLogs: (orgId: string) => `reminder-logs:${orgId}`,

  // Customer Notes
  customerNotes: (orgId: string, customerId: string) =>
    `customer-notes:${orgId}:${customerId}`,

  // Customer Communications
  customerCommunications: (orgId: string, customerId: string) =>
    `customer-communications:${orgId}:${customerId}`,

  // Parts Cars / Disassembly
  partsCars: (orgId: string) => `parts-cars:${orgId}`,
  partsCarParts: (carId: string) => `parts-car-parts:${carId}`,
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
  dashboardMetrics: 300, // 5 minutes (was 1m)

  // Inventory - balances change with every sale/movement
  partsCatalog: 3600, // 1 hour (rarely changes)
  inventoryBalances: 60, // 1 minute
  inventoryMovements: 120, // 2 minutes
  purchaseOrders: 60, // 1 minute
  stockThresholds: 300, // 5 minutes
  suppliers: 3600, // 1 hour

  // Invoices
  invoices: 60, // 1 minute
  invoice: 30, // 30 seconds

  // Users - rarely changes within a session
  organizationUsers: 300, // 5 minutes
  userProfile: 300,

  // Vehicle Models - reference data, rarely changes
  vehicleModels: 3600, // 1 hour

  // Bay View - real-time data, short cache
  bayView: 30, // 30 seconds

  // Expenses
  expenses: 300, // 5 minutes
  expenseCategories: 3600, // 1 hour (rarely changes)

  // Service Reminders
  serviceSchedules: 120, // 2 minutes (updated when services are performed)
  reminderLogs: 300, // 5 minutes
} as const;
