import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { getInspection, updateInspection } from "@/lib/services/dvi-service";

/**
 * GET /api/organizations/[id]/dv-inspections/[inspectionId]
 *
 * Returns a single DVI inspection with all its items.
 */
export const GET = createRouteHandler(
  async ({ orgId, supabase, params }) => {
    const { inspectionId } = params;

    if (!inspectionId) {
      return apiError("VALIDATION", "inspectionId is required", 400);
    }

    const result = await getInspection(supabase, inspectionId, orgId);

    return ok(result);
  },
  { requireOrg: true },
);

/**
 * PATCH /api/organizations/[id]/dv-inspections/[inspectionId]
 *
 * Update inspection fields.
 * Body (all optional): { status?, odometer?, fuel_level?, technician_notes? }
 */
export const PATCH = createRouteHandler(
  async ({ request, orgId, user, supabase, params }) => {
    const { inspectionId } = params;

    if (!inspectionId) {
      return apiError("VALIDATION", "inspectionId is required", 400);
    }

    const body = (await request.json()) as {
      status?: string;
      odometer?: number;
      fuel_level?: number;
      technician_notes?: string;
    };

    // Validate at least one field is provided
    if (
      body.status === undefined &&
      body.odometer === undefined &&
      body.fuel_level === undefined &&
      body.technician_notes === undefined
    ) {
      return apiError("VALIDATION", "At least one field must be provided", 400);
    }

    const result = await updateInspection(
      supabase,
      inspectionId,
      orgId,
      user.id,
      body,
    );

    return ok(result);
  },
  { rateLimit: true, requireOrg: true },
);
