"use client";

import { ArrowLeft, Loader2, Mail, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    {},
  );
  const [identifier, setIdentifier] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const fieldErrors = state?.fieldErrors ?? {};

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError);
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  // Cooldown countdown timer
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0 || !identifier) return;
    setCooldown(30);
    const form = new FormData();
    form.append("identifier", identifier);
    startTransition(() => formAction(form));
    toast.success(t("resentMessage"));
  };

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Mail className="size-6 text-muted-foreground" />
        </div>
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {t("checkEmail")}
        </Typography.H2>
        <Typography.Muted className="mt-2 text-sm text-muted-foreground">
          {t("checkEmailMessage")}
        </Typography.Muted>

        {/* Resend link with cooldown */}
        <div className="mt-4">
          {cooldown > 0 ? (
            <Typography.Muted className="text-xs text-muted-foreground">
              {t("cooldownMessage", { seconds: String(cooldown) })}
            </Typography.Muted>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              <RotateCcw className="size-3" />
              {t("resendLink")}
            </button>
          )}
        </div>

        <Typography.Text className="mt-6 text-sm">
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </Typography.Text>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {t("title")}
        </Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </Typography.Muted>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        {state?.formError && <FieldError>{state.formError}</FieldError>}
        <Field>
          <FieldLabel htmlFor="identifier">
            {t("identifierLabel")} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="email"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("identifierPlaceholder")}
            aria-invalid={"identifier" in fieldErrors || undefined}
          />
          {"identifier" in fieldErrors && (
            <FieldError>{fieldErrors.identifier}</FieldError>
          )}
        </Field>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Mail />}
          {t("submit")}
        </Button>
      </form>
      <Typography.Text className="mt-6 text-center text-sm">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3" />
          {t("backToLogin")}
        </Link>
      </Typography.Text>
    </div>
  );
}
