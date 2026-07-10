import { createRouteHandler, ok } from "@/lib/api-response";
import {
  getOrganization,
  updateOrganization,
} from "@/lib/services/organization-service";

/**
 * GET /api/organizations/[id]
 * Returns a single organization by ID.
 */
export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const org = await getOrganization(supabase, orgId);
  return ok(org);
});

/**
 * PATCH /api/organizations/[id]
 * Updates an organization's name or settings.
 */
export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const org = await updateOrganization(supabase, orgId, body);
    return ok(org);
  },
  { rateLimit: true, subscription: true },
);
