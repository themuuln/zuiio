import { createRouteHandler, ok } from "@/lib/api-response";
import { getWorkOrder } from "@/lib/services/work-order-service";
/**
 * Work order detail endpoint.
 *
 * Returns PER-WORK-ORDER data only (services, parts, history, etc.).
 * Semi-static catalog data (services catalog, parts catalog, mechanics,
 * inventory) has been moved to GET /api/organizations/[id]/catalogs
 * where it can be cached independently with a longer TTL.
 */
export const GET = createRouteHandler(
  async ({ params, orgId, supabase }) => {
    const { workOrderId } = params;

    const workOrder = await getWorkOrder(supabase, workOrderId, orgId);

    return ok({
      workOrder,
    });
  },
  { subscription: true },
);
