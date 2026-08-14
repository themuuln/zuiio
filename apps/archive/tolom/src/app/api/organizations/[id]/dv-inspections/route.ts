import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import { createInspection, getInspections } from "@/lib/services/dvi-service";

/**
 * GET /api/organizations/[id]/dv-inspections
 *
 * List DVI inspections for the org.
 * Supports ?status= draft|pending_approval|approved|rejected filter
 * Supports ?vehicle_id= filter
 * Supports ?limit= (default 50) and ?offset= (default 0) pagination
 */
export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const url = request.nextUrl;
    const status = url.searchParams.get("status") ?? undefined;
    const vehicleId = url.searchParams.get("vehicle_id") ?? undefined;
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    const result = await getInspections(supabase, orgId, {
      status,
      vehicleId,
      limit,
      offset,
    });

    return ok(result);
  },
  { requireOrg: true },
);

/**
 * POST /api/organizations/[id]/dv-inspections
 *
 * Create a new DVI inspection.
 * Body: { vehicle_id, odometer?, fuel_level?, technician_notes? }
 */
export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = (await request.json()) as {
      vehicle_id: string;
      odometer?: number;
      fuel_level?: number;
      technician_notes?: string;
    };

    // Validation
    if (!body.vehicle_id?.trim()) {
      return apiError("VALIDATION", "vehicle_id is required", 400);
    }

    const result = await createInspection(supabase, orgId, user.id, {
      vehicle_id: body.vehicle_id,
      odometer: body.odometer,
      fuel_level: body.fuel_level,
      technician_notes: body.technician_notes,
    });

    return created(result);
  },
  { rateLimit: true, requireOrg: true },
);
