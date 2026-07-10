import { ok } from "@/lib/api-response";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export { dynamic } from "@/lib/api-handler";

export const GET = createPortalRouteHandler(async ({ customer }) => {
  return ok(customer);
});
