import { ok, created } from "@/lib/api-response";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import {
  createOrganization,
  getUserOrganization,
} from "@/lib/services/organization-service";

export const GET = createSimpleRouteHandler(async ({ user, supabase }) => {
  const org = await getUserOrganization(supabase, user.id);
  return ok(org);
});

export const POST = createSimpleRouteHandler(
  async ({ request, user, supabase }) => {
    const body = await request.json();
    const { name, slug } = body;
    const org = await createOrganization(supabase, { name, slug }, user.id);
    return created(org);
  },
  { rateLimit: true },
);
