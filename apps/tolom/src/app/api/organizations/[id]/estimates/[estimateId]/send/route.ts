import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { sendEstimateEmail } from "@/lib/services/email-service";
import {

  getEstimate,
  updateEstimateStatus,
} from "@/lib/services/estimate-service";
/**
 * POST /api/organizations/[id]/estimates/[estimateId]/send
 *
 * Sends the estimate to the customer via email and marks it as "sent".
 */
export const POST = createRouteHandler(
  async ({ params, supabase, orgId }) => {
    const estimate = await getEstimate(supabase, params.estimateId, orgId);
    if (!estimate) {
      return apiError("NOT_FOUND", "Estimate not found", 404);
    }

    if (!estimate.customer?.email) {
      return apiError("NO_EMAIL", "Customer has no email address", 400);
    }
    // Fetch org info
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    const orgName = org?.name ?? "TOLOM";

    // Build public URL
    const publicEstimateUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/estimate/${estimate.public_token}`
      : "";

    // Send email
    await sendEstimateEmail({
      estimate: {
        ...estimate,
        discount_amount: Number(estimate.discount_amount ?? 0),
        discount_percentage: Number(estimate.discount_percentage ?? 0),
        discount_total: Number(estimate.discount_total ?? 0),
        tax_total: Number(estimate.tax_total ?? 0),
        grand_total: Number(estimate.grand_total ?? 0),
        subtotal: Number(estimate.subtotal ?? 0),
        items: (estimate.items ?? []).map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          discount_amount: Number(item.discount_amount ?? 0),
          discount_percentage: Number(item.discount_percentage ?? 0),
          line_total: Number(item.line_total),
        })),
      },
      orgName,
      recipientEmail: estimate.customer.email,
      publicEstimateUrl,
    });

    // Mark as sent if still in draft
    if (estimate.status === "draft") {
      await updateEstimateStatus(supabase, params.estimateId, orgId, "sent");
    }

    return ok({ sent: true });
  },
  { requiredPermission: { resource: "work_orders", action: "update" } },
);
