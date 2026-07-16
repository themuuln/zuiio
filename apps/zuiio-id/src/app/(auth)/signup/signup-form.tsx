"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { signup } from "./actions";
import { signInWithGoogle, signInWithApple } from "@/app/(auth)/login/actions";
import { generateGoogleNonce } from "@/lib/auth/google-nonce";

function OAuthButton({
  provider,
  label,
  onClick,
  loading,
}: {
  provider: "google" | "apple";
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`active-scale flex h-12 w-full items-center justify-center gap-3 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
        provider === "google"
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
      ) : (
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      )}
      {loading ? "Нэвтэрч байна…" : label}
    </button>
  );
}

export function SignupForm({
  product,
  returnTo,
}: {
  product?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signup, undefined);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [gsiInitialized, setGsiInitialized] = useState(false);
  const gsiInitializationRef = useRef(false);

  /* ── Google Identity Services — initialize when the SDK is ready ── */
  async function initializeGoogleSignIn() {
    const googleId = window.google?.accounts?.id;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleId || !clientId || gsiInitializationRef.current) {
      return;
    }

    gsiInitializationRef.current = true;

    try {
      const { rawNonce, hashedNonce } = await generateGoogleNonce();

      googleId.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        callback: async (response: { credential: string }) => {
          setOauthLoading("google");
          setOauthError(null);
          try {
            const idToken = response.credential;
            if (!idToken) {
              setOauthError("Google нэвтрэхэд алдаа гарлаа.");
              return;
            }

            const result = await signInWithGoogle(idToken, rawNonce);
            if (result?.formError) setOauthError(result.formError);
            else if (result?.redirectTo) router.push(result.redirectTo);
          } catch {
            setOauthError("Google нэвтрэхэд алдаа гарлаа.");
          } finally {
            setOauthLoading(null);
          }
        },
      });

      setGsiInitialized(true);
      googleId.prompt();
    } catch {
      gsiInitializationRef.current = false;
      setOauthError("Google нэвтрэх үйлчилгээ ачаалагдсангүй.");
    }
  }

  if (state?.redirectTo) {
    window.location.href = state.redirectTo;
    return null;
  }

  /* ── Google Identity Services — button click handler ────── */

  function handleGoogleSignIn() {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setOauthError("Google нэвтрэх тохиргоо хийгдээгүй байна.");
      return;
    }

    if (!gsiInitialized || !window.google?.accounts?.id) {
      setOauthError(
        "Google нэвтрэх үйлчилгээ ачаалаагүй байна. Дахин оролдоно уу.",
      );
      return;
    }

    setOauthLoading("google");
    setOauthError(null);

    window.google.accounts.id.prompt();
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
      setOauthLoading(null);
    }
  }

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <>
      {/* Load Google Identity Services and Apple Sign In JS SDK */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => void initializeGoogleSignIn()}
      />
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
      />

      <div className="flex animate-fade-in flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Бүртгүүлэх
          </h1>
          <p className="text-sm text-muted-foreground">Zuiio бүртгэл үүсгэх</p>
        </div>

        <div className="flex flex-col gap-3">
          <OAuthButton
            provider="google"
            label="Google-ээр бүртгүүлэх"
            onClick={handleGoogleSignIn}
            loading={oauthLoading === "google"}
          />
          <OAuthButton
            provider="apple"
            label="Apple-аар бүртгүүлэх"
            onClick={handleAppleSignIn}
            loading={oauthLoading === "apple"}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Хурдан бүртгүүлэх бол Google эсвэл Apple ашиглана уу
        </p>

        {oauthError && (
          <div className="animate-slide-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {oauthError}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">эсвэл</span>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          {product && <input type="hidden" name="product" value={product} />}
          {returnTo && (
            <input type="hidden" name="return_to" value={returnTo} />
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-foreground"
            >
              Бүтэн нэр
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              placeholder="Батбилэг Ц"
            />
            {state?.fieldErrors?.fullName && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.fullName[0]}
              </p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowUsername(!showUsername)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {showUsername ? "Нэр нуух" : "Нэр нэмэх (сонгох)"}
            </button>
            <div
              className="expand-wrapper mt-2"
              data-expanded={String(showUsername)}
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground"
                >
                  Нэр
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  placeholder="batbilig"
                />
                {!state?.fieldErrors?.username && (
                  <p className="text-xs text-muted-foreground">
                    Латин үсэг, тоо, . _ - (3-32 тэмдэгт)
                  </p>
                )}
                {state?.fieldErrors?.username && (
                  <p className="text-xs text-destructive">
                    {state.fieldErrors.username[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Имэйл
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              placeholder="name@example.com"
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Нууц үг
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="h-10 w-full rounded-lg border border-input bg-card px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"
                }
              >
                {showPassword ? (
                  <EyeSlashIcon size={16} />
                ) : (
                  <EyeIcon size={16} />
                )}
              </button>
            </div>
            {!state?.fieldErrors?.password && (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground">Шаардлагууд:</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  <li>Хамгийн багадаа 8 тэмдэгт</li>
                  <li>Дор хаяж нэг том үсэг (A-Z)</li>
                  <li>Дор хаяж нэг жижиг үсэг (a-z)</li>
                  <li>Дор хаяж нэг тоо (0-9)</li>
                </ul>
              </div>
            )}
            {state?.fieldErrors?.password && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-foreground"
            >
              Нууц үг давтах
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="h-10 w-full rounded-lg border border-input bg-card px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"
                }
              >
                {showPassword ? (
                  <EyeSlashIcon size={16} />
                ) : (
                  <EyeIcon size={16} />
                )}
              </button>
            </div>
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          {state?.formError && (
            <div className="animate-slide-up rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="active-scale h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Бүртгүүлж байна…" : "Бүртгүүлэх"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Бүртгэлтэй юу?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground transition-colors hover:text-primary hover:underline"
          >
            Нэвтрэх
          </Link>
        </p>
      </div>
    </>
  );
}
