import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { sendInspectionToCustomer } from "@/lib/services/dvi-service";

/**
 * POST /api/organizations/[id]/dv-inspections/[inspectionId]/send
 *
 * Send the DVI inspection result to the customer via SMS.
 * Body: { customer_phone: string }
 */
export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase, params }) => {
    const { inspectionId } = params;

    if (!inspectionId) {
      return apiError("VALIDATION", "inspectionId is required", 400);
    }

    const body = (await request.json()) as {
      customer_phone: string;
    };

    // Validation
    if (!body.customer_phone?.trim()) {
      return apiError("VALIDATION", "customer_phone is required", 400);
    }

    const result = await sendInspectionToCustomer(
      supabase,
      inspectionId,
      orgId,
      user.id,
      body.customer_phone,
    );

    return ok(result);
  },
  { rateLimit: true, requireOrg: true },
);
