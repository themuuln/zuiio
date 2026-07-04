import { ok } from "@/lib/api-response";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { getCurrentUserProfile } from "@/lib/services/user-service";
export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const profile = await getCurrentUserProfile(supabase);
  return ok(profile);
});
