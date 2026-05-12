import type { SupabaseClient, User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/errors";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────

interface RouteContext {
  params: Promise<Record<string, string>>;
}

export interface HandlerContext {
  request: NextRequest;
  params: Record<string, string>;
  orgId: string;
  user: User;
  supabase: SupabaseClient;
}

type RouteHandler = (ctx: HandlerContext) => Promise<NextResponse>;

interface RouteHandlerOptions {
  /** If false, orgId won't be extracted (use for non-org routes like /api/profile) */
  requireOrg?: boolean;
}

// ── Route Handler Factory ─────────────────────────────────────

/**
 * Creates a typed Next.js API route handler that:
 *  1. Creates a Supabase client
 *  2. Authenticates the user
 *  3. Extracts orgId from route params
 *  4. Wraps everything in try/catch with consistent error handling
 *
 * Usage:
 * ```ts
 * export const GET = createRouteHandler(async ({ orgId, params, supabase }) => {
 *   const data = await getCustomers(supabase, orgId);
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function createRouteHandler(
  handler: RouteHandler,
  options?: RouteHandlerOptions,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new UnauthorizedError();

      const params = await context.params;
      const orgId = options?.requireOrg === false ? "" : (params.id ?? "");

      return await handler({ request, params, orgId, user, supabase });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ── Simpler variant for routes without org context ──────────────

interface SimpleHandlerContext {
  request: NextRequest;
  user: User;
  supabase: SupabaseClient;
}

type SimpleRouteHandler = (
  ctx: SimpleHandlerContext,
) => Promise<NextResponse>;

/**
 * For routes that don't need orgId extraction (profile, org list, etc.)
 *
 * Usage:
 * ```ts
 * export const GET = createSimpleRouteHandler(async ({ user, supabase }) => {
 *   return NextResponse.json({ data: user });
 * });
 * ```
 */
export function createSimpleRouteHandler(handler: SimpleRouteHandler) {
  return async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new UnauthorizedError();

      return await handler({ request, user, supabase });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
