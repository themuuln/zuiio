import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {

  createService,
  getServices,
} from "@/lib/services/service-catalog-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const services = await getServices(supabase, orgId, category);
    return ok(services);
  },
  { requiredPermission: { resource: "services", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const service = await createService(supabase, orgId, body);
    return created(service);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "services", action: "create" },
  },
);
