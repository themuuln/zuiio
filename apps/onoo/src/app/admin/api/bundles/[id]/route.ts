import { createRouteHandlers } from "@/lib/supabase/admin-route";

const bundles = createRouteHandlers("product_bundles", {
  select: "*",
});

export const GET = bundles.getById();
export const PUT = bundles.update();
export const DELETE = bundles.remove();
