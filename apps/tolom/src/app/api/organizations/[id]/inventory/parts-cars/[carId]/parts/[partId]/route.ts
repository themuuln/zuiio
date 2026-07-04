import { noContent } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { removePartsCarPart } from "@/lib/services/parts-cars-service";

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    await removePartsCarPart(supabase, orgId, params.carId, params.partId);
    return noContent();
  },
  { rateLimit: true, subscription: true },
);
