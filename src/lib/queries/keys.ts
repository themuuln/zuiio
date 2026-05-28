/** Query key factory — single source of truth for cache keys */

export const orgKeys = {
  all: ["organizations"] as const,
  current: () => [...orgKeys.all, "current"] as const,
  detail: (id: string) => [...orgKeys.all, id] as const,
  settings: (id: string) => [...orgKeys.all, id, "settings"] as const,
  subscription: (id: string) =>
    [...orgKeys.detail(id), "subscription"] as const,
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

export const priceMemoryKeys = {
  all: (orgId: string) => ["organizations", orgId, "price-memory"] as const,
  customerAutoFill: (orgId: string, customerId: string, vehicleId?: string) =>
    [
      ...priceMemoryKeys.all(orgId),
      "customer-auto-fill",
      customerId,
      vehicleId ?? "",
    ] as const,
  servicePrices: (
    orgId: string,
    serviceCatalogId: string,
    vehicleMake?: string,
    vehicleModel?: string,
  ) =>
    [
      ...priceMemoryKeys.all(orgId),
      "service-prices",
      serviceCatalogId,
      vehicleMake ?? "",
      vehicleModel ?? "",
    ] as const,
  partPrices: (orgId: string, partName: string, vehicleMake?: string) =>
    [
      ...priceMemoryKeys.all(orgId),
      "part-prices",
      partName,
      vehicleMake ?? "",
    ] as const,
  lastVisit: (orgId: string, vehicleId: string) =>
    [...priceMemoryKeys.all(orgId), "last-visit", vehicleId] as const,
  serviceLastUsed: (orgId: string) =>
    [...priceMemoryKeys.all(orgId), "service-last-used"] as const,
};

export const serviceKeys = {
  all: (orgId: string) => ["organizations", orgId, "services"] as const,
  list: (orgId: string) => [...serviceKeys.all(orgId), "list"] as const,
  detail: (orgId: string, id: string) =>
    [...serviceKeys.all(orgId), "detail", id] as const,
};

export const mechanicKeys = {
  all: (orgId: string) => ["organizations", orgId, "mechanics"] as const,
  list: (orgId: string) => [...mechanicKeys.all(orgId), "list"] as const,
};

export const wizardKeys = {
  all: (orgId: string) => ["organizations", orgId, "wizard"] as const,
  customersByPlate: (orgId: string, query: string) =>
    [...wizardKeys.all(orgId), "customers-by-plate", query] as const,
  priceHistory: (orgId: string) =>
    [...wizardKeys.all(orgId), "price-history"] as const,
};

export const vehicleModelKeys = {
  all: (orgId: string) => ["organizations", orgId, "vehicle-models"] as const,
  list: (orgId: string) => [...vehicleModelKeys.all(orgId), "list"] as const,
  makes: (orgId: string) => [...vehicleModelKeys.all(orgId), "makes"] as const,
  modelsByMake: (orgId: string, make: string) =>
    [...vehicleModelKeys.all(orgId), "models", make] as const,
  detail: (orgId: string, id: string) =>
    [...vehicleModelKeys.all(orgId), "detail", id] as const,
};

export const customerCommunicationKeys = {
  all: (orgId: string, customerId: string) =>
    [
      "organizations",
      orgId,
      "customers",
      customerId,
      "communications",
    ] as const,
  list: (orgId: string, customerId: string) =>
    [...customerCommunicationKeys.all(orgId, customerId), "list"] as const,
};

export const customerNoteKeys = {
  all: (orgId: string) => [...customerKeys.all(orgId), "notes"] as const,
  list: (orgId: string, customerId: string) =>
    [...customerNoteKeys.all(orgId), customerId] as const,
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
  purchaseOrderDetail: (orgId: string, id: string) =>
    [...inventoryKeys.purchaseOrders(orgId), "detail", id] as const,
  purchaseOrderItems: (poId: string) => ["purchase-order-items", poId] as const,
  balances: (orgId: string) =>
    [...inventoryKeys.all(orgId), "balances"] as const,
  thresholds: (orgId: string) =>
    [...inventoryKeys.all(orgId), "thresholds"] as const,
  partsCars: (orgId: string) =>
    [...inventoryKeys.all(orgId), "parts-cars"] as const,
  partsCar: (orgId: string, carId: string) =>
    [...inventoryKeys.partsCars(orgId), carId] as const,
  partsCarParts: (orgId: string, carId: string) =>
    [...inventoryKeys.partsCars(orgId), carId, "parts"] as const,
};

export const serviceReminderKeys = {
  all: (orgId: string) =>
    ["organizations", orgId, "service-reminders"] as const,
  list: (orgId: string, vehicleId?: string) =>
    [...serviceReminderKeys.all(orgId), "list", vehicleId ?? ""] as const,
  detail: (orgId: string, id: string) =>
    [...serviceReminderKeys.all(orgId), "detail", id] as const,
  logs: (orgId: string, vehicleId?: string) =>
    [...serviceReminderKeys.all(orgId), "logs", vehicleId ?? ""] as const,
};

export const commissionKeys = {
  all: (orgId: string) => ["commission-rules", orgId] as const,
  list: (orgId: string) => [...commissionKeys.all(orgId), "list"] as const,
};

export const diagnosisLabelKeys = {
  all: (orgId: string) => ["diagnosis-labels", orgId] as const,
  list: (orgId: string) => [...diagnosisLabelKeys.all(orgId), "list"] as const,
};

export const attachmentKeys = {
  all: (orgId: string, woId: string) =>
    ["organizations", orgId, "work-orders", woId, "attachments"] as const,
  list: (orgId: string, woId: string) =>
    [...attachmentKeys.all(orgId, woId), "list"] as const,
};

export const expenseKeys = {
  all: (orgId: string) => ["organizations", orgId, "expenses"] as const,
  list: (orgId: string, filters?: Record<string, string>) =>
    [...expenseKeys.all(orgId), "list", JSON.stringify(filters ?? {})] as const,
  detail: (orgId: string, id: string) =>
    [...expenseKeys.all(orgId), "detail", id] as const,
  stats: (orgId: string, period?: string) =>
    [...expenseKeys.all(orgId), "stats", period ?? "all"] as const,
  categories: (orgId: string) =>
    [...expenseKeys.all(orgId), "categories"] as const,
};
