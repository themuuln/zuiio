import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import type { AuthErrorCode } from "@/lib/errors";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { auditEvent, extractIp, extractUserAgent } from "@/lib/supabase/audit";
import { createClient } from "@/lib/supabase/server";

interface DecisionBody {
  authorization_id?: string;
  decision?: "approve" | "deny";
}

/**
 * POST /api/oauth/decision
 *
 * Unified consent decision endpoint. Replaces the separate approve/deny routes.
 * Uses the Supabase SDK's approveAuthorization / denyAuthorization methods
 * with skipBrowserRedirect: true so the client handles navigation.
 *
 * Body: { authorization_id: string, decision: "approve" | "deny" }
 * Success: { redirect_to: string }
 * Failure: { error_code: AuthErrorCode } with appropriate HTTP status
 *
 * The OAuth Server is enabled on THIS project (Zuiio ID), so we use
 * createClient() directly — no cross-project client needed.
 */
export async function POST(request: NextRequest) {
  const ip = extractIp(request.headers);
  const ua = extractUserAgent(request.headers);

  // Rate limit: 30 requests per 15 minutes per IP
  const rateLimit = await checkApiRateLimit(ip ?? "unknown", "oauth-decision");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error_code: "rate_limited" as AuthErrorCode },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: DecisionBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("consent_failed", 400);
  }

  const { authorization_id, decision } = body;

  if (!authorization_id || !decision) {
    return errorResponse("consent_failed", 400);
  }

  if (decision !== "approve" && decision !== "deny") {
    return errorResponse("consent_failed", 400);
  }

  // Use Zuiio ID's own Supabase client — the OAuth Server is enabled here.
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    Sentry.captureMessage("Unauthenticated OAuth consent decision", {
      level: "warning",
      tags: { auth_flow: "oauth", stage: "consent" },
    });
    return errorResponse("consent_failed", 401);
  }

  // Use the SDK methods with skipBrowserRedirect: true.
  // These call the Supabase OAuth endpoints using the user's own JWT.
  const method =
    decision === "approve"
      ? supabase.auth.oauth.approveAuthorization
      : supabase.auth.oauth.denyAuthorization;

  const { data, error } = await method.call(
    supabase.auth.oauth,
    authorization_id,
    { skipBrowserRedirect: true },
  );

  if (error) {
    Sentry.captureException(error, {
      tags: { auth_flow: "oauth", stage: "decision" },
    });
    // Protocol-level denial follows the SDK's registered client redirect.
    const redirectData = data as { redirect_url?: string } | null;
    if (redirectData?.redirect_url) {
      return NextResponse.json(
        { redirect_to: redirectData.redirect_url },
        { status: 403 },
      );
    }
    await auditOAuthError("consent_failed", user.id, undefined, ip, ua);
    return errorResponse("consent_failed", 500);
  }

  // Audit the successful decision
  await auditEvent({
    eventType: decision === "approve" ? "consent_approved" : "consent_denied",
    userId: user.id,
    ipAddress: ip,
    userAgent: ua,
    metadata: { authorization_id, decision },
  });

  if (!data?.redirect_url) {
    Sentry.captureMessage("OAuth decision returned no redirect URL", {
      level: "error",
      tags: { auth_flow: "oauth", stage: "decision" },
    });
    return errorResponse("consent_failed", 500);
  }

  return NextResponse.json({ redirect_to: data.redirect_url });
}

function errorResponse(code: AuthErrorCode, status: number) {
  return NextResponse.json({ error_code: code }, { status });
}

async function auditOAuthError(
  code: AuthErrorCode,
  userId?: string,
  clientId?: string,
  ip?: string,
  ua?: string,
) {
  return auditEvent({
    eventType: "oauth_error",
    userId,
    clientId,
    ipAddress: ip,
    userAgent: ua,
    metadata: { error_code: code },
  });
}
