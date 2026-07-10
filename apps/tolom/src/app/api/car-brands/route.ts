import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, created, ok } from "@/lib/api-response";

export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("car_brands")
    .select("id, name, country, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return apiError("SERVER_ERROR", error.message, 500);
  }

  return ok(data);
});

export const POST = createSimpleRouteHandler(async ({ request, supabase }) => {
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return apiError("VALIDATION", "Brand name is required", 400);
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("car_brands")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return ok(existing);
  }

  const { data, error } = await supabase
    .from("car_brands")
    .insert({ name, is_active: true })
    .select("id, name, country, is_active")
    .single();

  if (error) {
    return apiError("SERVER_ERROR", error.message, 500);
  }

  return created(data);
});
