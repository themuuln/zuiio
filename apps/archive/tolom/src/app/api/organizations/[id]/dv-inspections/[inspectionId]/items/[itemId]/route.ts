import { createRouteHandler } from "@/lib/api-handler";
import { apiError, noContent, ok } from "@/lib/api-response";
import {
  removeInspectionItem,
  updateInspectionItem,
} from "@/lib/services/dvi-service";

/**
 * PATCH /api/organizations/[id]/dv-inspections/[inspectionId]/items/[itemId]
 *
 * Update an inspection item.
 * Body (all optional): { category_id?, part_id?, description?, status?, images?, notes? }
 */
export const PATCH = createRouteHandler(
  async ({ request, orgId, user, supabase, params }) => {
    const { inspectionId, itemId } = params;

    if (!inspectionId) {
      return apiError("VALIDATION", "inspectionId is required", 400);
    }
    if (!itemId) {
      return apiError("VALIDATION", "itemId is required", 400);
    }

    const body = (await request.json()) as {
      category_id?: string;
      part_id?: string | null;
      description?: string;
      status?: string;
      images?: string[];
      notes?: string | null;
    };

    // Validate at least one field is provided
    if (Object.keys(body).length === 0) {
      return apiError("VALIDATION", "At least one field must be provided", 400);
    }

    const result = await updateInspectionItem(
      supabase,
      inspectionId,
      itemId,
      orgId,
      user.id,
      body,
    );

    return ok(result);
  },
  { rateLimit: true, requireOrg: true },
);

/**
 * DELETE /api/organizations/[id]/dv-inspections/[inspectionId]/items/[itemId]
 *
 * Remove an item from an inspection.
 */
export const DELETE = createRouteHandler(
  async ({ orgId, supabase, params }) => {
    const { inspectionId, itemId } = params;

    if (!inspectionId) {
      return apiError("VALIDATION", "inspectionId is required", 400);
    }
    if (!itemId) {
      return apiError("VALIDATION", "itemId is required", 400);
    }

    await removeInspectionItem(supabase, inspectionId, itemId, orgId);

    return noContent();
  },
  { rateLimit: true, requireOrg: true },
);
