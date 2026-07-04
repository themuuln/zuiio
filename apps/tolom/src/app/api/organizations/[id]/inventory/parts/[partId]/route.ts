import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import {
  deletePart,
  getPart,
  updatePart,
} from "@/lib/services/inventory-service";

export const GET = createRouteHandler(async ({ params, supabase, orgId }) => {
  const { partId } = params;
  const part = await getPart(supabase, partId, orgId);
  return ok(part);
});

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { partId } = params;
    const body = await request.json();
    const part = await updatePart(supabase, partId, orgId, body);
    return ok(part);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const { partId } = params;
    await deletePart(supabase, partId, orgId);
    return ok(null);
  },
  { rateLimit: true, subscription: true },
);
