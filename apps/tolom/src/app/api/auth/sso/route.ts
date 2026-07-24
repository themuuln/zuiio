import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";

/**
 * Initiates SSO login through the Zuiio identity provider (`custom:zuiio`).
 * Returns the OAuth redirect URL for the client to navigate to.
 */
export const GET = createSimpleRouteHandler(async ({ request, supabase }) => {
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";

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
    return apiError("AUTH_START_FAILED", "Failed to start SSO login", 500);
  }

  return ok({ url: data.url, next });
});
