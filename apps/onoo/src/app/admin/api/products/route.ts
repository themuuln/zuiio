import { createRouteHandlers } from "@/lib/supabase/admin-route";

const productsRoute = createRouteHandlers("products", {
  select: "*",
});

export const GET = productsRoute.list();

export const POST = productsRoute.create((body) => {
  const { name, slug, price_mnt } = body;
  if (!name) return { insert: body, validate: "name is required" };
  if (!slug) return { insert: body, validate: "slug is required" };
  if (!price_mnt || typeof price_mnt !== "number" || price_mnt <= 0) {
    return { insert: body, validate: "price_mnt must be a positive number" };
  }
  return {
    name,
    slug,
    price_mnt,
    name_en: body.name_en ?? null,
    description: body.description ?? null,
    images: body.images ?? [],
    category: body.category ?? null,
    variants: body.variants ?? [],
    is_available: body.is_available ?? true,
  };
});
