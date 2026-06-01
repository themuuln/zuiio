import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { convertEstimateToWorkOrder } from "@/lib/services/estimate-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

/**
 * POST /api/organizations/[id]/estimates/[estimateId]/convert
 *
 * Converts an approved estimate into a work order.
 * The work order will appear in Bay View and follow the normal WO lifecycle.
 * The estimate is marked as "converted" with a link to the new work order.
 */
export const POST = createRouteHandler(
  async ({ params, orgId }) => {
    await requireActiveSubscription(orgId);
    const workOrder = await convertEstimateToWorkOrder(
      params.estimateId,
      orgId,
    );
    return NextResponse.json({ data: workOrder }, { status: 201 });
  },
  {
    requiredPermission: { resource: "work_orders", action: "create" },
  },
);
