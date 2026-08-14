import { createRouteHandler } from "@/lib/api-handler";
import { noContent, ok } from "@/lib/api-response";
import {
  deleteVehicleModel,
  updateVehicleModel,
} from "@/lib/services/vehicle-models-service";
export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { modelId } = params;
    const body = await request.json();
    const model = await updateVehicleModel(supabase, modelId, orgId, body);
    return ok(model);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    const { modelId } = params;
    await deleteVehicleModel(supabase, modelId, orgId);
    return noContent();
  },
  { rateLimit: true, subscription: true },
);
