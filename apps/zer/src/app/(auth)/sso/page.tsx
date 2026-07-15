import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Zer SSO start route.
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

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("NEXT_PUBLIC_SITE_URL must be set in production");
        })()
      : "http://localhost:3000");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "custom:zuiio",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=auth_start_failed`);
  }

  redirect(data.url);
}
