import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {

  createPartsCar,
  getPartsCars,
} from "@/lib/services/parts-cars-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const cars = await getPartsCars(supabase, orgId);
  return ok(cars);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const car = await createPartsCar(supabase, orgId, user.id, body);
    return created(car);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);
