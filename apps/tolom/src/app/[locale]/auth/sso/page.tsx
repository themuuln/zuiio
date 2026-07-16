import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

/**
 * Tolom SSO start route.
 *
 * Initiates login through the Zuiio identity provider (`custom:zuiio`).
 * After successful authentication, Supabase redirects back to `/auth/callback`
 * which exchanges the PKCE code for a local session.
 */
export default async function SsoStartPage() {
  const hdrs = await headers();
  const supabase = await createClient();

  // Build origin from the request host — avoids NEXT_PUBLIC compile-time inlining issues
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:zuiio",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect(`/auth/login?error=auth_start_failed`);
  }

  redirect(data.url);
}
