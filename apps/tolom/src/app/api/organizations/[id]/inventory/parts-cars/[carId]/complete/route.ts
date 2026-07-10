import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { completeDisassembly } from "@/lib/services/parts-cars-service";
export const POST = createRouteHandler(
  async ({ orgId, user, params, supabase }) => {
    const car = await completeDisassembly(
      supabase,
      orgId,
      user.id,
      params.carId,
    );
    return ok(car);
  },
  { rateLimit: true, subscription: true },
);
