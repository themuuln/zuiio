"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import { requestPasswordReset } from "./actions";
import { Typography } from "@/components/ui/typography";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    {},
  );
  const [email, setEmail] = useState("");

  const fieldErrors = state?.fieldErrors ?? {};

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError);
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Mail className="size-6 text-muted-foreground" />
        </div>
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {t("checkEmail")}
        </Typography.H2>
        <Typography.Muted className="mt-2 text-sm text-muted-foreground">
          {t("checkEmailMessage")}
        </Typography.Muted>
        <Typography.Text className="mt-6 text-sm">
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </Typography.Text>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <Typography.H2 className="text-lg font-semibold text-foreground">{t("title")}</Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</Typography.Muted>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        {state?.formError && <FieldError>{state.formError}</FieldError>}
        <Field>
          <FieldLabel htmlFor="email">
            {t("emailLabel")} <span className="text-destructive">*</span>
          </FieldLabel>
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Mail />}
          {t("submit")}
        </Button>
      </form>
      <Typography.Text className="mt-6 text-center text-sm">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3" />
          {t("backToLogin")}
        </Link>
      </Typography.Text>
    </div>
  );
}
