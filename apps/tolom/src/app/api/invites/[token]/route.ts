import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getInviteByToken } from "@/lib/services/invite-service";

export const GET = createSimpleRouteHandler(async ({ request, supabase }) => {
  const token = request.nextUrl.pathname.split("/").pop() ?? "";
  const invite = await getInviteByToken(supabase, token);
  return ok(invite);
});
