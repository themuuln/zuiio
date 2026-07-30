import { apiError, ok } from "@/lib/api-response";
import { createPortalRouteHandler } from "@/lib/portal-auth";

export const POST = createPortalRouteHandler(
  async ({ request, customer, supabase, params }) => {
    const inspectionId = params.id;

    // ── Parse and validate request body ──────────────────────

    let body: { item_ids: string[]; approved: boolean };
    try {
      body = await request.json();
    } catch {
      return apiError("INVALID_BODY", "Invalid JSON body", 400);
    }

    if (
      !Array.isArray(body.item_ids) ||
      body.item_ids.length === 0 ||
      typeof body.approved !== "boolean"
    ) {
      return apiError(
        "INVALID_PARAMS",
        "item_ids (non-empty array) and approved (boolean) are required",
        400,
      );
    }

    // ── Verify inspection belongs to customer's vehicle ──────

    const { data: ownerships } = await supabase
      .from("vehicle_owners")
      .select("vehicle_id, owned_until, is_primary")
      .eq("customer_id", customer.id);

    const vehicleIds = new Set(
      (ownerships ?? [])
        .filter((o) => o.owned_until === null || o.is_primary === true)
        .map((o) => o.vehicle_id),
    );

    const { data: inspection, error: inspError } = await supabase
      .from("digital_vehicle_inspections")
      .select("id, vehicle_id")
      .eq("id", inspectionId)
      .single();

    if (inspError || !inspection) {
      return apiError("NOT_FOUND", "Inspection not found", 404);
    }

    if (!vehicleIds.has(inspection.vehicle_id)) {
      return apiError("NOT_FOUND", "Inspection not found", 404);
    }

    // ── Mark customer_viewed_at on first view ────────────────

    await supabase
      .from("digital_vehicle_inspections")
      .update({ customer_viewed_at: new Date().toISOString() })
      .eq("id", inspectionId);

    // ── Update specified items ───────────────────────────────

    const { error: updateError } = await supabase
      .from("dvi_inspection_items")
      .update({ customer_approved: body.approved })
      .eq("inspection_id", inspectionId)
      .in("id", body.item_ids);

    if (updateError) throw updateError;

    // ── Determine new inspection status from item state ──────

    const { data: allItems, error: countError } = await supabase
      .from("dvi_inspection_items")
      .select("customer_approved")
      .eq("inspection_id", inspectionId);

    if (countError) throw countError;

    const approvedCount =
      allItems?.filter((i) => i.customer_approved === true).length ?? 0;
    const declinedCount =
      allItems?.filter((i) => i.customer_approved === false).length ?? 0;
    const unsetCount =
      allItems?.filter((i) => i.customer_approved === null).length ?? 0;

    let newStatus: string;
    if (approvedCount > 0 && declinedCount === 0 && unsetCount === 0) {
      newStatus = "approved";
    } else if (declinedCount > 0 && approvedCount === 0 && unsetCount === 0) {
      newStatus = "declined";
    } else {
      newStatus = "partially_approved";
    }

    // ── Update inspection status ─────────────────────────────

    await supabase
      .from("digital_vehicle_inspections")
      .update({
        status: newStatus,
        customer_decision_at: new Date().toISOString(),
      })
      .eq("id", inspectionId);

    return ok({
      updated_count: body.item_ids.length,
      status: newStatus,
    });
  },
);
