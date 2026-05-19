"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { requestPasswordReset } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | TOLOM",
  description: "Reset your password",
};

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
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            {t("emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder={t("emailPlaceholder")}
          />
        </div>
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
