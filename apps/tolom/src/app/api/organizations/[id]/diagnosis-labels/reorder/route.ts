import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
export const PATCH = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError("updates array is required");
    }

    for (const item of updates) {
      if (!item.id || typeof item.sort_order !== "number") {
        throw new ValidationError("Each update must have id and sort_order");
      }
    }

    const promises = updates.map((item: { id: string; sort_order: number }) =>
      supabase
        .from("diagnosis_labels")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id)
        .eq("organization_id", orgId),
    );

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({ success: true });
  },
);
