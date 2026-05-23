"use client";

import { Loader2, LogIn } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { setCookie } from "@/lib/utils";
import { login } from "./actions";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const authT = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(login, { error: "" });

  const handleLanguageSwitch = (newLocale: "mn" | "en") => {
    if (newLocale === locale) return;
    setCookie("NEXT_LOCALE", newLocale, 365);
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Card Header with Title and Language Switcher */}
      <div className="flex items-start justify-between border-b border-border pb-3">
        <div className="text-left">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex border border-border p-0.5 bg-muted/30">
          <button
            type="button"
            onClick={() => handleLanguageSwitch("mn")}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold transition-all cursor-pointer ${
              locale === "mn"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            MN
          </button>
          <button
            type="button"
            onClick={() => handleLanguageSwitch("en")}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold transition-all cursor-pointer ${
              locale === "en"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <form action={formAction}>
        <FieldGroup className="gap-3.5">
          {state?.error && (
            <FieldError className="border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-[10px] font-mono">
              {state.error}
            </FieldError>
          )}
          <Field className="gap-1">
            <FieldLabel
              htmlFor="email"
              className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono font-bold"
            >
              {t("emailLabel")}
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t("emailPlaceholder")}
              className="font-mono text-xs bg-muted/10 focus-visible:bg-transparent h-8 min-h-0"
            />
          </Field>
          <Field className="gap-1">
            <div className="flex items-center justify-between">
              <FieldLabel
                htmlFor="password"
                className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono font-bold"
              >
                {t("passwordLabel")}
              </FieldLabel>
              <Link
                href="/auth/forgot-password"
                className="text-[9px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline font-mono"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder={t("passwordPlaceholder")}
              className="font-mono text-xs bg-muted/10 focus-visible:bg-transparent h-8 min-h-0"
            />
          </Field>
          <Field className="mt-1">
            <Button
              type="submit"
              size="sm"
              className="w-full flex items-center justify-center gap-1.5 group/btn cursor-pointer h-8 min-h-0"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <LogIn className="size-3 group-hover/btn:translate-x-0.5 transition-transform" />
              )}
              <span className="uppercase tracking-wider font-mono text-[9px] font-bold">
                {t("submit")}
              </span>
            </Button>

            <p className="mt-3 text-center text-[10px] text-muted-foreground font-sans">
              {t("noAccount")}{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {authT("signUp")}
              </Link>
            </p>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
