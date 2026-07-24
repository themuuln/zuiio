import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Zer SSO start route handler.
 *
 * Redirects to Supabase authorize with the `custom:zuiio` provider.
 * Uses a Route Handler (not a Page) to guarantee dynamic rendering
 * under Next.js 16 Cache Components — Pages get prerendered as static
 * shells and `redirect()` never executes.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createClient();

  const next =
    searchParams.get("next")?.startsWith("/") &&
    !searchParams.get("next")?.includes("://")
      ? searchParams.get("next")
      : "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:zuiio",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next ?? "/")}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL("/login?error=auth_start_failed", origin),
    );
  }

  return NextResponse.redirect(data.url);
}
