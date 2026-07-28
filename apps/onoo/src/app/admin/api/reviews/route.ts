import { createRouteHandlers } from "@/lib/supabase/admin-route";

const reviewsRoute = createRouteHandlers("product_reviews", {
  select: "*, products:product_id(name)",
});

export const GET = reviewsRoute.list((query) =>
  query.order("created_at", { ascending: false }),
);

export const POST = reviewsRoute.create((body) => {
  const { product_id, author_name, rating, content } = body;
  if (!product_id) return { insert: body, validate: "Бүтээгдэхүүн шаардлагатай" };
  if (!author_name) return { insert: body, validate: "Нэр шаардлагатай" };
  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    return { insert: body, validate: "Үнэлгээ 1-5 байх ёстой" };
  }
  return {
    product_id,
    author_name,
    rating,
    content: content ?? "",
    is_approved: body.is_approved ?? false,
  };
});
