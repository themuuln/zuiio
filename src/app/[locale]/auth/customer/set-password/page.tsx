"use client";

import {
  Car,
  CheckCircle2,
  Loader2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { setCustomerPassword } from "./actions";


export default function CustomerSetPasswordPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, formAction, isPending] = useActionState(setCustomerPassword, {
    error: "",
    success: false,
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No access token provided. Please use the link from your email or
            SMS.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound className="size-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-lg">
            {state?.success
              ? t("portal.accountCreated")
              : t("portal.createAccount")}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {state?.success ? "" : t("portal.createAccountDesc")}
          </p>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <p className="text-sm text-muted-foreground text-center">
                {t("portal.passwordSet")}
              </p>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="token" value={token} />

              <Field>
                <FieldLabel htmlFor="email">{t("portal.email")}</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">{t("portal.password")}</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  {t("portal.confirmPassword")}
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </Field>

              {state?.error && (
                <FieldError className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {state.error}
                </FieldError>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                )}
                {t("portal.createAccount")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
