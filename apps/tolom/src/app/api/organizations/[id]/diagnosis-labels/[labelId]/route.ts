import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { NotFoundError, ValidationError } from "@/lib/errors";

export { dynamic } from "@/lib/api-handler";

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const body = await request.json();

    const allowedFields = [
      "name",
      "name_mn",
      "color",
      "sort_order",
      "is_active",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    const { data, error } = await supabase
      .from("diagnosis_labels")
      .update(updates)
      .eq("id", params.labelId)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError("Diagnosis label not found");

    return ok(data);
  },
);

export const DELETE = createRouteHandler(
  async ({ params, orgId, supabase }) => {
    const { error } = await supabase
      .from("diagnosis_labels")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.labelId)
      .eq("organization_id", orgId);

    if (error) throw error;

    return ok({ success: true });
  },
);
