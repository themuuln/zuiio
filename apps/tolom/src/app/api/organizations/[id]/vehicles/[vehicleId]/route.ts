import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import {
  deleteVehicle,
  getVehicle,
  getVehicleServiceHistory,
  updateVehicle,
} from "@/lib/services/vehicle-service";

export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const { vehicleId } = params;
  const [vehicle, serviceHistory] = await Promise.all([
    getVehicle(supabase, vehicleId, orgId),
    getVehicleServiceHistory(supabase, orgId, vehicleId),
  ]);
  return ok({ ...vehicle, service_history: serviceHistory });
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user, supabase }) => {
    const { vehicleId } = params;
    const body = await request.json();
    const vehicle = await updateVehicle(
      supabase,
      vehicleId,
      orgId,
      body,
      user.id,
    );
    return ok(vehicle);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ orgId, params, user, supabase }) => {
    const { vehicleId } = params;
    await deleteVehicle(supabase, vehicleId, orgId, user.id);
    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
