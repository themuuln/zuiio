import crypto from "node:crypto";
import { createRouteHandler, ok } from "@/lib/api-response";
import { getCustomer } from "@/lib/services/customer-service";

/**
 * POST /api/organizations/[id]/customers/[customerId]/portal-access
 *
 * Generates or retrieves portal access credentials for a customer.
 * If the customer already has a portal_token, returns the existing one.
 * Returns the portal login URL for the shop to share with the customer.
 */
export const POST = createRouteHandler(
  async ({ supabase, orgId, params }) => {
    const { customerId } = params;

    // Verify the customer exists in this org
    const customer = await getCustomer(supabase, customerId, orgId);

    // Check if the customer already has a portal_token
    let portalToken = customer.portal_token;

    if (!portalToken) {
      // Generate a new portal token
      portalToken = crypto.randomBytes(32).toString("hex");

      const { error: updateError } = await supabase
        .from("customers")
        .update({ portal_token: portalToken })
        .eq("id", customerId)
        .eq("organization_id", orgId);

      if (updateError) {
        throw updateError;
      }
    }

    // Build the portal URL
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.VERCEL_URL ??
      "http://localhost:3000";
    const loginUrl = `${origin}/auth/customer/set-password?token=${portalToken}`;

    return ok({
      portal_token: portalToken,
      login_url: loginUrl,
      has_existing_account: !!customer.customer_user_id,
      customer: {
        id: customer.id,
        name: customer.full_name ?? customer.first_name ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
      },
    });
  },
  { rateLimit: true },
);
