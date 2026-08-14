import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { APIRequestContext, BrowserContext } from "@playwright/test";

/**
 * The saved test session (`e2e/.auth/user.json`, written by `global-setup.ts`)
 * only stores `sb-access-token` + `sb-refresh-token`. `@supabase/ssr` does NOT
 * read those — it expects a single `sb-<ref>-auth-token` cookie holding the full
 * JSON session. Without it, `getSession()` in the middleware returns null and the
 * app redirects to `/auth/login` before any page content renders, so every
 * auth-dependent spec silently lands on the login screen.
 *
 * This helper reconstructs the `sb-<ref>-auth-token` cookie from the access token
 * in `user.json` and injects it into the browser context, restoring the real
 * session for the middleware.
 *
 * Only use this for specs that need the real client-side auth session (i.e. specs
 * that do NOT call `mockSupabaseREST`, which would otherwise break auth).
 */

function getSupabaseRef(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    readEnvLocal("NEXT_PUBLIC_SUPABASE_URL") ??
    "";

  try {
    const hostname = new URL(url).hostname.replace(/^\[|\]$/g, "");
    const [ref] = hostname.split(".");
    if (ref) {
      return ref;
    }
  } catch {
    // Fall through to the actionable error below.
  }

  throw new Error(
    "Could not derive Supabase project ref from NEXT_PUBLIC_SUPABASE_URL",
  );
}

function readEnvLocal(key: string): string | undefined {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    const line = raw.split("\n").find((l) => l.startsWith(`${key}=`));
    return line
      ?.split("=")[1]
      ?.trim()
      .replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

/**
 * Build the `sb-<ref>-auth-token` cookie value that `@supabase/ssr` reads,
 * from a raw access/refresh token pair (e.g. a freshly minted Supabase session).
 *
 * The cookie holds the JSON session object (Supabase's `v1` cookie format) —
 * NOT a base64url encoding. `@supabase/ssr` parses the JSON directly. The
 * `user` field is recovered from the access-token JWT payload so the session
 * is accepted by the middleware.
 */
export function buildSupabaseSessionCookie(
  accessToken: string,
  refreshToken: string,
): { name: string; value: string } {
  if (!accessToken) {
    throw new Error(
      "buildSupabaseSessionCookie: accessToken is empty — user.json may be stale or missing the sb-access-token cookie. Delete e2e/.auth/user.json to force a fresh login.",
    );
  }
  // Decode the JWT payload to recover the user object and expiry.
  const payload = JSON.parse(
    Buffer.from(accessToken.split(".")[1], "base64").toString(),
  );
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;

  const cookieValue = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    provider_token: null,
    token_type: "bearer",
    expires_at: expiresAt,
    expires_in: 3600,
    user: payload,
  });

  const ref = getSupabaseRef();
  return { name: `sb-${ref}-auth-token`, value: cookieValue };
}

export async function addSupabaseSessionCookie(
  context: BrowserContext | APIRequestContext,
): Promise<void> {
  const userJsonPath = resolve(process.cwd(), "e2e/.auth/user.json");
  const session = JSON.parse(readFileSync(userJsonPath, "utf-8"));
  const accessToken = session.cookies.find(
    (c: { name: string }) => c.name === "sb-access-token",
  )?.value;
  const refreshToken =
    session.cookies.find((c: { name: string }) => c.name === "sb-refresh-token")
      ?.value ?? "";

  if (!accessToken) {
    throw new Error("e2e/.auth/user.json missing sb-access-token");
  }

  const { name, value } = buildSupabaseSessionCookie(accessToken, refreshToken);
  await context.addCookies([
    {
      name,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
