"use client";

import { Car, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
// TODO: wrap component using useSearchParams in <Suspense>
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { customerLogin } from "./actions";


export default function CustomerLoginPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/portal";

  const [state, formAction, isPending] = useActionState(customerLogin, {
    error: "",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <Car className="size-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-lg">{t("portal.loginTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t("portal.loginDesc")}
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <Field>
              <FieldLabel htmlFor="email">{t("portal.email")}</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                required
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </Field>

            {state?.error && (
              <FieldError className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {state.error}
              </FieldError>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {t("portal.loginBtn")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {t("portal.staffLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
