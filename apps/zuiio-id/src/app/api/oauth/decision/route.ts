import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditEvent, extractIp, extractUserAgent } from "@/lib/supabase/audit";
import type { AuthErrorCode } from "@/lib/errors";

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

  const { authorization_id, decision } = body;

  if (!authorization_id || !decision) {
    return errorResponse("consent_failed", 400);
  }

  if (decision !== "approve" && decision !== "deny") {
    return errorResponse("consent_failed", 400);
  }

  const supabase = await createClient();
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
    const code: AuthErrorCode =
      decision === "approve" ? "consent_failed" : "consent_failed";

    await auditEvent({
      eventType: decision === "approve" ? "consent_denied" : "consent_denied",
      userId: session.user.id,
      clientId: authorization_id,
      ipAddress: ip,
      userAgent: ua,
      metadata: { error: error.message, decision },
    });

    return errorResponse(code, 500);
  }

  // Audit the successful decision
  await auditEvent({
    eventType: decision === "approve" ? "consent_approved" : "consent_denied",
    userId: session.user.id,
    clientId: authorization_id,
    ipAddress: ip,
    userAgent: ua,
  });

  if (!data?.redirect_url) {
    return errorResponse("consent_failed", 500);
  }

  return NextResponse.json({ redirect_to: data.redirect_url });
}

function errorResponse(code: AuthErrorCode, status: number) {
  return NextResponse.json({ error_code: code }, { status });
}
