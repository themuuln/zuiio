import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {
  createVehicleModel,
  getDistinctMakes,
  getVehicleModels,
} from "@/lib/services/vehicle-models-service";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const make = request.nextUrl.searchParams.get("make") ?? undefined;
  const mode = request.nextUrl.searchParams.get("mode");

  if (mode === "makes") {
    const makes = await getDistinctMakes(supabase, orgId);
    return ok(makes);
  }

  const models = make
    ? (await getVehicleModels(supabase, orgId)).filter(
        (m) => m.make.toLowerCase() === make.toLowerCase(),
      )
    : await getVehicleModels(supabase, orgId);
  return ok(models);
});

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const model = await createVehicleModel(supabase, orgId, body);
    return created(model);
  },
  { rateLimit: true, subscription: true },
);
