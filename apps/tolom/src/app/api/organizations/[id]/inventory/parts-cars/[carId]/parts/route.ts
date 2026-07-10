import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {

  addPartsCarPart,
  getPartsCarParts,
} from "@/lib/services/parts-cars-service";
export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const parts = await getPartsCarParts(supabase, orgId, params.carId);
  return ok(parts);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, params, supabase }) => {
    const body = await request.json();
    const part = await addPartsCarPart(
      supabase,
      orgId,
      user.id,
      params.carId,
      body,
    );
    return created(part);
  },
  { rateLimit: true, subscription: true },
);
