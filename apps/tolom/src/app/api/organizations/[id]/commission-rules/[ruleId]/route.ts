import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { NotFoundError, ValidationError } from "@/lib/errors";
export const GET = createRouteHandler(async ({ params, orgId, supabase }) => {
  const { data, error } = await supabase
    .from("mechanic_commission_rules")
    .select(
      "id, organization_id, mechanic_id, name, commission_type, commission_value, min_commission, max_commission, is_active, priority, created_at, updated_at, deleted_at",
    )
    .eq("id", params.ruleId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error) throw new NotFoundError("Commission rule not found");

  return ok(data);
});

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const body = await request.json();

    const allowedFields = [
      "mechanic_id",
      "name",
      "commission_type",
      "commission_value",
      "min_commission",
      "max_commission",
      "is_active",
      "priority",
    ];

    const validCommissionTypes = new Set([
      "percentage_of_labor",
      "percentage_of_parts",
      "percentage_of_revenue",
      "fixed_per_work_order",
    ]);

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "commission_type") {
          if (!validCommissionTypes.has(body[field])) {
            throw new ValidationError("Invalid commission_type");
          }
        }
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    const { data, error } = await supabase
      .from("mechanic_commission_rules")
      .update(updates)
      .eq("id", params.ruleId)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError("Commission rule not found");

    return ok(data);
  },
);

export const DELETE = createRouteHandler(
  async ({ params, orgId, supabase }) => {
    const { error } = await supabase
      .from("mechanic_commission_rules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.ruleId)
      .eq("organization_id", orgId);

    if (error) throw error;

    return ok({ success: true });
  },
);
