import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getPartVehicleFitment } from "@/lib/services/inventory-service";

export const GET = createRouteHandler(
  async ({ params, supabase, orgId }) => {
    const { partId } = params;
    const fitment = await getPartVehicleFitment(supabase, orgId, partId);
    return ok(fitment);
  },
  { rateLimit: true },
);
