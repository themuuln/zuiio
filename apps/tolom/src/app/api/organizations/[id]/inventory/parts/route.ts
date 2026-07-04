import { ok, created, apiError } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createPart,
  getPartsCatalog,
  updatePart,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const parts = await getPartsCatalog(supabase, orgId);
    return ok(parts);
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const part = await createPart(supabase, orgId, body, user.id);
    return created(part);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "inventory", action: "create" },
  },
);

export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("partId") ?? searchParams.get("id");
    if (!itemId) {
      return apiError("VALIDATION", "partId required", 400);
    }
    const body = await request.json();
    const part = await updatePart(supabase, itemId, orgId, body);
    return ok(part);
  },
  { rateLimit: true, subscription: true },
);
