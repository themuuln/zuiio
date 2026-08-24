import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { auditEvent, extractIp, extractUserAgent } from "@/lib/supabase/audit";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/oauth/logout
 * RP-Initiated Logout per OpenID Connect RP-Initiated Logout spec.
 *
 * Query params:
 *   - id_token_hint (optional): The ID token that was issued to the RP
 *   - post_logout_redirect_uri (optional): Where to redirect after logout
 *   - state (optional): Opaque value returned to the redirect URI
 *
 * If no post_logout_redirect_uri is provided, shows a generic "logged out" page.
 * If the URI is provided but not in the allowed list, it is ignored (security).
 */
export async function GET(request: NextRequest) {
  const ip = extractIp(request.headers);
  const ua = extractUserAgent(request.headers);
  const params = request.nextUrl.searchParams;

  const postLogoutRedirect = params.get("post_logout_redirect_uri");
  const state = params.get("state");

  // Validate redirect URI against the app's own origin (if provided)
  let safeRedirect: string | null = null;
  if (postLogoutRedirect) {
    try {
      const redirectUrl = new URL(postLogoutRedirect);
      const siteOrigin = new URL(
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      ).origin;

      if (redirectUrl.origin === siteOrigin) {
        safeRedirect = postLogoutRedirect;
      }
    } catch {
      // Invalid URL — ignore
    }
  }

  try {
    // Sign out via Supabase (clears the session cookie)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.auth.signOut();

    // Audit the logout
    await auditEvent({
      eventType: "session_revoked",
      userId: user?.id,
      ipAddress: ip,
      userAgent: ua,
      metadata: { method: "rp_initiated_logout" },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { auth_flow: "oauth", stage: "logout" },
    });
    // Best-effort — still redirect
  }

  // Redirect or show logged-out page
  if (safeRedirect) {
    const redirectUrl = new URL(safeRedirect);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // No safe redirect — show a logged-out confirmation page
  return NextResponse.redirect(
    new URL(
      "/logout",
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
  );
}
