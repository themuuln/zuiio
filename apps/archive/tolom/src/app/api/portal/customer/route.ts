import { ok } from "@/lib/api-response";
import { createPortalRouteHandler } from "@/lib/portal-auth";
export const GET = createPortalRouteHandler(async ({ customer }) => {
  return ok(customer);
});
