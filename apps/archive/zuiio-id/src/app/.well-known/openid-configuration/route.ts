import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * GET /.well-known/openid-configuration
 * Returns OpenID Provider metadata per OIDC Discovery spec.
 * Consumer apps can auto-discover endpoints instead of hardcoding them.
 */
export async function GET() {
  const { url } = getSupabaseEnv();
  const issuer = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const oauthBase = `${url}/auth/v1/oauth`;
  const metadata = {
    issuer,
    authorization_endpoint: `${oauthBase}/authorize`,
    token_endpoint: `${oauthBase}/token`,
    userinfo_endpoint: `${oauthBase}/userinfo`,
    jwks_uri: `${issuer}/api/oauth/jwks`,
    scopes_supported: ["openid", "profile", "email", "phone", "offline_access"],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256", "HS256", "ES256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    claims_supported: [
      "sub",
      "email",
      "email_verified",
      "name",
      "full_name",
      "username",
      "avatar_url",
      "updated_at",
    ],
    code_challenge_methods_supported: ["S256"],
    revocation_endpoint: `${issuer}/api/oauth/revoke`,
    end_session_endpoint: `${issuer}/api/oauth/logout`,
    // Zuiio-specific extensions
    service_documentation: "https://docs.zuiio.com",
    ui_locales_supported: ["mn", "en"],
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "application/json",
    },
  });
}
