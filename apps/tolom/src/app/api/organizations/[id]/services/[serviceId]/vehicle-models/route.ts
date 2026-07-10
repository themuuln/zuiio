import { createRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";
import {

  deleteServiceVehicleModelPrice,
  getServiceVehicleModels,
  upsertServiceVehicleModelPrice,
} from "@/lib/services/service-catalog-service";
/**
 * GET /api/organizations/:id/services/:serviceId/vehicle-models
 * Returns all vehicle model service pricing entries for this service.
 */
export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { serviceId } = params;
  const rows = await getServiceVehicleModels(supabase, orgId, serviceId);
  return ok(rows);
});

/**
 * POST /api/organizations/:id/services/:serviceId/vehicle-models
 * Upsert a specific_price for a service + vehicle_model combination.
 * Body: { vehicle_model_id: string, specific_price: number | null }
 */
export const POST = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { serviceId } = params;
    const body = await request.json();

    if (!body.vehicle_model_id) {
      return apiError("BAD_REQUEST", "vehicle_model_id is required", 400);
    }

    const row = await upsertServiceVehicleModelPrice(
      supabase,
      orgId,
      serviceId,
      body.vehicle_model_id,
      body.specific_price != null ? Number(body.specific_price) : null,
    );

    return created(row);
  },
  { rateLimit: true, subscription: true },
);

/**
 * DELETE /api/organizations/:id/services/:serviceId/vehicle-models
 * Remove a specific price entry.
 * Body: { vehicle_model_id: string }
 */
export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { serviceId } = params;
    const body = await request.json();

    if (!body.vehicle_model_id) {
      return apiError("BAD_REQUEST", "vehicle_model_id is required", 400);
    }

    await deleteServiceVehicleModelPrice(
      supabase,
      orgId,
      serviceId,
      body.vehicle_model_id,
    );

    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
