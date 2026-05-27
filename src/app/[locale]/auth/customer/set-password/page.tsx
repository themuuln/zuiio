"use client";

import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { setCustomerPassword } from "./actions";

export default function CustomerSetPasswordPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, formAction, isPending] = useActionState(
    setCustomerPassword,
    {},
  );
  const [email, setEmail] = useState("");
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={"email" in fieldErrors || undefined}
                />
                {"email" in fieldErrors && (
                  <FieldError>{fieldErrors.email}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">
                  {t("portal.password")}
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={"password" in fieldErrors || undefined}
                />
                {"password" in fieldErrors && (
                  <FieldError>{fieldErrors.password}</FieldError>
                )}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={"confirmPassword" in fieldErrors || undefined}
                />
                {"confirmPassword" in fieldErrors && (
                  <FieldError>{fieldErrors.confirmPassword}</FieldError>
                )}
              </Field>

              {state?.formError && (
                <FieldError className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {state.formError}
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
