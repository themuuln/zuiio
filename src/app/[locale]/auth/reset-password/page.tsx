"use client";

import { Loader2, Lock } from "lucide-react";
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
import { resetPassword } from "./actions";


export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const [state, formAction, isPending] = useActionState(resetPassword, {
    error: "",
  });

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        {state?.error && (
          <FieldError>{state.error}</FieldError>
        )}
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Lock />}
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
