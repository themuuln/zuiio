import { revalidateTag } from "next/cache";
import { cacheTags } from "./keys";

/**
 * Revalidate cache for a specific work order and its parent collections.
 */
export function invalidateWorkOrderCache(orgId: string, workOrderId?: string) {
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(
    cacheTags.dailyWorkOrders(orgId, new Date().toISOString().split("T")[0]),
    "max",
  );
  if (workOrderId) {
    revalidateTag(cacheTags.workOrder(workOrderId), "max");
    revalidateTag(cacheTags.workOrderDetail(workOrderId), "max");
  }
}

/**
 * Revalidate all caches for an organization.
 */
export function invalidateOrgCache(orgId: string) {
  revalidateTag(cacheTags.workOrders(orgId), "max");
  revalidateTag(cacheTags.serviceCatalog(orgId), "max");
  revalidateTag(cacheTags.branches(orgId), "max");
  revalidateTag(cacheTags.customers(orgId), "max");
  revalidateTag(cacheTags.vehicles(orgId), "max");
  revalidateTag(cacheTags.reports(orgId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
  revalidateTag(cacheTags.partsCatalog(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  revalidateTag(cacheTags.invoices(orgId), "max");
  revalidateTag(cacheTags.organizationUsers(orgId), "max");
  revalidateTag(cacheTags.vehicleModels(orgId), "max");
  revalidateTag(cacheTags.suppliers(orgId), "max");
  revalidateTag(cacheTags.stockThresholds(orgId), "max");
  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
}

export function invalidateCustomerCache(orgId: string) {
  revalidateTag(cacheTags.customers(orgId), "max");
}

export function invalidateVehicleCache(orgId: string) {
  revalidateTag(cacheTags.vehicles(orgId), "max");
}

export function invalidateServiceCatalogCache(orgId: string) {
  revalidateTag(cacheTags.serviceCatalog(orgId), "max");
}

export function invalidateBranchCache(orgId: string) {
  revalidateTag(cacheTags.branches(orgId), "max");
}

export function invalidateVehicleModelsCache(orgId: string) {
  revalidateTag(cacheTags.vehicleModels(orgId), "max");
}

export function invalidateInventoryCache(orgId: string) {
  revalidateTag(cacheTags.partsCatalog(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  revalidateTag(cacheTags.inventoryMovements(orgId), "max");
  revalidateTag(cacheTags.purchaseOrders(orgId), "max");
  revalidateTag(cacheTags.stockThresholds(orgId), "max");
  revalidateTag(cacheTags.suppliers(orgId), "max");
}

export function invalidateInvoiceCache(orgId: string, invoiceId?: string) {
  revalidateTag(cacheTags.invoices(orgId), "max");
  if (invoiceId) {
    revalidateTag(cacheTags.invoice(invoiceId), "max");
  }
}

export function invalidateReportCache(orgId: string) {
  revalidateTag(cacheTags.reports(orgId), "max");
  revalidateTag(cacheTags.dashboardMetrics(orgId), "max");
}

export function invalidateUserCache(orgId: string) {
  revalidateTag(cacheTags.organizationUsers(orgId), "max");
}

export function invalidateBayViewCache(orgId: string, branchId: string) {
  revalidateTag(cacheTags.bayView(orgId, branchId), "max");
}

/**
 * Revalidate reference data caches.
 */
export function invalidateReferenceCache(orgId: string) {
  revalidateTag(cacheTags.serviceCatalog(orgId), "max");
  revalidateTag(cacheTags.branches(orgId), "max");
  revalidateTag(cacheTags.customers(orgId), "max");
  revalidateTag(cacheTags.vehicles(orgId), "max");
  revalidateTag(cacheTags.vehicleModels(orgId), "max");
  revalidateTag(cacheTags.suppliers(orgId), "max");
}

export { cacheTags };
