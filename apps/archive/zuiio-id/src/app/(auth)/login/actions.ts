"use server";

import * as Sentry from "@sentry/nextjs";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { cookies, headers } from "next/headers";
import type { AuthActionState } from "@/lib/auth/action-state";
import {
  checkRateLimit,
  cleanupOldAttempts,
  recordLoginAttempt,
} from "@/lib/rate-limit";
import { extractIp } from "@/lib/supabase/audit";
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
  const remember = formData.get("remember") === "on";

  if (!identifier || !password) {
    return {
      fieldErrors: {
        ...(identifier ? {} : { identifier: ["Имэйл эсвэл нэр оруулна уу."] }),
        ...(password ? {} : { password: ["Нууц үг оруулна уу."] }),
      },
    };
  }
  // Extract IP for rate limiting
  const hdrs = await headers();
  const ip = extractIp(hdrs);

  // Check rate limit before attempting sign-in
  const rateLimit = await checkRateLimit(identifier, ip);
  if (!rateLimit.allowed) {
    return {
      formError: `Хэт их оролдлогын тоо. Түр хүлээнэ үү. ${rateLimit.retryAfterSeconds} секундийн дараа дахин оролдоно уу.`,
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
      if (resolveError) {
        Sentry.captureException(resolveError, {
          tags: { auth_flow: "password", stage: "resolve_username" },
        });
      }
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
    Sentry.captureException(error, {
      tags: { auth_flow: "password", stage: "sign_in" },
    });
    recordLoginAttempt(identifier, false, ip);
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
  // Store remember-me preference for session duration control
  cookieStore.set("remember_me", remember ? "1" : "0", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: remember ? 60 * 60 * 24 * 365 : 60 * 60 * 24, // 1 year vs 1 day
    path: "/",
  });
  // Record successful login and clean up old attempts (fire-and-forget)
  void recordLoginAttempt(identifier, true, ip);
  void cleanupOldAttempts();

  // Check if user has completed onboarding (has a username)
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  // If an explicit redirectTo was provided (e.g. from consent flow), use it.
  // Otherwise fall back to / (existing user) or /account (new user).
  const destination =
    redirectTo !== "/account"
      ? redirectTo
      : profile?.username
        ? "/"
        : redirectTo;
  return { redirectTo: destination };
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
  redirectTo?: string,
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
      Sentry.captureException(error, {
        tags: { auth_flow: "google", stage: "sign_in" },
      });
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
        Sentry.captureException(profileError, {
          tags: { auth_flow: "google", stage: "profile_update" },
        });
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

    // New users (no username) need onboarding at /account;
    // existing users go straight to the home page.
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .single();

    const googleDestination =
      redirectTo && redirectTo !== "/account"
        ? redirectTo
        : profile?.username
          ? "/"
          : "/account";
    return { redirectTo: googleDestination };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { auth_flow: "google", stage: "sign_in" },
    });
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
  redirectTo?: string;
  fullName?: { givenName?: string; familyName?: string };
}): Promise<AuthActionState> {
  try {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if (!clientId) {
      Sentry.captureMessage("Apple client ID is not configured", {
        level: "error",
        tags: { auth_flow: "apple", stage: "config" },
      });
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
      Sentry.captureException(createErr, {
        tags: { auth_flow: "apple", stage: "create_user" },
      });
      return { formError: "Системд бүртгэхэд алдаа гарлаа." };
    }

    // --- 3. Generate a magic-link to mint a session -------------------------
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkErr || !linkData) {
      Sentry.captureException(
        linkErr ?? new Error("Apple link was not created"),
        {
          tags: { auth_flow: "apple", stage: "generate_link" },
        },
      );
      return { formError: "Системд нэвтрэхэд алдаа гарлаа." };
    }

    // The action_link contains the actual verification token as a query parameter.
    // Do NOT use hashed_token — that's a SHA-256 hash for storage, not for verification.
    const actionUrl = new URL(linkData.properties.action_link);
    const verifyToken = actionUrl.searchParams.get("token");
    if (!verifyToken) {
      Sentry.captureMessage("Apple action link did not contain a token", {
        level: "error",
        tags: { auth_flow: "apple", stage: "generate_link" },
      });
      return { formError: "Системд нэвтрэхэд алдаа гарлаа." };
    }

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
      Sentry.captureException(profileErr, {
        tags: { auth_flow: "apple", stage: "profile_update" },
      });
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
      Sentry.captureException(verifyErr, {
        tags: { auth_flow: "apple", stage: "verify_otp" },
      });
      return { formError: "Системд нэвтрэхэд алдаа гарлаа." };
    }

    const cookieStore = await cookies();
    cookieStore.set("last_provider", "apple", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    // New users (no username) need onboarding at /account;
    // existing users go straight to the home page.
    const appleSupabase = await createClient();
    const { data: appleProfile } = await appleSupabase
      .from("profiles")
      .select("username")
      .eq("id", linkData.user.id)
      .single();

    const appleDestination =
      payload.redirectTo && payload.redirectTo !== "/account"
        ? payload.redirectTo
        : appleProfile?.username
          ? "/"
          : "/account";
    return { redirectTo: appleDestination };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { auth_flow: "apple", stage: "sign_in" },
    });
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

  // Check if user has completed onboarding (has a username)
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const safeRedirect =
    redirectTo?.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("://")
      ? redirectTo
      : profile?.username
        ? "/"
        : "/account";

  return { redirectTo: safeRedirect };
}
