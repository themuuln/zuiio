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
}

/**
 * Revalidate reference data caches.
 */
export function invalidateReferenceCache(orgId: string) {
  revalidateTag(cacheTags.serviceCatalog(orgId), "max");
  revalidateTag(cacheTags.branches(orgId), "max");
  revalidateTag(cacheTags.customers(orgId), "max");
  revalidateTag(cacheTags.vehicles(orgId), "max");
}

export { cacheTags };
