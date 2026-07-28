import { createRouteHandlers } from "@/lib/supabase/admin-route";

const bundlesRoute = createRouteHandlers("product_bundles", {
  select: "*",
});

export const GET = bundlesRoute.list((query) =>
  query.order("created_at", { ascending: false }),
);

export const POST = bundlesRoute.create((body) => {
  const { name, discount_percent } = body;
  if (!name) return { insert: body, validate: "Нэр шаардлагатай" };
  if (discount_percent == null || typeof discount_percent !== "number") {
    return { insert: body, validate: "Хямдрал шаардлагатай" };
  }
  return {
    name,
    description: body.description ?? null,
    discount_percent,
    is_active: body.is_active ?? true,
  };
});
