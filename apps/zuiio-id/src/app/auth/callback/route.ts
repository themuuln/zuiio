import { NextResponse } from "next/server";
import { verifyContinuation } from "@/lib/auth/continuation";
import { createClient } from "@/lib/supabase/server";

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
 *
 * Also sets a `linked_identities_count` cookie so the client can show
 * a toast when the user has multiple sign-in methods.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const continuation = searchParams.get("continuation");
  const next = searchParams.get("next");

  // If we have a continuation token from signup, verify and redirect
  if (continuation) {
    const payload = await verifyContinuation(continuation);

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
    const redirectTo = next?.startsWith("/")
      ? next
      : profile?.username
        ? "/"
        : "/account";

    const response = NextResponse.redirect(new URL(redirectTo, origin));

    // Set cookie with identity count for client notification (5 min TTL)
    await setLinkedIdentitiesCookie(supabase, response);

    return response;
  }

  // No code and no continuation — return to login
  return NextResponse.redirect(new URL("/login", origin));
}

/**
 * Check if user has multiple linked identities and set a cookie
 * so the client can show a notification toast.
 */
async function setLinkedIdentitiesCookie(
  supabase: Awaited<ReturnType<typeof createClient>>,
  response: NextResponse,
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const identityCount = user.identities?.length ?? 0;

    if (identityCount > 1) {
      response.cookies.set("linked_identities_count", String(identityCount), {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60, // 5 minutes
        path: "/",
      });
    }
  } catch (err) {
    // Non-fatal — don't block login
    console.error("[callback] setLinkedIdentitiesCookie:", err);
  }
}
