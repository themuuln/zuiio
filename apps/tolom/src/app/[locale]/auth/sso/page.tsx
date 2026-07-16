import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Tolom SSO start route.
 *
 * Initiates login through the Zuiio identity provider (`custom:zuiio`).
 * After successful authentication, Supabase redirects back to `/auth/callback`
 * which exchanges the PKCE code for a local session.
 */
export default async function SsoStartPage() {
  const supabase = await createClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
