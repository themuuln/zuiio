import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { ForbiddenError } from "@/lib/errors";
import {

  checkSuperAdmin,
  listOrganizations,
} from "@/lib/services/admin-service";
export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (!isSuperAdmin) throw new ForbiddenError();

  const orgs = await listOrganizations(supabase);
  return ok(orgs);
});
