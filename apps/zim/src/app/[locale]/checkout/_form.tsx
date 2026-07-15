"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CheckoutState, checkoutAction } from "./actions";

export function CheckoutForm({
  packageId,
  locale,
}: {
  packageId: string;
  locale: string;
}) {
  const t = useTranslations("checkout");
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    checkoutAction,
    {},
  );

  const errorMessage =
    state.error === "invalid_email"
      ? t("invalidEmail")
      : state.error === "invalid_phone"
        ? t("invalidPhone")
        : state.error
          ? t("errorGeneric")
          : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="packageId" value={packageId} />
      <input type="hidden" name="locale" value={locale} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="numeric"
          placeholder="99112233"
        />
        <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
