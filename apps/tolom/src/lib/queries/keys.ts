/** Query key factory — single source of truth for cache keys */

import { stableStringify } from "@/lib/utils";

export const profileKeys = {
  current: () => ["profile", "current"] as const,
};

export const orgKeys = {
  all: ["organizations"] as const,
  current: () => [...orgKeys.all, "current"] as const,
  detail: (id: string) => [...orgKeys.all, id] as const,
  settings: (id: string) => [...orgKeys.all, id, "settings"] as const,
  subscription: (id: string) =>
    [...orgKeys.detail(id), "subscription"] as const,
};

export const branchKeys = {
  all: (orgId: string) => ["organizations", orgId, "branches"] as const,
  list: (orgId: string) => [...branchKeys.all(orgId), "list"] as const,
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
  list: (orgId: string, query?: string, branchId?: string | null) =>
    [
      ...vehicleKeys.all(orgId),
      "list",
      query ?? "",
      branchId ?? "all",
    ] as const,
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

export const estimateKeys = {
  all: (orgId: string) => ["organizations", orgId, "estimates"] as const,
  list: (
    orgId: string,
    status?: string,
    search?: string,
    branchId?: string | null,
  ) =>
    [
      ...estimateKeys.all(orgId),
      "list",
      status ?? "",
      search ?? "",
      branchId ?? "all",
    ] as const,
  detail: (orgId: string, id: string) =>
    [...estimateKeys.all(orgId), "detail", id] as const,
};

export const refundKeys = {
  all: (orgId: string) => ["organizations", orgId, "refunds"] as const,
  list: (orgId: string, status?: string) =>
    [...refundKeys.all(orgId), "list", status ?? "all"] as const,
  detail: (orgId: string, id: string) =>
    [...refundKeys.all(orgId), "detail", id] as const,
  stats: (orgId: string) => [...refundKeys.all(orgId), "stats"] as const,
  invoiceRefunds: (orgId: string, invoiceId: string) =>
    [...refundKeys.all(orgId), "invoice", invoiceId] as const,
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
  vehicleModels: (orgId: string, serviceId: string) =>
    [...serviceKeys.all(orgId), "vehicle-models", serviceId] as const,
};

export const mechanicKeys = {
  all: (orgId: string) => ["organizations", orgId, "mechanics"] as const,
  list: (orgId: string) => [...mechanicKeys.all(orgId), "list"] as const,
  /** EOD summary for a specific mechanic */
  eod: (orgId: string, userId: string) =>
    [...mechanicKeys.all(orgId), userId, "eod"] as const,
  /** Mechanic trend data (avg job value, jobs per day, weekly trend) */
  trend: (orgId: string, userId: string, startDate: string, endDate: string) =>
    [...mechanicKeys.all(orgId), userId, "trend", startDate, endDate] as const,
  /** Active work orders for a mechanic (multiple statuses) */
  workOrders: (orgId: string, userId: string) =>
    [...mechanicKeys.all(orgId), userId, "work-orders"] as const,
};

export const mechanicPerfKeys = {
  all: (orgId: string) =>
    ["organizations", orgId, "mechanic-performance"] as const,
  kpis: (
    orgId: string,
    dateFrom: string,
    dateTo: string,
    branchId?: string | null,
  ) =>
    [
      ...mechanicPerfKeys.all(orgId),
      "kpis",
      dateFrom,
      dateTo,
      branchId ?? "all",
    ] as const,
  hours: (orgId: string, dateFrom: string, dateTo: string) =>
    [...mechanicPerfKeys.all(orgId), "hours", dateFrom, dateTo] as const,
  commissions: (orgId: string, dateFrom: string, dateTo: string) =>
    [...mechanicPerfKeys.all(orgId), "commissions", dateFrom, dateTo] as const,
};

export const clockKeys = {
  status: (orgId: string) =>
    ["organizations", orgId, "me", "time", "status"] as const,
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

export const reportKeys = {
  all: (orgId: string, branchId?: string | null) =>
    ["organizations", orgId, "reports", branchId ?? "all"] as const,
  summary: (
    orgId: string,
    type: string,
    params: string,
    branchId?: string | null,
  ) => [...reportKeys.all(orgId, branchId), type, params] as const,
  mechanics: (orgId: string, branchId?: string | null) =>
    [...reportKeys.all(orgId, branchId), "mechanics"] as const,
  insights: (
    orgId: string,
    dateFrom: string,
    dateTo: string,
    branchId?: string | null,
  ) =>
    [...reportKeys.all(orgId, branchId), "insights", dateFrom, dateTo] as const,
  forecast: (
    orgId: string,
    periodType: string,
    date: string,
    branchId?: string | null,
  ) =>
    [...reportKeys.all(orgId, branchId), "forecast", periodType, date] as const,
  targets: (
    orgId: string,
    periodType: string,
    date: string,
    branchId?: string | null,
  ) =>
    [...reportKeys.all(orgId, branchId), "targets", periodType, date] as const,
  retention: (
    orgId: string,
    dateFrom: string,
    dateTo: string,
    branchId?: string | null,
  ) =>
    [
      ...reportKeys.all(orgId, branchId),
      "retention",
      dateFrom,
      dateTo,
    ] as const,
  pnl: (
    orgId: string,
    dateFrom: string,
    dateTo: string,
    branchId?: string | null,
  ) => [...reportKeys.all(orgId, branchId), "pnl", dateFrom, dateTo] as const,
  serviceBreakdown: (
    orgId: string,
    dateFrom: string,
    dateTo: string,
    branchId?: string | null,
  ) =>
    [
      ...reportKeys.all(orgId, branchId),
      "service-breakdown",
      dateFrom,
      dateTo,
    ] as const,
};

export const payrollKeys = {
  all: (orgId: string) => [...orgKeys.detail(orgId), "payroll"] as const,
  payRatesRoot: (orgId: string) =>
    [...payrollKeys.all(orgId), "pay-rates"] as const,
  payRates: (orgId: string, branchId?: string) =>
    [...payrollKeys.payRatesRoot(orgId), branchId ?? "all"] as const,
  recordsRoot: (orgId: string) =>
    [...payrollKeys.all(orgId), "records"] as const,
  recordsPeriod: (orgId: string, year: number, month: number) =>
    [...payrollKeys.recordsRoot(orgId), String(year), String(month)] as const,
  records: (orgId: string, year: number, month: number, branchId?: string) =>
    [
      ...payrollKeys.recordsPeriod(orgId, year, month),
      branchId ?? "all",
    ] as const,
};

export const dashboardKeys = {
  all: (orgId: string, branchId?: string | null) =>
    ["organizations", orgId, "dashboard", branchId ?? "all"] as const,
  summary: (orgId: string, period: string, branchId?: string | null) =>
    [...dashboardKeys.all(orgId, branchId), "summary", period] as const,
};

export const inventoryKeys = {
  all: (orgId: string) => ["organizations", orgId, "inventory"] as const,
  parts: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.all(orgId), "parts", branchId] as const)
      : ([...inventoryKeys.all(orgId), "parts"] as const),
  movements: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.all(orgId), "movements", branchId] as const)
      : ([...inventoryKeys.all(orgId), "movements"] as const),
  suppliers: (orgId: string) =>
    [...inventoryKeys.all(orgId), "suppliers"] as const,
  purchaseOrders: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.all(orgId), "purchase-orders", branchId] as const)
      : ([...inventoryKeys.all(orgId), "purchase-orders"] as const),
  purchaseOrderDetail: (orgId: string, id: string) =>
    [...inventoryKeys.purchaseOrders(orgId), "detail", id] as const,
  purchaseOrderItems: (poId: string) => ["purchase-order-items", poId] as const,
  balances: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.all(orgId), "balances", branchId] as const)
      : ([...inventoryKeys.all(orgId), "balances"] as const),
  thresholds: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.all(orgId), "thresholds", branchId] as const)
      : ([...inventoryKeys.all(orgId), "thresholds"] as const),
  partsCars: (orgId: string) =>
    [...inventoryKeys.all(orgId), "parts-cars"] as const,
  partsCar: (orgId: string, carId: string) =>
    [...inventoryKeys.partsCars(orgId), carId] as const,
  partsCarParts: (orgId: string, carId: string) =>
    [...inventoryKeys.partsCars(orgId), carId, "parts"] as const,
  reports: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.all(orgId), "reports", branchId] as const)
      : ([...inventoryKeys.all(orgId), "reports"] as const),
  turnover: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.reports(orgId, branchId), "turnover"] as const)
      : ([...inventoryKeys.reports(orgId), "turnover"] as const),
  usageTrends: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.reports(orgId, branchId), "usage-trends"] as const)
      : ([...inventoryKeys.reports(orgId), "usage-trends"] as const),
  slowMoving: (orgId: string, branchId?: string | null) =>
    branchId
      ? ([...inventoryKeys.reports(orgId, branchId), "slow-moving"] as const)
      : ([...inventoryKeys.reports(orgId), "slow-moving"] as const),
  categories: (orgId: string) =>
    [...inventoryKeys.all(orgId), "part-categories"] as const,
  transfers: (orgId: string, status?: string | null) =>
    [...inventoryKeys.all(orgId), "transfers", status ?? "all"] as const,
  transferDetail: (orgId: string, id: string) =>
    [...inventoryKeys.all(orgId), "transfers", "detail", id] as const,
  /** Invalidate transfers + balances + movements together */
  transferInvalidations: (orgId: string) =>
    [
      inventoryKeys.transfers(orgId),
      inventoryKeys.balances(orgId),
      inventoryKeys.movements(orgId),
    ] as const,
};

