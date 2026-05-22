"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
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
  const [state, formAction, isPending] = useActionState(signup, { error: "" });

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <form action={formAction}>
        <FieldGroup>
          {state?.error && (
            <FieldError>{state.error}</FieldError>
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
              placeholder={t("organizationPlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="fullName">{t("fullNameLabel")}</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder={t("fullNamePlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("emailPlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder={t("passwordPlaceholder")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">{t("confirmPasswordLabel")}</FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder={t("confirmPasswordPlaceholder")}
            />
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
