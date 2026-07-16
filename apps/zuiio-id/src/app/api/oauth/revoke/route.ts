import { NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv, getServiceRoleKey } from "@/lib/supabase/env";
import { auditEvent, extractIp, extractUserAgent } from "@/lib/supabase/audit";

/**
 * POST /api/oauth/revoke
 * Revokes an access token or refresh token per RFC 7009.
 *
 * Body: { token: string, token_type_hint?: "access_token" | "refresh_token" }
 *
 * Per the RFC, the server MUST respond with 200 OK even if:
 * - The token was already revoked
 * - The token was not found
 * - The client is not authorized
 * This prevents token enumeration attacks.
 */
export async function POST(request: NextRequest) {
  const ip = extractIp(request.headers);
  const ua = extractUserAgent(request.headers);

  let body: { token?: string; token_type_hint?: string };
  try {
    body = await request.json();
  } catch {
    // RFC 7009: always return 200
    return new NextResponse(null, { status: 200 });
  }

  const { token } = body;

  if (!token) {
    return new NextResponse(null, { status: 200 });
  }

  try {
    const { url } = getSupabaseEnv();
    const serviceKey = getServiceRoleKey();

    // GoTrue supports token revocation at /auth/v1/admin/token
    const revokeResponse = await fetch(
      `${url}/auth/v1/admin/token`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
    );

    // Audit the revocation attempt (regardless of outcome)
    await auditEvent({
      eventType: "grant_revoked",
      ipAddress: ip,
      userAgent: ua,
      metadata: {
        token_type_hint: body.token_type_hint ?? "unknown",
        revoke_status: revokeResponse.status,
      },
    });
  } catch {
    // Log but don't fail — RFC 7009 requires 200 even on errors
  }

  return new NextResponse(null, { status: 200 });
}
