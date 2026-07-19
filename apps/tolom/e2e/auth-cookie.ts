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
  const match = url.match(/https:\/\/([^.]+)\./);
  if (!match?.[1]) {
    throw new Error(
      "Could not derive Supabase project ref from NEXT_PUBLIC_SUPABASE_URL",
    );
  }
  return match[1];
}

function readEnvLocal(key: string): string | undefined {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    const line = raw
      .split("\n")
      .find((l) => l.startsWith(`${key}=`));
    return line?.split("=")[1]?.trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
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
    session.cookies.find(
      (c: { name: string }) => c.name === "sb-refresh-token",
    )?.value ?? "";

  if (!accessToken) {
    throw new Error("e2e/.auth/user.json missing sb-access-token");
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
  await context.addCookies([
    {
      name: `sb-${ref}-auth-token`,
      value: cookieValue,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
