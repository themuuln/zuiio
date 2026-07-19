import { createRouteHandler } from "@/lib/api-handler";
import { noContent, ok } from "@/lib/api-response";
import {

  deletePartsCar,
  getPartsCar,
  updatePartsCar,
} from "@/lib/services/parts-cars-service";
export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
  const car = await getPartsCar(supabase, orgId, params.carId);
  return ok(car);
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const body = await request.json();
    const car = await updatePartsCar(supabase, orgId, params.carId, body);
    return ok(car);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ orgId, params, supabase }) => {
    await deletePartsCar(supabase, orgId, params.carId);
    return noContent();
  },
  { rateLimit: true, subscription: true },
);
