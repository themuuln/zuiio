import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { publishPartsCarPartsToCatalog } from "@/lib/services/parts-cars-service";

export const POST = createRouteHandler(
  async ({ orgId, user, params, supabase }) => {
    const result = await publishPartsCarPartsToCatalog(
      supabase,
      orgId,
      user.id,
      params.carId,
    );
    return ok(result);
  },
  { rateLimit: true, subscription: true },
);
