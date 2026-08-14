import type { SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse, UnauthorizedError } from "@/lib/errors";
import { authRateLimiter } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/sentry-report-server";
import { withDbCapture } from "@/lib/supabase/query";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// ── Types ─────────────────────────────────────────────────────

export interface PortalCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  organization_id: string;
  portal_token: string;
  total_visits: number;
  last_visit_at: string | null;
}

/**
 * Authenticates a portal request using either:
 * 1. Authorization: Bearer <portal_token> header (token-based)
 * 2. Supabase auth session (customer logged in via email)
 *
 * Token-based auth uses service_role client to bypass RLS
 * (anonymous users can't query customers table directly).
 * Session-based auth uses the new "customer_user_id = auth.uid()"
 * RLS policies added in 20260731000003 migration.
 */
export async function authenticatePortalRequest(
  request: Request,
): Promise<PortalCustomer | null> {
  const auth = request.headers.get("authorization") ?? "";
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);

  if (tokenMatch) {
    // Token-based auth: use service_role to bypass RLS
    // (anonymous users can't query customers table)
    const serviceRole = await createServiceRoleClient();
    const { data, error } = await withDbCapture(
      "portalAuth_byToken",
      serviceRole
        .from("customers")
        .select(
          "id, organization_id, first_name, last_name, phone, email, portal_token, total_visits, last_visit_at",
        )
        .eq("portal_token", tokenMatch[1])
        .is("deleted_at", null)
        .maybeSingle(),
    );
    if (error) return null;
    return data as PortalCustomer | null;
  }

  // Session-based auth: customer logged in via Supabase Auth
  // RLS policy "Customers can view own record" handles scoping
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data, error } = await withDbCapture(
      "portalAuth_byUser",
      supabase
        .from("customers")
        .select(
          "id, organization_id, first_name, last_name, phone, email, portal_token, total_visits, last_visit_at",
        )
        .eq("customer_user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle(),
    );
    if (error) return null;
    return data as PortalCustomer | null;
  }

  return null;
}

interface PortalHandlerContext {
  request: NextRequest;
  customer: PortalCustomer;
  supabase: SupabaseClient;
  params: Record<string, string>;
}

type PortalRouteHandler = (ctx: PortalHandlerContext) => Promise<NextResponse>;

/**
 * Route handler wrapper for customer portal endpoints.
 * Authenticates via portal token or Supabase session before calling handler.
 *
 * For token-based auth, the supabase client passed to handlers is the regular
 * SSR client (anonymous). Handlers should scope queries using the customer's
 * organization_id from the auth result, NOT rely on get_user_organization_id()
 * which requires organization_users membership.
 */
export function createPortalRouteHandler(handler: PortalRouteHandler) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ) => {
    // Rate limiting: prevent brute force and DoS on portal token endpoints
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = await authRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    try {
      const customer = await authenticatePortalRequest(request);
      if (!customer) throw new UnauthorizedError();

      const supabase = await createClient();
      const params = context?.params ? await context.params : {};

      return await handler({ request, customer, supabase, params });
    } catch (error) {
      reportServerError("Unexpected error", error);
      const { status, body, headers } = toApiErrorResponse(error);
      return NextResponse.json(body, { status, headers });
    }
  };
}
