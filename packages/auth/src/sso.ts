import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The custom OIDC provider identifier registered on every product
 * Supabase project that federates to Zuiio ID.
 */
export const ZUIIO_OIDC_PROVIDER = "custom:zuiio" as const;

export interface StartZuiioSsoOptions {
  /** URL to redirect to after successful authentication */
  redirectTo: string;
  /**
   * When true, returns the OAuth URL instead of redirecting the browser.
   * Used by Expo/React Native to open the URL in an in-app browser.
   */
  skipBrowserRedirect?: boolean;
}

export interface ZuiioSsoResult {
  /** The OAuth URL to redirect to, or null on error */
  url: string | null;
  /** Error message, or null on success */
  error: string | null;
}

/**
 * Initiates SSO login through the Zuiio identity provider.
 *
 * On web, redirects the browser to `id.zuiio.com`.
 * On mobile (skipBrowserRedirect: true), returns the URL for
 * expo-web-browser or similar.
 *
 * @example
 * ```ts
 * // Web — redirects automatically
 * await startZuiioSso(supabase, { redirectTo: "/dashboard" });
 *
 * // Mobile — returns URL for in-app browser
 * const { url } = await startZuiioSso(supabase, {
 *   redirectTo: "zuiio-zer://auth/callback",
 *   skipBrowserRedirect: true,
 * });
 * if (url) openAuthSession(url);
 * ```
 */
export async function startZuiioSso(
  supabase: SupabaseClient,
  options: StartZuiioSsoOptions,
): Promise<ZuiioSsoResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: ZUIIO_OIDC_PROVIDER,
      options: {
        redirectTo: options.redirectTo,
        skipBrowserRedirect: options.skipBrowserRedirect,
      },
    });

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.url, error: null };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "SSO initialization failed";
    return { url: null, error: message };
  }
}

/**
 * Exchanges a product-project PKCE code for a local session.
 *
 * Used in `/auth/callback` routes after the product Supabase redirects
 * back with a `code` query parameter.
 *
 * @param callbackUrl - The full callback URL containing the `code` parameter
 * @returns Generic error string on failure, null on success
 *
 * @example
 * ```ts
 * // In /auth/callback route handler
 * const error = await exchangeZuiioSsoCode(supabase, request.url);
 * if (error) redirect("/login?error=" + encodeURIComponent(error));
 * ```
 */
export async function exchangeZuiioSsoCode(
  supabase: SupabaseClient,
  callbackUrl: string,
): Promise<string | null> {
  try {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get("code");

    if (!code) {
      return "Missing authorization code";
    }

    // Reject if multiple code params present (tampered URL)
    const allCodes = url.searchParams.getAll("code");
    if (allCodes.length > 1) {
      return "Invalid callback URL";
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return "Authentication failed. Please try again.";
    }

    return null;
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Authentication failed";
    return message;
  }
}
