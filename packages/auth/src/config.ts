/**
 * Configuration for direct OIDC consumers.
 *
 * Most apps use Supabase's `signInWithOAuth({ provider: 'custom:zuiio' })`
 * and don't need this. Use these helpers when you want to call the
 * OIDC endpoints directly (e.g. Expo/React Native in-app browsers).
 */

export interface ZuiioConfig {
  /** Base URL of the Zuiio ID identity provider (e.g. "https://id.zuiio.com") */
  baseUrl: string;
  /** OAuth client ID registered in the IDP */
  clientId: string;
  /** Redirect URI registered for this app */
  redirectUri: string;
  /** Scopes to request (defaults to openid,profile,email,offline_access) */
  scopes: string[];
}

/**
 * Build OIDC config from environment variables.
 *
 * Required env vars:
 * - `ZUIIO_SSO_BASE_URL` — IDP base URL
 * - `ZUIIO_SSO_CLIENT_ID` — OAuth client ID
 * - `ZUIIO_SSO_REDIRECT_URI` — Callback URL for this app
 *
 * Optional:
 * - `ZUIIO_SSO_SCOPES` — Comma-separated scopes (default: "openid,profile,email,offline_access")
 */
export function getZuiioConfig(): ZuiioConfig {
  const baseUrl = process.env.ZUIIO_SSO_BASE_URL;
  const clientId = process.env.ZUIIO_SSO_CLIENT_ID;
  const redirectUri = process.env.ZUIIO_SSO_REDIRECT_URI;

  if (!baseUrl || !clientId || !redirectUri) {
    throw new Error(
      "Missing ZUIIO_SSO env vars. Required: ZUIIO_SSO_BASE_URL, ZUIIO_SSO_CLIENT_ID, ZUIIO_SSO_REDIRECT_URI",
    );
  }

  return {
    baseUrl,
    clientId,
    redirectUri,
    scopes: process.env.ZUIIO_SSO_SCOPES?.split(",") ?? [
      "openid",
      "profile",
      "email",
      "offline_access",
    ],
  };
}
