import type { SupabaseClient, User } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import {
  ForbiddenError,
  toApiErrorResponse,
  UnauthorizedError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/sentry-report-server";
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

interface SimpleHandlerContext {
  request: NextRequest;
  user: User;
  supabase: SupabaseClient;
}

type SimpleRouteHandler = (ctx: SimpleHandlerContext) => Promise<NextResponse>;

interface SimpleHandlerOptions {
  /** Apply mutation rate limiting (60 req/min) to this route */
  rateLimit?: boolean;

  /** Require authentication (default true). Set false for truly public routes. */
  requireAuth?: boolean;
}

// ── Shared error handling ──────────────────────────────────────

function handleError(
  error: unknown,
  start: number,
  method: string,
  path: string,
  orgId?: string,
) {
  const { status, body, headers } = toApiErrorResponse(error);
  const duration = Math.round(performance.now() - start);

  logger.error(
    { method, path, status, duration, err: error },
    "API request failed",
  );

  if (status >= 500) {
    capture(error, {
      context: `[api] ${method} ${path}`,
      method,
      path,
      status,
      orgId,
    });
  }

  const authHeaders = new Headers(headers);
  if (status === 401) {
    authHeaders.set("X-Auth-Required", "true");
  }
  return NextResponse.json(body, { status, headers: authHeaders });
}

// ── Route Handler Factory ─────────────────────────────────────

/**
 * Creates a typed Next.js API route handler that:
 *  1. Creates a Supabase client
 *  2. Authenticates the user
 *  3. Extracts orgId from route params
 *  4. Wraps everything in try/catch with consistent error handling
 */
export function createRouteHandler(
  handler: RouteHandler,
  options?: RouteHandlerOptions,
) {
  return async (request: NextRequest, context: RouteContext) => {
    const start = performance.now();
    const method = request.method;
    const path = request.nextUrl.pathname;
    let orgId = "";

    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError) {
        capture(getUserError, { method, path });
      }

      if (!user) throw new UnauthorizedError();

      const params = await context.params;
      orgId = options?.requireOrg === false ? "" : (params.id ?? "");

      if (orgId) {
        const { data: membership, error: membershipError } = await supabase
          .from("organization_users")
          .select("organization_id")
          .eq("user_id", user.id)
          .eq("organization_id", orgId)
          .is("removed_at", null)
          .maybeSingle();

        if (membershipError) {
          capture(membershipError, { method, path, orgId });
        }

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
        const rateResponse = await checkRateLimit(request);
        if (rateResponse) return rateResponse;
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
          method,
          path,
          status: response.status,
          duration,
          userId: user.id,
          orgId: orgId || undefined,
        },
        "API request completed",
      );

      return response;
    } catch (error) {
      reportServerError("Unexpected error", error);
      return handleError(error, start, method, path, orgId || undefined);
    }
  };
}

// ── Simpler variant for routes without org context ──────────────

/**
 * For routes that don't need orgId extraction (profile, org list, etc.)
 *
 * Also supports `{ rateLimit: true }` for mutation-heavy routes.
 */
export function createSimpleRouteHandler(
  handler: SimpleRouteHandler,
  options?: SimpleHandlerOptions,
) {
  return async (request: NextRequest) => {
    const start = performance.now();
    const method = request.method;
    const path = request.nextUrl.pathname;

    try {
      const supabase = await createClient();

      // Conditionally resolve user based on requireAuth option
      const requireAuth = options?.requireAuth ?? true;
      let user: User | null = null;

      if (requireAuth) {
        const { data, error: getUserError } = await supabase.auth.getUser();

        if (getUserError) {
          capture(getUserError, { method, path });
        }

        if (!data.user) throw new UnauthorizedError();
        user = data.user;
      }

      if (options?.rateLimit) {
        const rateResponse = await checkRateLimit(request);
        if (rateResponse) return rateResponse;
      }

      const response = await handler({ request, user: user as User, supabase });

      const duration = Math.round(performance.now() - start);
      logger.info(
        {
          method,
          path,
          status: response.status,
          duration,
          userId: user?.id,
        },
        "Simple API request completed",
      );

      return response;
    } catch (error) {
      reportServerError("Unexpected error", error);
      return handleError(error, start, method, path);
    }
  };
}

// ── Internal helpers ───────────────────────────────────────────

/**
 * Check rate limit and return a 429 response if exceeded.
 */
async function checkRateLimit(request: NextRequest) {
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
  return null;
}
