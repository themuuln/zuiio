import crypto from "node:crypto";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { submitCustomerApproval } from "@/lib/services/dvi-service";

/**
 * Public POST endpoint — customer approves or declines inspection items.
 * No auth required — the token serves as the access credential.
 *
 * Body: { item_ids: string[], approved: boolean }
 */
export const POST = createSimpleRouteHandler(
  async ({ request, supabase }) => {
    const segments = request.nextUrl.pathname.split("/");
    const token = segments[segments.length - 2] ?? "";

    if (!token) {
      return apiError("MISSING_TOKEN", "Inspection token is required", 400);
    }

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

    const hash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the inspection by token hash (public, no org scope)
    // The supabase client is untyped here, so table access is accepted
    const { data: raw, error: inspError } = await supabase
      .from("digital_vehicle_inspections")
      .select("id, customer_viewed_at")
      .eq("customer_token_hash", hash)
      .single();

    if (inspError || !raw) {
      return apiError("NOT_FOUND", "Inspection not found or has expired", 404);
    }

    // Narrow raw response using type guard before accessing properties
    if (
      typeof raw !== "object" ||
      raw === null ||
      !("id" in raw) ||
      typeof raw.id !== "string"
    ) {
      return apiError("INVALID_DATA", "Unexpected inspection data format", 500);
    }

    const inspectionId: string = raw.id;
    const hasCustomerViewedAt =
      "customer_viewed_at" in raw &&
      raw.customer_viewed_at !== null &&
      typeof raw.customer_viewed_at === "string";

    // Mark customer_viewed_at on first view
    if (!hasCustomerViewedAt) {
      await supabase
        .from("digital_vehicle_inspections")
        .update({ customer_viewed_at: new Date().toISOString() })
        .eq("id", inspectionId);
    }

    // Submit customer approval via service function (it handles item updates)
    const result = await submitCustomerApproval(supabase, token, {
      item_ids: body.item_ids,
      approved: body.approved,
    });

    // Update customer_decision_at timestamp
    await supabase
      .from("digital_vehicle_inspections")
      .update({ customer_decision_at: new Date().toISOString() })
      .eq("id", inspectionId);

    return ok({
      status: result.status,
      approved_count: result.approved_count,
      declined_count: result.declined_count,
    });
  },
  { requireAuth: false, rateLimit: true },
);
