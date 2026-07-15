"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type LookupState, lookupAction } from "./actions";

export function LookupForm() {
  const t = useTranslations("lookup");
  const [state, formAction, pending] = useActionState<LookupState, FormData>(
    lookupAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="orderCode">{t("orderCode")}</Label>
        <Input
          id="orderCode"
          name="orderCode"
          required
          placeholder={t("orderCodePlaceholder")}
          className="font-mono uppercase"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          inputMode="numeric"
          placeholder="99112233"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{t("notFound")}</p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
