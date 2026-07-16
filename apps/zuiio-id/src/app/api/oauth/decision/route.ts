import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProjectClient } from "@/lib/supabase/external";
import { auditEvent, extractIp, extractUserAgent } from "@/lib/supabase/audit";
import type { AuthErrorCode } from "@/lib/errors";

/**
 * Default project ref for the OAuth Server.
 * Matches the default in consent/page.tsx — see that file for rationale.
 */
const DEFAULT_PROJECT_REF = "fhzuolncswccxkcqzclg"; // Tolom

interface DecisionBody {
  authorization_id?: string;
  decision?: "approve" | "deny";
  project_ref?: string;
}

/**
 * POST /api/oauth/decision
 *
 * Unified consent decision endpoint. Replaces the separate approve/deny routes.
 * Uses the Supabase SDK's approveAuthorization / denyAuthorization methods
 * with skipBrowserRedirect: true so the client handles navigation.
 *
 * Body: { authorization_id: string, decision: "approve" | "deny", project_ref?: string }
 * Success: { redirect_to: string }
 * Failure: { error_code: AuthErrorCode } with appropriate HTTP status
 *
 * IMPORTANT: The authorization was created on the originating project's
 * Supabase, so we must use that project's client for the approve/deny call.
 */
export async function POST(request: NextRequest) {
  const ip = extractIp(request.headers);
  const ua = extractUserAgent(request.headers);

  let body: DecisionBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("consent_failed", 400);
  }

  const { authorization_id, decision, project_ref } = body;

  if (!authorization_id || !decision) {
    return errorResponse("consent_failed", 400);
  }

  if (decision !== "approve" && decision !== "deny") {
    return errorResponse("consent_failed", 400);
  }

  // Create a client for the originating project's Supabase.
  // The authorization was created there, so the OAuth Server API lives there.
  const effectiveRef = project_ref ?? DEFAULT_PROJECT_REF;
  const supabase = await createProjectClient(effectiveRef);

  if (!supabase) {
    return errorResponse("consent_failed", 500);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
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
    // Protocol-level denial follows the SDK's registered client redirect.
    if (data && "redirect_url" in data && data.redirect_url) {
      return NextResponse.json(
        { redirect_to: data.redirect_url },
        { status: 403 },
      );
    }
    await auditOAuthError(
      "consent_failed",
      session.user.id,
      undefined,
      ip,
      ua,
    );
    return errorResponse("consent_failed", 500);
  }

  // Audit the successful decision
  await auditEvent({
    eventType: decision === "approve" ? "consent_approved" : "consent_denied",
    userId: session.user.id,
    ipAddress: ip,
    userAgent: ua,
    metadata: { authorization_id, decision },
  });

  if (!data?.redirect_url) {
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
