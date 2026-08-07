import { createRouteHandlers } from "@/lib/supabase/admin-route";

const products = createRouteHandlers("products", {
  select: "*",
});

export const GET = products.getById();
export const PUT = products.update();
export const DELETE = products.remove();
