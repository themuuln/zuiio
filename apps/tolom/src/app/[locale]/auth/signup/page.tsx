"use client";

import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { signup } from "./actions";

export default function SignupPage() {
  const t = useTranslations("auth.signup");
  const authT = useTranslations("auth");
  const inviteT = useTranslations("invite");
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") ?? "";
  const hasInvite = redirectTo.startsWith("/invite/");

  const [state, formAction, isPending] = useActionState(signup, {});

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError, { duration: 5000 });
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  const fieldErrors = state?.fieldErrors ?? {};

  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {t("title")}
        </Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">
          {hasInvite ? t("inviteSubtitle") : t("subtitle")}
        </Typography.Muted>
      </div>

      {hasInvite && (
        <Alert variant="default" className="border-primary/30 bg-primary/5">
          <AlertTitle className="text-sm font-medium">
            {inviteT("youAreInvited")}
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            {inviteT("signupHint")}
          </AlertDescription>
        </Alert>
      )}

      <form action={formAction}>
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}
        <FieldGroup>
          {state?.formError && (
            <FieldError key={state.formError}>{state.formError}</FieldError>
          )}

          <Field>
            <FieldLabel htmlFor="fullName">
              {t("fullNameLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              aria-invalid={"fullName" in fieldErrors || undefined}
            />
            {"fullName" in fieldErrors && (
              <FieldError>{fieldErrors.fullName}</FieldError>
            )}
          </Field>

          <Field>
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
              aria-invalid={"identifier" in fieldErrors || undefined}
            />
            {"identifier" in fieldErrors && (
              <FieldError>{fieldErrors.identifier}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">
              {t("passwordLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                aria-invalid={"password" in fieldErrors || undefined}
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
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              {t("confirmPasswordLabel")}{" "}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                aria-invalid={"confirmPassword" in fieldErrors || undefined}
                className="pr-9"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {"confirmPassword" in fieldErrors && (
              <FieldError>{fieldErrors.confirmPassword}</FieldError>
            )}
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
              {t("submit")}
            </Button>
            <Typography.Muted className="mt-4 text-center text-sm text-muted-foreground">
              {t("haveAccount")}{" "}
              <Link
                href={
                  redirectTo
                    ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`
                    : "/auth/login"
                }
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {authT("signIn")}
              </Link>
            </Typography.Muted>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
