import { createRouteHandlers } from "@/lib/supabase/admin-route";

const reviews = createRouteHandlers("product_reviews", {
  select: "*, products:product_id(name)",
});

export const GET = reviews.getById();
export const PUT = reviews.update();
export const DELETE = reviews.remove();
