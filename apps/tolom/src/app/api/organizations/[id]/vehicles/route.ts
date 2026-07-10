import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import {

  createVehicle,
  getVehicles,
  getVehiclesFast,
  searchByPlate,
} from "@/lib/services/vehicle-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const searchRaw =
    request.nextUrl.searchParams.get("q") ??
    request.nextUrl.searchParams.get("plate") ??
    undefined;
  const search = searchRaw
    ? transliterateMongolianPlate(searchRaw.replace(/[\s-]/g, ""))
    : undefined;
  const customerId = request.nextUrl.searchParams.get("customer") ?? undefined;
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;

  const fast =
    request.nextUrl.searchParams.get("fast") === "true" &&
    !customerId &&
    !branchId &&
    !search;
  if (fast) {
    const vehicles = await getVehiclesFast(supabase, orgId);
    return ok(vehicles);
  }

  const vehicles = search
    ? await searchByPlate(supabase, orgId, search)
    : await getVehicles(supabase, orgId, { customerId, branchId });

  return ok(vehicles);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const vehicle = await createVehicle(supabase, orgId, body, user.id);
    return created(vehicle);
  },
  { rateLimit: true, subscription: true },
);
