"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useActionState, useRef, useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  FingerprintSimpleIcon,
} from "@/components/icons";
import { generateGoogleNonce } from "@/lib/auth/google-nonce";
import {
  getPasskeyErrorMessage,
  isPasskeyCancellation,
  isPasskeySupported,
} from "@/lib/auth/passkey";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { completePasskeySignIn, login, signInWithApple } from "./actions";

function SignInMethodButton({
  provider,
  label,
  onClick,
  loading,
  isLastUsed,
}: {
  provider: "passkey" | "google" | "apple";
  label: string;
  onClick: () => void;
  loading?: boolean;
  isLastUsed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`active-scale flex h-12 w-full items-center justify-center gap-3 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
        isLastUsed
          ? "border-primary/40 bg-primary/5 text-foreground ring-1 ring-primary/30 hover:bg-primary/10"
          : provider === "passkey"
            ? "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
            : provider === "google"
              ? "border-border bg-card text-foreground hover:border-info/30 hover:bg-info/5"
              : "border-border bg-card text-foreground hover:border-muted-foreground/20 hover:bg-muted/80"
      }`}
    >
      {provider === "google" ? (
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      ) : provider === "apple" ? (
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      ) : (
        <FingerprintSimpleIcon size={20} />
      )}
      {loading ? "Нэвтэрч байна…" : label}
    </button>
  );
}

export function LoginForm({
  redirectTo,
  lastProvider,
}: {
  redirectTo?: string;
  lastProvider?: string | null;
}) {
  const router = useRouter();
  const [supabase] = useState(createBrowserSupabaseClient);
  const [state, formAction, isPending] = useActionState(login, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigatingRef = useRef(false);

  /* ── Google OAuth — same-page redirect ────────────────────── */
  async function handleGoogleSignIn() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setOauthError("Google нэвтрэх тохиргоо хийгдээгүй байна.");
      return;
    }

    setOauthLoading("google");
    setOauthError(null);

    try {
      const { rawNonce, hashedNonce } = await generateGoogleNonce();

      // Persist nonce and redirectTo across the same-origin redirect
      sessionStorage.setItem("google_nonce", rawNonce);
      if (redirectTo) {
        sessionStorage.setItem("google_redirectTo", redirectTo);
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/auth/callback/google`,
        response_type: "id_token",
        scope: "openid email profile",
        nonce: hashedNonce,
        prompt: "select_account",
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch {
      setOauthError("Google нэвтрэхэд алдаа гарлаа.");
      setOauthLoading(null);
    }
  }

  if (state?.redirectTo) {
    router.push(state.redirectTo);
    return null;
  }

  async function handlePasskeySignIn() {
    if (!isPasskeySupported()) {
      setOauthError(
        "Энэ хөтөч эсвэл холболт passkey дэмжихгүй байна. HTTPS ашиглаж байгаа эсэхээ шалгана уу.",
      );
      return;
    }

    setPasskeyLoading(true);
    setOauthError(null);

    try {
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) {
        if (!isPasskeyCancellation(error)) {
          setOauthError(getPasskeyErrorMessage(error));
        }
        return;
      }

      const result = await completePasskeySignIn(redirectTo);
      if (result.formError) {
        setOauthError(result.formError);
      } else if (result.redirectTo) {
        navigatingRef.current = true;
        router.push(result.redirectTo);
      }
    } catch {
      setOauthError("Passkey ашиглан нэвтрэхэд алдаа гарлаа.");
    } finally {
      if (!navigatingRef.current) setPasskeyLoading(false);
    }
  }

  /* ── Apple Sign In JS ─────────────────────────────────────── */

  async function handleAppleSignIn() {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if (!clientId) {
      setOauthError("Apple нэвтрэх тохиргоо хийгдээгүй байна.");
      return;
    }

    if (!window.AppleID?.auth) {
      setOauthError(
        "Apple нэвтрэх үйлчилгээ ачаалаагүй байна. Дахин оролдоно уу.",
      );
      return;
    }

    setOauthLoading("apple");
    setOauthError(null);

    try {
      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI: window.location.origin,
        state: "zuiio_auth",
        usePopup: true,
      });

      const data = await window.AppleID.auth.signIn();

      const result = await signInWithApple({
        idToken: data.authorization.id_token,
        redirectTo,
        fullName: data.user?.name
          ? {
              givenName: data.user.name.firstName,
              familyName: data.user.name.lastName,
            }
          : undefined,
      });

      if (result?.formError) {
        setOauthError(result.formError);
      } else if (result?.redirectTo) {
        navigatingRef.current = true;
        router.push(result.redirectTo);
      }
    } catch (err: unknown) {
      // Apple rejects with an error object when user closes the popup
      if (
        err &&
        typeof err === "object" &&
        "error" in err &&
        (err.error === "popup_closed" || err.error === "user_cancelled")
      ) {
        // User cancelled — clear loading, no error
        setOauthLoading(null);
        return;
      }
      setOauthError("Apple нэвтрэхэд алдаа гарлаа.");
    } finally {
      if (!navigatingRef.current) setOauthLoading(null);
    }
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {/* Load Apple Sign In JS SDK */}
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
      />

      <div className="flex animate-fade-in flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Нэвтрэх
          </h1>
          <p className="text-sm text-muted-foreground">
            Zuiio бүтээгдэхүнд нэвтрэхийн тулд нэвтэрнэ үү
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <SignInMethodButton
            provider="passkey"
            label="Passkey ашиглан нэвтрэх"
            onClick={() => void handlePasskeySignIn()}
            loading={passkeyLoading}
            isLastUsed={lastProvider === "passkey"}
          />
          <SignInMethodButton
            provider="google"
            label="Google-ээр нэвтрэх"
            onClick={handleGoogleSignIn}
            loading={oauthLoading === "google"}
            isLastUsed={lastProvider === "google"}
          />
          <SignInMethodButton
            provider="apple"
            label="Apple-аар нэвтрэх"
            onClick={handleAppleSignIn}
            loading={oauthLoading === "apple"}
            isLastUsed={lastProvider === "apple"}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Төхөөрөмжийн нууц үггүйгээр нэвтрэх
        </p>

        {oauthError && (
          <div
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {oauthError}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-xs uppercase text-muted-foreground">
              эсвэл
            </span>
          </div>
        </div>

        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="identifier"
              className="text-sm font-medium text-foreground"
            >
              Имэйл эсвэл нэр
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username email"
              required
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              placeholder="name@example.com эсвэл нэр"
            />
            {state?.fieldErrors?.identifier && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.identifier[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Нууц үг
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
              >
                Нууц үг мартсан?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="h-10 w-full rounded-lg border border-input bg-card px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
              >
                {showPassword ? (
                  <EyeSlashIcon size={16} />
                ) : (
                  <EyeIcon size={16} />
                )}
              </button>
            </div>
            {state?.fieldErrors?.password && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          {state?.formError && (
            <div className="animate-slide-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.formError}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-input bg-card text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            Намайг сана
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="active-scale flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && (
              <svg
                className="size-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isPending ? "Нэвтэрч байна…" : "Нэвтрэх"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Бүртгэлгүй юу?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
          >
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </>
  );
}
