import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getServiceVehicleModels,
  upsertServiceVehicleModelPrice,
  deleteServiceVehicleModelPrice,
} from "@/lib/services/service-catalog-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

/**
 * GET /api/organizations/:id/services/:serviceId/vehicle-models
 * Returns all vehicle model service pricing entries for this service.
 */
export const GET = createRouteHandler(async ({ orgId, params }) => {
  const { serviceId } = params;
  const rows = await getServiceVehicleModels(orgId, serviceId);
  return NextResponse.json({ data: rows });
});

/**
 * POST /api/organizations/:id/services/:serviceId/vehicle-models
 * Upsert a specific_price for a service + vehicle_model combination.
 * Body: { vehicle_model_id: string, specific_price: number | null }
 */
export const POST = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  const { serviceId } = params;
  const body = await request.json();

  if (!body.vehicle_model_id) {
    return NextResponse.json(
      { error: { message: "vehicle_model_id is required" } },
      { status: 400 },
    );
  }

  const row = await upsertServiceVehicleModelPrice(
    orgId,
    serviceId,
    body.vehicle_model_id,
    body.specific_price != null ? Number(body.specific_price) : null,
  );

  return NextResponse.json({ data: row }, { status: 201 });
});

/**
 * DELETE /api/organizations/:id/services/:serviceId/vehicle-models
 * Remove a specific price entry.
 * Body: { vehicle_model_id: string }
 */
export const DELETE = createRouteHandler(async ({ request, orgId, params }) => {
  await requireActiveSubscription(orgId);

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  const { serviceId } = params;
  const body = await request.json();

  if (!body.vehicle_model_id) {
    return NextResponse.json(
      { error: { message: "vehicle_model_id is required" } },
      { status: 400 },
    );
  }

  await deleteServiceVehicleModelPrice(orgId, serviceId, body.vehicle_model_id);

  return NextResponse.json({ data: null });
});
