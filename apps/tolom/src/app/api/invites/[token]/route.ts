import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getInviteByToken } from "@/lib/services/invite-service";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const GET = createSimpleRouteHandler(
  async ({ request }) => {
    const token = request.nextUrl.pathname.split("/").pop() ?? "";
    // Service role: invite lookup must work for logged-out users and
    // non-members — exactly the people invites are sent to. An anon/user
    // client hits organizations RLS on the join and 404s.
    const supabase = await createServiceRoleClient();
    const invite = await getInviteByToken(supabase, token);
    return ok(invite);
  },
  // The invite page renders for logged-out users ("Sign in to accept") —
  // looking up an invite by token is public.
  { requireAuth: false },
);