export const serviceReminderKeys = {
  all: (orgId: string) =>
    ["organizations", orgId, "service-reminders"] as const,
  list: (orgId: string, vehicleId?: string, branchId?: string) =>
    [
      ...serviceReminderKeys.all(orgId),
      "list",
      vehicleId ?? "",
      branchId ?? "all",
    ] as const,
  detail: (orgId: string, id: string) =>
    [...serviceReminderKeys.all(orgId), "detail", id] as const,
  logs: (orgId: string, vehicleId?: string, branchId?: string) =>
    [
      ...serviceReminderKeys.all(orgId),
      "logs",
      vehicleId ?? "",
      branchId ?? "all",
    ] as const,
};

export const commissionKeys = {
  all: (orgId: string) => ["commission-rules", orgId] as const,
  list: (orgId: string) => [...commissionKeys.all(orgId), "list"] as const,
};

export const globalCatalogKeys = {
  all: ["global-catalog"] as const,
  services: () => [...globalCatalogKeys.all, "services"] as const,
  parts: () => [...globalCatalogKeys.all, "parts"] as const,
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

export const dayCloseKeys = {
  all: (orgId: string) => ["organizations", orgId, "day-close"] as const,
  status: (orgId: string, date: string) =>
    [...dayCloseKeys.all(orgId), "status", date] as const,
};

export const publicStatsKeys = {
  all: ["public-stats"] as const,
};

export const expenseKeys = {
  all: (orgId: string) => ["organizations", orgId, "expenses"] as const,
  list: (orgId: string, filters?: Record<string, string>) =>
    [
      ...expenseKeys.all(orgId),
      "list",
      stableStringify(filters ?? {}),
    ] as const,
  detail: (orgId: string, id: string) =>
    [...expenseKeys.all(orgId), "detail", id] as const,
  stats: (orgId: string, period?: string) =>
    [...expenseKeys.all(orgId), "stats", period ?? "all"] as const,
  categories: (orgId: string) =>
    [...expenseKeys.all(orgId), "categories"] as const,
};

export const bayViewKeys = {
  all: ["bay-view"] as const,
  data: (branchId: string | undefined) =>
    [...bayViewKeys.all, "data", branchId ?? "all"] as const,
  shiftReport: (branchId: string | undefined) =>
    [...bayViewKeys.all, "shift-report", branchId ?? "all"] as const,
};

export const appointmentKeys = {
  all: (orgId: string) => ["organizations", orgId, "appointments"] as const,
  list: (orgId: string, date: string, branchId?: string | null) =>
    [...appointmentKeys.all(orgId), "list", date, branchId ?? "all"] as const,
};

export const priceRuleKeys = {
  all: (orgId: string) => ["organizations", orgId, "price-rules"] as const,
  list: (orgId: string) => [...priceRuleKeys.all(orgId), "list"] as const,
};

export const catalogVariantKeys = {
  all: (orgId: string) => ["organizations", orgId, "catalog-variants"] as const,
  groups: (orgId: string) =>
    [...catalogVariantKeys.all(orgId), "groups"] as const,
  options: (orgId: string, groupId?: string) =>
    [...catalogVariantKeys.all(orgId), "options", groupId ?? "all"] as const,
  items: (orgId: string, entityType: string, entityId: string) =>
    [...catalogVariantKeys.all(orgId), "items", entityType, entityId] as const,
};

export const cashRegisterKeys = {
  all: (orgId: string) => ["organizations", orgId, "cash-register"] as const,
  current: (orgId: string, branchId?: string | null) =>
    [...cashRegisterKeys.all(orgId), "current", branchId ?? "all"] as const,
  session: (orgId: string, sessionId: string) =>
    [...cashRegisterKeys.all(orgId), "session", sessionId] as const,
  list: (orgId: string, filters?: Record<string, string>) =>
    [
      ...cashRegisterKeys.all(orgId),
      "list",
      stableStringify(filters ?? {}),
    ] as const,
};
