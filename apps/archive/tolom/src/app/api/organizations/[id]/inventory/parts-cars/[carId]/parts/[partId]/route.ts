import { createRouteHandler } from "@/lib/api-handler";
import { noContent } from "@/lib/api-response";
import { removePartsCarPart } from "@/lib/services/parts-cars-service";
export const DELETE = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    await removePartsCarPart(supabase, orgId, params.carId, params.partId);
    return noContent();
  },
  { rateLimit: true, subscription: true },
);
