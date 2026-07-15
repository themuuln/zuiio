"use server";

import { createRemoteJWKSet, jwtVerify } from "jose";

import { cookies } from "next/headers";
import type { AuthActionState } from "@/lib/auth/action-state";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Remote JWKS set for verifying Apple ID tokens.
 * Apple publishes keys at this well-known URL.
 */
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

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

  const cookieStore = await cookies();
  cookieStore.set("last_provider", "email", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return { redirectTo };
}

/**
 * Server Action: sign in with Google via ID token.
 *
 * The client obtains the ID token from Google Identity Services
 * and passes it here. Supabase verifies the token, creates/links
 * the user, and returns a full session.
 *
 * Requires the Google provider to be enabled in Supabase Dashboard
 * → Authentication → Providers → Google (with just the client_id).
 */
export async function signInWithGoogle(
  token: string,
  rawNonce: string,
): Promise<AuthActionState> {
  try {
    // Google receives the SHA-256 hash of this nonce. Supabase hashes the
    // original value again and compares it with the nonce in Google's token.
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
      nonce: rawNonce,
    });

    if (error) {
      console.error(
        "[signInWithGoogle] signInWithIdToken:",
        error.message,
        error.code,
      );
      return { formError: "Google нэвтрэхэд алдаа гарлаа." };
    }

    // The auth.users trigger creates profiles. Only update the existing row:
    // upsert would also require an INSERT policy and is rejected by RLS.
    const fullName =
      data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name;
    if (typeof fullName === "string" && fullName.trim()) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", data.user.id);

      if (profileError) {
        console.error("[signInWithGoogle] profile update:", profileError);
      }
    }

    // 3. Set last provider cookie
    const cookieStore = await cookies();
    cookieStore.set("last_provider", "google", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return { redirectTo: "/account" };
  } catch (err) {
    console.error("[signInWithGoogle] Unexpected:", err);
    return { formError: "Google нэвтрэхэд алдаа гарлаа." };
  }
}

/**
 * Server Action: sign in with Apple via ID token.
 *
 * Like Google, we verify Apple's ID token directly against Apple's JWKS
 * instead of using Supabase's built-in provider. We create the user if
 * needed, then mint a session via admin generateLink → verify.
 *
 * Apple's ID token structure differs from Google:
 * - `sub`: stable user identifier (unique per user per client)
 * - `email`: may be a private relay address (still valid)
 * - `is_private_email`: indicates if Apple's relay is used
 * - `fullName`: only provided on the FIRST sign-in (passed separately)
 */
export async function signInWithApple(payload: {
  idToken: string;
  fullName?: { givenName?: string; familyName?: string };
}): Promise<AuthActionState> {
  try {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if (!clientId) {
      console.error("[signInWithApple] Missing NEXT_PUBLIC_APPLE_CLIENT_ID");
      return { formError: "Apple нэвтрэх тохиргоо хийгдээгүй байна." };
    }

    // --- 1. Verify the Apple ID token against Apple's JWKS ---------------
    const { payload: tokenPayload } = await jwtVerify(
      payload.idToken,
      APPLE_JWKS,
      {
        issuer: "https://appleid.apple.com",
        audience: clientId,
      },
    );

    const email =
      typeof tokenPayload.email === "string" ? tokenPayload.email : undefined;

    if (!email) {
      return {
        formError: "Apple бүртгэлээс имэйл авах боломжгүй байна.",
      };
    }

    // Apple's `sub` claim is a stable user identifier unique per user per client.
    const appleSub =
      typeof tokenPayload.sub === "string" ? tokenPayload.sub : undefined;

    // --- 2. Create user via admin API (idempotent) -------------------------
    const admin = await createAdminClient();

    // Build user_metadata from what Apple provides.
    const userMetadata: Record<string, string> = {
      apple_sub: appleSub ?? "",
    };

    // Apple only provides fullName on the first sign-in.
    if (payload.fullName?.givenName || payload.fullName?.familyName) {
      const fullName = [payload.fullName.givenName, payload.fullName.familyName]
        .filter(Boolean)
        .join(" ");

      userMetadata.full_name = fullName;
      userMetadata.given_name = payload.fullName.givenName ?? "";
      userMetadata.family_name = payload.fullName.familyName ?? "";
    }

    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    // "email_exists" means the user is already in the DB — that's fine.
    if (createErr && createErr.code !== "email_exists") {
      console.error("[signInWithApple] createUser:", createErr);
      return { formError: "Системд бүртгэхэд алдаа гарлаа." };
    }

    // --- 3. Generate a magic-link to mint a session -------------------------
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkErr || !linkData) {
      console.error("[signInWithApple] generateLink:", linkErr);
      return { formError: "Системд нэвтрэхэд алдаа гарлаа." };
    }

    // The action_link contains the actual verification token as a query parameter.
    // Do NOT use hashed_token — that's a SHA-256 hash for storage, not for verification.
    const actionUrl = new URL(linkData.properties.action_link);
    const verifyToken = actionUrl.searchParams.get("token");
    if (!verifyToken) {
      console.error("[signInWithApple] No token in action_link");
      return { formError: "Системд нэвтрэхэд алдаа гарлаа." };
    }

    console.log("[signInWithApple] generateLink success", {
      verificationType: linkData.properties.verification_type,
      tokenLength: verifyToken.length,
    });

    // --- 4. Update profile with Apple data (works for new AND existing users) -
    const profileClient = await createClient();

    // Store fullName if provided (first sign-in).
    const profileFullName =
      payload.fullName?.givenName || payload.fullName?.familyName
        ? [payload.fullName.givenName, payload.fullName.familyName]
            .filter(Boolean)
            .join(" ")
        : undefined;

    const { error: profileErr } = await profileClient.from("profiles").upsert(
      {
        id: linkData.user.id,
        ...(profileFullName ? { full_name: profileFullName } : {}),
      },
      { onConflict: "id" },
    );

    if (profileErr) {
      console.error("[signInWithApple] profile upsert:", profileErr);
      // Non-fatal — log but don't block login
    }

    // --- 5. Exchange the verification token for a session -------------------
    const supabase = await createClient();

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token: verifyToken,
      type: "magiclink",
    });

    if (verifyErr) {
      console.error("[signInWithApple] verifyOtp:", verifyErr);
      return { formError: "Системд нэвтрэхэд алдаа гарлаа." };
    }

    const cookieStore = await cookies();
    cookieStore.set("last_provider", "apple", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return { redirectTo: "/account" };
  } catch (err) {
    console.error("[signInWithApple] Unexpected:", err);
    return { formError: "Apple нэвтрэхэд алдаа гарлаа." };
  }
}

/**
 * Completes a browser-based passkey sign-in after Supabase has issued the
 * session. Keeping this on the server lets the last-used provider cookie stay
 * HttpOnly and verifies that the new session reached the server.
 */
export async function completePasskeySignIn(
  redirectTo?: string,
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { formError: "Passkey ашиглан нэвтрэхэд алдаа гарлаа." };
  }

  const cookieStore = await cookies();
  cookieStore.set("last_provider", "passkey", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  const safeRedirect =
    redirectTo?.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("://")
      ? redirectTo
      : "/account";

  return { redirectTo: safeRedirect };
}
