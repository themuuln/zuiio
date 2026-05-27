"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import { signup } from "./actions";

export default function SignupPage() {
  const t = useTranslations("auth.signup");
  const authT = useTranslations("auth");
  const [state, formAction, isPending] = useActionState(signup, {});

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError, { duration: 5000 });
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  const fieldErrors = state?.fieldErrors ?? {};

  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <form action={formAction}>
        <FieldGroup>
          {state?.formError && (
            <FieldError key={state.formError}>{state.formError}</FieldError>
          )}

          <Field>
            <FieldLabel htmlFor="organizationName">
              {t("organizationLabel")}
            </FieldLabel>
            <Input
              id="organizationName"
              name="organizationName"
              type="text"
              autoComplete="organization"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={t("organizationPlaceholder")}
              aria-invalid={"organizationName" in fieldErrors || undefined}
            />
            {"organizationName" in fieldErrors && (
              <FieldError>{fieldErrors.organizationName}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="fullName">{t("fullNameLabel")}</FieldLabel>
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
            <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              aria-invalid={"email" in fieldErrors || undefined}
            />
            {"email" in fieldErrors && (
              <FieldError>{fieldErrors.email}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              aria-invalid={"password" in fieldErrors || undefined}
            />
            {"password" in fieldErrors && (
              <FieldError>{fieldErrors.password}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              {t("confirmPasswordLabel")}
            </FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmPasswordPlaceholder")}
              aria-invalid={"confirmPassword" in fieldErrors || undefined}
            />
            {"confirmPassword" in fieldErrors && (
              <FieldError>{fieldErrors.confirmPassword}</FieldError>
            )}
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
              {t("submit")}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("haveAccount")}{" "}
              <Link
                href="/auth/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {authT("signIn")}
              </Link>
            </p>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
