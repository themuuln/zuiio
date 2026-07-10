import { createRouteHandler } from "@/lib/api-handler";
import { created } from "@/lib/api-response";
import { convertEstimateToWorkOrder } from "@/lib/services/estimate-service";

export { dynamic } from "@/lib/api-handler";

/**
 * POST /api/organizations/[id]/estimates/[estimateId]/convert
 *
 * Converts an approved estimate into a work order.
 * The work order will appear in Bay View and follow the normal WO lifecycle.
 * The estimate is marked as "converted" with a link to the new work order.
 */
export const POST = createRouteHandler(
  async ({ params, orgId, supabase }) => {
    const workOrder = await convertEstimateToWorkOrder(
      supabase,
      params.estimateId,
      orgId,
    );
    return created(workOrder);
  },
  {
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "create" },
  },
);
