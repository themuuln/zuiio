import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyContinuation } from "@/lib/auth/continuation";

/**
 * Identity auth callback.
 *
 * Exchanges the Supabase PKCE code for a session, then verifies
 * any continuation token to redirect back to the originating product.
 *
 * Flow:
 * 1. Supabase redirects here with `code` and `state` after login/signup
 * 2. We exchange the code for a session
 * 3. If a continuation token exists, verify it and redirect to the product
 * 4. Otherwise, redirect to /account
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const continuation = searchParams.get("continuation");
  const next = searchParams.get("next");

  // If we have a continuation token from signup, verify and redirect
  if (continuation) {
    const payload = verifyContinuation(continuation);

    if (!payload) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_continuation", origin),
      );
    }

    // Exchange the code if present, or redirect to the product SSO start
    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          new URL("/login?error=exchange_failed", origin),
        );
      }
    }

    // Redirect to the product's SSO start path with the continuation
    return NextResponse.redirect(
      new URL(`${payload.returnTo}?continuation=${continuation}`, origin),
    );
  }

  // Standard callback flow — exchange the PKCE code
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=exchange_failed", origin),
      );
    }

    // Check if user has completed onboarding (has a username)
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .single();

    // Redirect to the specified next URL, or home/onboarding based on profile
    const redirectTo =
      next && next.startsWith("/")
        ? next
        : profile?.username
          ? "/"
          : "/account";
    return NextResponse.redirect(new URL(redirectTo, origin));
  }

  // No code and no continuation — return to login
  return NextResponse.redirect(new URL("/login", origin));
}
