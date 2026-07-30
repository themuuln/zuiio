import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { convertInspectionToWorkOrder } from "@/lib/services/dvi-service";

/**
 * POST /api/organizations/[id]/dv-inspections/[inspectionId]/convert
 *
 * Convert approved inspection items into a work order.
 * Creates a new work order (status='pending') with line items from
 * all items in the inspection that have status='approved'.
 */
export const POST = createRouteHandler(
  async ({ orgId, user, supabase, params }) => {
    const { inspectionId } = params;

    if (!inspectionId) {
      return apiError("VALIDATION", "inspectionId is required", 400);
    }

    const result = await convertInspectionToWorkOrder(
      supabase,
      inspectionId,
      orgId,
      user.id,
    );

    return ok(result);
  },
  { rateLimit: true, requireOrg: true },
);
