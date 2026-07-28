import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getCurrentUserProfile } from "@/lib/services/user-service";
export const GET = createSimpleRouteHandler(async ({ supabase, user }) => {
  const profile = await getCurrentUserProfile(supabase, user);
  return ok(profile);
});
