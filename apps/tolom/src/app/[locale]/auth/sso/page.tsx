import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Tolom SSO start route.
 *
 * Initiates login through the Zuiio identity provider (`custom:zuiio`).
 * After successful authentication, Supabase redirects back to `/auth/callback`
 * which exchanges the PKCE code for a local session.
 *
 * The `next` parameter is sanitized and passed through so the callback
 * can redirect to the intended destination after login.
 */
export default async function SsoStartPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const next =
    params.next?.startsWith("/") && !params.next.includes("://")
      ? params.next
      : "/";

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:zuiio",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/auth/login?error=auth_start_failed`);
  }

  redirect(data.url);
}
