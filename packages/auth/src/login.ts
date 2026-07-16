import type { ZuiioConfig } from "./config";
import { generatePkce } from "./sso";

export interface LoginWithZuiioResult {
  /** Full authorize URL to redirect the user to */
  url: string;
  /** PKCE code verifier — caller MUST store this for the callback exchange */
  codeVerifier: string;
}

/**
 * Build an OIDC authorize URL for Zuiio ID login.
 *
 * Generates a PKCE code pair and returns the full authorize URL
 * plus the code verifier. The caller must:
 * 1. Store `codeVerifier` securely (cookie, SecureStore, etc.)
 * 2. Redirect the user to `url`
 * 3. On callback, exchange the code using the stored verifier
 *
 * @param config - OIDC configuration (from `getZuiioConfig()`)
 * @param state - Optional CSRF state parameter
 *
 * @example
 * ```ts
 * const config = getZuiioConfig();
 * const { url, codeVerifier } = await loginWithZuiio(config);
 * // Store codeVerifier, then redirect:
 * redirect(url);
 * ```
 */
export async function loginWithZuiio(
  config: ZuiioConfig,
  state?: string,
): Promise<LoginWithZuiioResult> {
  const { codeVerifier, codeChallenge } = await generatePkce();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    ...(state ? { state } : {}),
  });

  return {
    url: `${config.baseUrl}/api/oauth/authorize?${params.toString()}`,
    codeVerifier,
  };
}
