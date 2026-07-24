/**
 * Zuiio OIDC client.
 *
 * A server-side OIDC client for integrating non-Supabase applications
 * with Zuiio ID. Handles discovery, PKCE authorization, token exchange,
 * refresh, and logout.
 *
 * Uses `openid-client` under the hood — the de facto standard Node.js
 * OIDC library by Filip Skokan (panva).
 *
 * @example
 * ```ts
 * import { createZuiioOidcClient } from "@zuiio/oidc";
 *
 * const client = await createZuiioOidcClient({
 *   issuer: "https://id.zuiiotech.com",
 *   clientId: "your-client-id",
 *   clientSecret: "your-client-secret",
 *   redirectUri: "https://yourapp.com/auth/callback",
 * });
 *
 * // Start login
 * const auth = await client.beginAuthorization();
 * // Store auth.state, auth.nonce, auth.codeVerifier in session
 * redirect(auth.url);
 *
 * // Handle callback
 * const tokens = await client.handleCallback(request.url, auth);
 * // tokens.accessToken, tokens.idToken, tokens.refreshToken
 * ```
 *
 * @module
 */

import {
  Issuer,
  generators,
  type Client as OidcClient,
  type TokenSet as OidcTokenSet,
  type UserinfoResponse,
} from "openid-client";

// ─── Types ──────────────────────────────────────────────────────────

export interface ZuiioOidcConfig {
  /** OIDC issuer URL (e.g. "https://id.zuiiotech.com") */
  issuer: string;
  /** OAuth client ID registered with Zuiio ID */
  clientId: string;
  /** OAuth client secret (for confidential clients) */
  clientSecret?: string;
  /** Redirect URI registered for this application */
  redirectUri: string;
  /** Requested scopes (default: "openid profile email offline_access") */
  scopes?: string[];
}

/**
 * An in-progress authorization transaction.
 * Store these values server-side (encrypted session, not localStorage).
 */
export interface AuthorizationTransaction {
  /** Full authorize URL to redirect the user to */
  url: string;
  /** CSRF state parameter — verify on callback */
  state: string;
  /** Nonce for ID token validation */
  nonce: string;
  /** PKCE code verifier — must be stored for the callback exchange */
  codeVerifier: string;
}

/** Token set returned after successful authentication. */
export interface ZuiioTokenSet {
  /** Access token (JWT) */
  accessToken: string;
  /** ID token (JWT with user claims) */
  idToken: string;
  /** Refresh token (for obtaining new access tokens) */
  refreshToken?: string;
  /** Access token expiry as Unix timestamp (seconds) */
  expiresAt?: number;
  /** Raw openid-client token set (for advanced usage) */
  raw: OidcTokenSet;
}

/** Userinfo claims returned from the userinfo endpoint. */
export interface ZuiioUserinfo {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  fullName?: string;
  username?: string;
  picture?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * Zuiio ID OIDC client interface.
 *
 * All methods are server-side only. Never expose tokens or
 * code verifiers to the browser.
 */
export interface ZuiioOidcClient {
  /**
   * Begin an authorization flow.
   * Generates PKCE code challenge, state, and nonce.
   * Returns the authorization URL and transaction state
   * that must be stored server-side.
   */
  beginAuthorization(): Promise<AuthorizationTransaction>;

  /**
   * Handle the callback from Zuiio ID after the user authorizes.
   * Exchanges the authorization code for tokens.
   *
   * @param callbackUrl - The full callback URL (with code + state params)
   * @param transaction - The transaction from beginAuthorization()
   * @returns Token set with access, ID, and optional refresh tokens
   */
  handleCallback(
    callbackUrl: string | URL,
    transaction: AuthorizationTransaction,
  ): Promise<ZuiioTokenSet>;

  /**
   * Refresh an expired access token.
   *
   * @param refreshToken - The refresh token from a previous token set
   * @returns New token set
   */
  refresh(refreshToken: string): Promise<ZuiioTokenSet>;

