"use client";

import { Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPassword } from "./actions";
import { Typography } from "@/components/ui/typography";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const [state, formAction, isPending] = useActionState(resetPassword, {});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fieldErrors = state?.fieldErrors ?? {};

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError);
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  return (
    <div>
      <div className="mb-6 text-center">
        <Typography.H2 className="text-lg font-semibold text-foreground">{t("title")}</Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</Typography.Muted>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        {state?.formError && <FieldError>{state.formError}</FieldError>}
        <Field>
          <FieldLabel htmlFor="password">
            {t("passwordLabel")} <span className="text-destructive">*</span>
          </FieldLabel>
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
            {t("confirmPasswordLabel")}{" "}
            <span className="text-destructive">*</span>
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Lock />}
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
