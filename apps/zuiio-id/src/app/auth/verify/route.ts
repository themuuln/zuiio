import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/verify?token_hash=...&type=signup
 *
 * Handles email verification callbacks from Supabase.
 * In the default PKCE flow, Supabase processes the verification on its
 * hosted page and redirects to /auth/callback with a code. This route
 * provides a fallback for direct token-based verification links.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || type !== "signup") {
    return NextResponse.redirect(
      new URL("/error?code=generic_auth_error", request.url),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "signup",
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/error?code=generic_auth_error", request.url),
    );
  }

  // Verification successful — redirect to account onboarding
  return NextResponse.redirect(new URL("/account", request.url));
}
