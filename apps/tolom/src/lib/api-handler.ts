import type { SupabaseClient, User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import {
  ForbiddenError,
  toApiErrorResponse,
  UnauthorizedError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import {
  type PermissionAction,
  requirePermission,
  requireRole,
} from "@/lib/supabase/role-guard";
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
  /** Minimum role level required for this route */
  minimumRole?: "Org Owner" | "Manager" | "Mechanic" | "Guest";
  /** Specific permission required for this route (checked after minimumRole) */
  requiredPermission?: { resource: string; action: PermissionAction };
  /** Apply mutation rate limiting (60 req/min) to this route */
  rateLimit?: boolean;
  /** Require an active subscription for this route */
  subscription?: boolean;
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
    const start = performance.now();

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new UnauthorizedError();

      const params = await context.params;
      const orgId = options?.requireOrg === false ? "" : (params.id ?? "");

      // Verify org membership when orgId is present
      if (orgId) {
        const { data: membership } = await supabase
          .from("organization_users")
          .select("organization_id")
          .eq("user_id", user.id)
          .eq("organization_id", orgId)
          .is("removed_at", null)
          .maybeSingle();

        if (!membership) {
          throw new ForbiddenError("Not a member of this organization");
        }
      }

      // Check role requirements
      if (options?.minimumRole) {
        await requireRole(options.minimumRole);
      }

      // Check specific permission requirements
      if (options?.requiredPermission) {
        await requirePermission(
          options.requiredPermission.resource,
          options.requiredPermission.action,
          orgId,
        );
      }

      // Apply mutation rate limiting
      if (options?.rateLimit) {
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
      }

      // Check active subscription
      if (options?.subscription && orgId) {
        await requireActiveSubscription(orgId);
      }

      const response = await handler({
        request,
        params,
        orgId,
        user,
        supabase,
      });

      const duration = Math.round(performance.now() - start);
      logger.info(
        {
          method: request.method,
          path: request.nextUrl.pathname,
          status: response.status,
          duration,
          userId: user.id,
          orgId: orgId || undefined,
        },
        "API request completed",
      );

      return response;
    } catch (error) {
      const { status, body, headers } = toApiErrorResponse(error);
      const duration = Math.round(performance.now() - start);
      logger.error(
        {
          method: request.method,
          path: request.nextUrl.pathname,
          status,
          duration,
          err: error,
        },
        "API request failed",
      );
      const authHeaders = new Headers(headers);
      if (status === 401) {
        authHeaders.set("X-Auth-Required", "true");
      }
      return NextResponse.json(body, { status, headers: authHeaders });
    }
  };
}

// ── Simpler variant for routes without org context ──────────────

interface SimpleHandlerContext {
  request: NextRequest;
  user: User;
  supabase: SupabaseClient;
}

type SimpleRouteHandler = (ctx: SimpleHandlerContext) => Promise<NextResponse>;

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
    const start = performance.now();

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new UnauthorizedError();

      const response = await handler({ request, user, supabase });

      const duration = Math.round(performance.now() - start);
      logger.info(
        {
          method: request.method,
          path: request.nextUrl.pathname,
          status: response.status,
          duration,
          userId: user.id,
        },
        "Simple API request completed",
      );

      return response;
    } catch (error) {
      const { status, body, headers } = toApiErrorResponse(error);
      const duration = Math.round(performance.now() - start);
      logger.error(
        {
          method: request.method,
          path: request.nextUrl.pathname,
          status,
          duration,
          err: error,
        },
        "Simple API request failed",
      );
      const authHeaders = new Headers(headers);
      if (status === 401) {
        authHeaders.set("X-Auth-Required", "true");
      }
      return NextResponse.json(body, { status, headers: authHeaders });
    }
  };
}
