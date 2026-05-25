"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
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
import { requestPasswordReset } from "./actions";


export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [state, formAction, isPending] = useActionState(requestPasswordReset, {
    error: "",
    success: false,
  });

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Mail className="size-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("checkEmail")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("checkEmailMessage")}
        </p>
        <p className="mt-6 text-sm">
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    );
  }

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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Mail />}
          {t("submit")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3" />
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
