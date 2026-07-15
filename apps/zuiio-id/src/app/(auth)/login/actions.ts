"use server";

import type { AuthActionState } from "@/lib/auth/action-state";

import { createClient } from "@/lib/supabase/server";

/**
 * Server Action: login with email/username + password.
 *
 * Uses a single `identifier` field that accepts either email or username.
 * The server resolves usernames to emails via the `resolve_username` RPC
 * before calling `signInWithPassword`. Rate-limiting must happen at the
 * application layer (middleware or edge function).
 */
export async function login(
  _previous: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/account");

  if (!identifier || !password) {
    return {
      fieldErrors: {
        ...(identifier ? {} : { identifier: ["Имэйл эсвэл нэр оруулна уу."] }),
        ...(password ? {} : { password: ["Нууц үг оруулна уу."] }),
      },
    };
  }

  const supabase = await createClient();

  // If the identifier looks like an email, sign in directly.
  // Otherwise, resolve the username to an email first.
  let email = identifier;
  if (!identifier.includes("@")) {
    const { data: resolved, error: resolveError } = await supabase.rpc(
      "resolve_username",
      { identifier },
    );

    if (resolveError || !resolved || resolved.length === 0) {
      return { formError: "Имэйл/нэр эсвэл нууц үг буруу байна." };
    }

    const resolvedRow = resolved[0] as { user_email: string } | undefined;
    if (!resolvedRow?.user_email) {
      return { formError: "Имэйл/нэр эсвэл нууц үг буруу байна." };
    }

    email = resolvedRow.user_email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Never reveal whether the account exists
    return { formError: "Имэйл/нэр эсвэл нууц үг буруу байна." };
  }

  return { redirectTo };
}

/**
 * Server Action: sign in with Google.
 * Returns the OAuth URL for the client to redirect to.
 */
export async function signInWithGoogle(): Promise<{ url: string }> {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/account`,
    },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "Google нэвтрэхэд алдаа гарлаа.");
  }

  return { url: data.url };
}

/**
 * Server Action: sign in with Apple.
 * Returns the OAuth URL for the client to redirect to.
 */
export async function signInWithApple(): Promise<{ url: string }> {
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${origin}/auth/callback?next=/account`,
    },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "Apple нэвтрэхэд алдаа гарлаа.");
  }

  return { url: data.url };
}
