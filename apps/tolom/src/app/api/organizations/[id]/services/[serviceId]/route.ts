import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deleteService,
  getService,
  updateService,
} from "@/lib/services/service-catalog-service";

export const GET = createRouteHandler(async ({ params, supabase }) => {
  const { serviceId } = params;
  const service = await getService(supabase, serviceId);
  return ok(service);
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { serviceId } = params;
    const body = await request.json();
    const service = await updateService(supabase, serviceId, orgId, body);
    return ok(service);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { serviceId } = params;
    await deleteService(supabase, serviceId, orgId);
    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
