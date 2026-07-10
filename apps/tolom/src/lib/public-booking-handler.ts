import type { SupabaseClient } from "@supabase/supabase-js";
import { reportServerError } from "@/lib/sentry-report-server";
import { type NextRequest, NextResponse } from "next/server";
import { mutationRateLimiter } from "@/lib/rate-limit";

interface BookingOrg {
  id: string;
  name: string;
  slug: string | null;
}

export interface BookingContext {
  request: NextRequest;
  org: BookingOrg;
  token: string;
  supabase: SupabaseClient;
}

type BookingHandler = (ctx: BookingContext) => Promise<NextResponse>;

/**
 * Creates a handler wrapper for truly public (no-auth) booking endpoints.
 *
 * 1. Rate limits by IP (60 req/min)
 * 2. Resolves organization from booking_token in the URL
 * 3. Creates a service_role Supabase client for unauthenticated DB access
 * 4. Passes org context and supabase client to the handler
 *
 * Follows the pattern established at
 * `src/app/api/invoice/public/[token]/pdf/route.ts:17-24`.
 *
 * Does NOT call supabase.auth.getUser(). Does NOT require any auth.
 */
export function createPublicBookingHandler(handler: BookingHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      // 1. Rate limit by IP — mutationRateLimiter (60 req/60s)
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const rateCheck = await mutationRateLimiter.check(ip);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "Too many requests" } },
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

      // 2. Resolve token from URL params
      const params = await context.params;
      const token = params.token;
      if (!token) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Missing booking token" } },
          { status: 400 },
        );
      }

      // 3. Create service_role client (bypasses RLS — no auth user)
      const { createServiceRoleClient } = await import(
        "@/lib/supabase/service-role"
      );
      const supabase = await createServiceRoleClient();

      // 4. Look up organization by booking_token
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("booking_token", token)
        .is("deleted_at", null)
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Booking link not found or has been deactivated",
            },
          },
          { status: 404 },
        );
      }

      // 5. Call the actual handler with org context + supabase client
      return await handler({ request, org, token, supabase });
    } catch (error) {
    reportServerError("Unexpected error", error);
      const message =
        error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message } },
        { status: 500 },
      );
    }
  };
}
