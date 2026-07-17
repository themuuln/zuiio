import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Initiates SSO login through the Zuiio identity provider (`custom:zuiio`).
 * Returns the OAuth redirect URL for the client to navigate to.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/dashboard";

  // Build origin from the request host
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:zuiio",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return NextResponse.json({ error: "auth_start_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: data.url, next });
}
