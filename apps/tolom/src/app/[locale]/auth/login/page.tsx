"use client";

import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { setCookie } from "@/lib/utils";
import { login } from "./actions";

const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_EMAIL ?? "";
const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_PASSWORD ?? "";

// ── Outer wrapper: Suspense for useSearchParams ──────────────

/**
 * Suspense boundary is REQUIRED by Next.js for any component using
 * `useSearchParams()`. Without it, the page forces full client-side
 * rendering and can crash on hydration when search params are absent.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

/** Minimal skeleton shown while Suspense resolves search params. */
function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse" aria-hidden>
      <div className="h-12 bg-muted/30 rounded-lg" />
      <div className="h-8 bg-muted/30 rounded-lg" />
      <div className="h-8 bg-muted/30 rounded-lg" />
      <div className="h-8 w-24 bg-muted/30 rounded-lg mx-auto" />
    </div>
  );
}

// ── Main login form ──────────────────────────────────────────

function LoginForm() {
  const t = useTranslations("auth.login");
  const authT = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(login, {});
  const [identifier, setIdentifier] = useState(DEV_EMAIL);
  const [password, setPassword] = useState(DEV_PASSWORD);
  const formRef = useRef<HTMLFormElement>(null);

  // Dev auto-submit: log in automatically when dev credentials are set
  useEffect(() => {
    if (DEV_EMAIL && DEV_PASSWORD && !state?.formError && !isPending) {
      const timeout = setTimeout(() => formRef.current?.requestSubmit(), 300);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.formError, isPending]);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") ?? "";

  useEffect(() => {
    if (state?.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }, [state?.redirectTo]);

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError);
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  const fieldErrors = state?.fieldErrors ?? {};

  const handleLanguageSwitch = (newLocale: "mn" | "en") => {
    if (newLocale === locale) return;
    setCookie("NEXT_LOCALE", newLocale, 365);
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Card Header with Title and Language Switcher */}
      <div className="flex items-start justify-between border-b border-border pb-3">
        <div className="text-left">
          <Typography.H2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("title")}
          </Typography.H2>
          <Typography.Muted className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </Typography.Muted>
        </div>

        {/* Language Switcher */}
        <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
          <Button
            variant={locale === "mn" ? "default" : "ghost"}
            size="xs"
            onClick={() => handleLanguageSwitch("mn")}
          >
            MN
          </Button>
          <Button
            variant={locale === "en" ? "default" : "ghost"}
            size="xs"
            onClick={() => handleLanguageSwitch("en")}
          >
            EN
          </Button>
        </div>
      </div>

      <form ref={formRef} action={formAction}>
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}
        <FieldGroup>
          {state?.formError && (
            <FieldError key={state.formError}>{state.formError}</FieldError>
          )}
          <Field className="gap-1">
            <FieldLabel htmlFor="identifier">
              {t("identifierLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="email"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t("identifierPlaceholder")}
              aria-invalid={"identifier" in fieldErrors ? true : undefined}
            />
            {"identifier" in fieldErrors && (
              <FieldError>{fieldErrors.identifier}</FieldError>
            )}
          </Field>
          <Field className="gap-1">
            <FieldLabel htmlFor="password">
              {t("passwordLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                aria-invalid={"password" in fieldErrors ? true : undefined}
                className="pr-9"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {"password" in fieldErrors && (
              <FieldError>{fieldErrors.password}</FieldError>
            )}
            <Link
              href="/auth/forgot-password"
              className="mt-1 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </Field>

          {/* Keep me signed in */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {t("keepMeSignedIn")}
            </Label>
          </div>
          <input
            type="hidden"
            name="rememberMe"
            value={rememberMe ? "true" : ""}
          />

          <Field className="mt-1">
            <Button
              type="submit"
              className="w-full group/btn"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogIn className="group-hover/btn:translate-x-0.5 transition-transform" />
              )}
              {t("submit")}
            </Button>
            <div className="relative flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {authT("orContinueWith")}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full flex items-center justify-center gap-1.5 cursor-not-allowed opacity-70"
            >
              {authT("ssoLogin")}
              <span className="text-xs font-normal text-muted-foreground">
                ({authT("ssoComingSoon")})
              </span>
            </Button>

            <Typography.Muted className="mt-4 text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link
                href={
                  redirectTo
                    ? `/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}`
                    : "/auth/signup"
                }
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {authT("signUp")}
              </Link>
            </Typography.Muted>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
