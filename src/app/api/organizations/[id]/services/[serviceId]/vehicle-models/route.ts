import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
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
  return NextResponse.json({ data: rows });
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
      return NextResponse.json(
        { error: { message: "vehicle_model_id is required" } },
        { status: 400 },
      );
    }

    const row = await upsertServiceVehicleModelPrice(
      supabase,
      orgId,
      serviceId,
      body.vehicle_model_id,
      body.specific_price != null ? Number(body.specific_price) : null,
    );

    return NextResponse.json({ data: row }, { status: 201 });
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
      return NextResponse.json(
        { error: { message: "vehicle_model_id is required" } },
        { status: 400 },
      );
    }

    await deleteServiceVehicleModelPrice(
      supabase,
      orgId,
      serviceId,
      body.vehicle_model_id,
    );

    return NextResponse.json({ data: null });
  },
  { rateLimit: true, subscription: true },
);
