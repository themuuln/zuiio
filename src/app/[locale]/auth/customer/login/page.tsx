"use client";

import { Car, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
// TODO: wrap component using useSearchParams in <Suspense>
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div className="space-y-1.5">
              <Label htmlFor="email">{t("portal.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t("portal.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {state?.error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {state.error}
              </div>
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
