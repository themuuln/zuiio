import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { completeDisassembly } from "@/lib/services/parts-cars-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, params, supabase }) => {
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
