import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created } from "@/lib/api-response";
import { addInspectionItem } from "@/lib/services/dvi-service";
import type { AddDVIItemParams } from "@/lib/services/dvi-service";

/**
 * POST /api/organizations/[id]/dv-inspections/[inspectionId]/items
 *
 * Add an item to a DVI inspection.
 * Body: { category, item_name, condition?, measurement_value?, ... }
 */
export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase, params }) => {
    const { inspectionId } = params;

    if (!inspectionId) {
      return apiError("VALIDATION", "inspectionId is required", 400);
    }

    const body = (await request.json()) as AddDVIItemParams;

    // Validation
    if (!body.category?.trim()) {
      return apiError("VALIDATION", "category is required", 400);
    }
    if (!body.item_name?.trim()) {
      return apiError("VALIDATION", "item_name is required", 400);
    }

    const result = await addInspectionItem(
      supabase,
      inspectionId,
      orgId,
      user.id,
      body,
    );

    return created(result);
  },
  { rateLimit: true, requireOrg: true },
);
