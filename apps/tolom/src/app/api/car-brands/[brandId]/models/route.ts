import { createRouteHandler } from "@/lib/api-handler";
import { ok, created, apiError } from "@/lib/api-response";
import { capture } from "@zuiio/capture";
export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const { brandId } = params;
    const { data, error } = await supabase
      .from("car_models")
      .select(
        "id, name, body_type, fuel_type, transmission, drivetrain, year_start, year_end, engine_options, is_active",
      )
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      capture(error, { context: "car_models list" });
      return apiError("INTERNAL", "Failed to fetch models", 500);
    }

    return ok(data);
  },
  { requireOrg: false },
);
export const POST = createRouteHandler(
  async ({ request, params, supabase }) => {
    const { brandId } = params;
    const body = await request.json();
    const name = body.name?.trim();

    if (!name) {
      return apiError("VALIDATION", "Model name is required", 400);
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("car_models")
      .select("id")
      .eq("brand_id", brandId)
      .ilike("name", name)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return ok(existing);
    }

    const { data, error } = await supabase
      .from("car_models")
      .insert({
        brand_id: brandId,
        name,
        is_active: true,
      })
      .select(
        "id, name, body_type, fuel_type, transmission, drivetrain, year_start, year_end, engine_options, is_active",
      )
      .single();

    if (error) {
      capture(error, { context: "car_models create" });
      return apiError("INTERNAL", "Failed to create model", 500);
    }

    return created(data);
  },
  { requireOrg: false },
);
