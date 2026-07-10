import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const { data, error } = await supabase
      .from("diagnosis_labels")
      .select(
        "id, organization_id, name, name_mn, color, sort_order, is_active, created_at, updated_at",
      )
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    return ok(data ?? []);
  },
  { requiredPermission: { resource: "diagnosis_labels", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();

    if (!body.name) {
      throw new ValidationError("name is required");
    }

    // Auto-assign next sort_order if not specified
    let sortOrder = body.sort_order;
    if (sortOrder === undefined) {
      const { data: max } = await supabase
        .from("diagnosis_labels")
        .select("sort_order")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();
      sortOrder = (max?.sort_order ?? -1) + 1;
    }

    const { data, error } = await supabase
      .from("diagnosis_labels")
      .insert({
        organization_id: orgId,
        name: body.name,
        name_mn: body.name_mn ?? null,
        color: body.color ?? null,
        sort_order: sortOrder,
        is_active: body.is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return created(data);
  },
  { requiredPermission: { resource: "diagnosis_labels", action: "create" } },
);
