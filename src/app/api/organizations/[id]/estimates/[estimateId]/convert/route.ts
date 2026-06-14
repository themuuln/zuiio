import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { convertEstimateToWorkOrder } from "@/lib/services/estimate-service";

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
    return NextResponse.json({ data: workOrder }, { status: 201 });
  },
  {
    subscription: true,
    requiredPermission: { resource: "work_orders", action: "create" },
  },
);
