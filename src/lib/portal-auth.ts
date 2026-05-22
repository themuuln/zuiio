import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

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
 */
export async function authenticatePortalRequest(
  request: Request,
): Promise<PortalCustomer | null> {
  const auth = request.headers.get("authorization") ?? "";
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);

  if (tokenMatch) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("customers")
      .select("id, organization_id, first_name, last_name, phone, email, portal_token, customer_user_id")
      .eq("portal_token", tokenMatch[1])
      .is("deleted_at", null)
      .maybeSingle();
    return data as PortalCustomer | null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from("customers")
      .select("id, organization_id, first_name, last_name, phone, email, portal_token")
      .eq("customer_user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
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
 */
export function createPortalRouteHandler(handler: PortalRouteHandler) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const customer = await authenticatePortalRequest(request);
      if (!customer) throw new UnauthorizedError();

      const supabase = await createClient();
      const params = context?.params ? await context.params : {};

      return await handler({ request, customer, supabase, params });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
