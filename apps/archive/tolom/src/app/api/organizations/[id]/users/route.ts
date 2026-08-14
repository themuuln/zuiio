import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import { createInvite } from "@/lib/services/invite-service";
import { getOrganizationUsers, removeUser } from "@/lib/services/user-service";
export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const users = await getOrganizationUsers(supabase, orgId);
  return ok(users);
});

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();
    const invite = await createInvite(supabase, orgId, body, user.id);
    return created(invite);
  },
  { rateLimit: true, subscription: true },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    await removeUser(supabase, body.userId, orgId);
    return ok({ success: true });
  },
  { rateLimit: true, subscription: true },
);