  /**
   * Fetch userinfo from the userinfo endpoint.
   *
   * @param accessToken - A valid access token
   * @returns Userinfo claims
   */
  userinfo(accessToken: string): Promise<ZuiioUserinfo>;

  /**
   * Build a logout URL that ends the session at Zuiio ID.
   * Redirect the user to this URL to log them out of the identity provider.
   *
   * @param idTokenHint - The ID token (required by OIDC RP-Initiated Logout)
   * @param postLogoutRedirectUri - Where to redirect after logout
   * @returns Full logout URL
   */
  endSessionUrl(
    idTokenHint?: string,
    postLogoutRedirectUri?: string,
  ): string | undefined;

  /** The underlying openid-client Client instance (for advanced use). */
  raw: OidcClient;
}

// ─── Factory ────────────────────────────────────────────────────────

/**
 * Create a Zuiio OIDC client by discovering the issuer's metadata.
 *
 * Fetches `/.well-known/openid-configuration` from the issuer to
 * auto-configure endpoints, JWKS, and supported features.
 *
 * @param config - OIDC configuration
 * @returns A configured OIDC client
 *
 * @throws If the issuer is unreachable or the client registration
 *         doesn't match the issuer's requirements.
 */
export async function createZuiioOidcClient(
  config: ZuiioOidcConfig,
): Promise<ZuiioOidcClient> {
  const issuer = await Issuer.discover(config.issuer);

  const client = new issuer.Client({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uris: [config.redirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: config.clientSecret ? "client_secret_basic" : "none",
  });

  const scopes = config.scopes ?? [
    "openid",
    "profile",
    "email",
    "offline_access",
  ];

  // ── beginAuthorization ──
  async function beginAuthorization(): Promise<AuthorizationTransaction> {
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    const url = client.authorizationUrl({
      scope: scopes.join(" "),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });

    return { url, state, nonce, codeVerifier };
  }

  // ── handleCallback ──
  async function handleCallback(
    callbackUrl: string | URL,
    transaction: AuthorizationTransaction,
  ): Promise<ZuiioTokenSet> {
    const url =
      typeof callbackUrl === "string" ? new URL(callbackUrl) : callbackUrl;

    const params = client.callbackParams(url.toString());

    const tokenSet = await client.callback(
      config.redirectUri,
      params,
      {
        code_verifier: transaction.codeVerifier,
        state: transaction.state,
        nonce: transaction.nonce,
      },
    );

    return {
      accessToken: tokenSet.access_token ?? "",
      idToken: tokenSet.id_token ?? "",
      refreshToken: tokenSet.refresh_token,
      expiresAt: tokenSet.expires_at,
      raw: tokenSet,
    };
  }

  // ── refresh ──
  async function refresh(refreshToken: string): Promise<ZuiioTokenSet> {
    const tokenSet = await client.refresh(refreshToken);

    return {
      accessToken: tokenSet.access_token ?? "",
      idToken: tokenSet.id_token ?? "",
      refreshToken: tokenSet.refresh_token,
      expiresAt: tokenSet.expires_at,
      raw: tokenSet,
    };
  }

  // ── userinfo ──
  async function userinfo(accessToken: string): Promise<ZuiioUserinfo> {
    const response: UserinfoResponse = await client.userinfo(accessToken);
    return {
      sub: response.sub,
      email: response.email,
      emailVerified: response.email_verified,
      name: response.name,
      fullName: response.full_name,
      username: response.username,
      picture: response.picture,
      updatedAt: response.updated_at,
      ...response,
    };
  }

  // ── endSessionUrl ──
  function endSessionUrl(
    idTokenHint?: string,
    postLogoutRedirectUri?: string,
  ): string | undefined {
    if (!client.endSessionUrl) return undefined;
    return client.endSessionUrl({
      id_token_hint: idTokenHint,
      post_logout_redirect_uri: postLogoutRedirectUri,
    });
  }

  return {
    beginAuthorization,
    handleCallback,
    refresh,
    userinfo,
    endSessionUrl,
    raw: client,
  };
}
