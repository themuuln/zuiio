"use client";

import { ArrowRight, Envelope, GoogleLogo, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { login } from "./actions";

const DEV_EMAIL = "themuuln1@gmail.com";
const DEV_PASSWORD = "Tolom!11";

export function LoginForm({
  next,
  error,
  detail,
}: {
  next: string;
  error?: string;
  detail?: string;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(login, undefined);
  const isDev = process.env.NODE_ENV === "development";

  const ssoError =
    error === "sso_failed"
      ? t("auth.error.sso")
      : error === "auth_callback_failed"
        ? t("auth.error.callback")
        : null;
  const urlErrorMessage = ssoError
    ? detail
      ? `${ssoError} (${detail})`
      : ssoError
    : null;

  return (
    <AuthCard
      title={t("auth.login.title")}
      description={t("auth.login.description")}
    >
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
            <div className="relative">
              <Envelope className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                className="pl-9"
                defaultValue={isDev ? DEV_EMAIL : undefined}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="pl-9"
                defaultValue={isDev ? DEV_PASSWORD : undefined}
              />
            </div>
          </Field>
          <div className="-mt-1 flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
        </FieldGroup>
        <ErrorBanner error={urlErrorMessage} />
        <ErrorBanner error={state?.error} />

        <Button type="submit" disabled={pending} className="w-full">
          {t("auth.login.submit")}
          <ArrowRight data-icon="inline-end" />
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {t("common.or")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link href={`/sso?next=${encodeURIComponent(next)}`}>
          <Button type="button" variant="outline" className="w-full gap-2">
            <GoogleLogo className="size-4" weight="bold" />
            {t("auth.login.google")}
          </Button>
        </Link>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.login.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {t("auth.register")}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
