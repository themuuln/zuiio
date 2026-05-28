"use client";

import { useCallback, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWizardContext } from "./wizard-context";
import { Typography } from "@/components/ui/typography";

/** Strip non-digits and keep up to 8 digits */
function formatPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function QuickCreateCustomerSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const canSubmit = !ctx.creatingCustomer && ctx.quickFirstName.trim();

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    ctx.handleQuickCreateCustomer();
  }, [canSubmit, ctx.handleQuickCreateCustomer]);

  if (!open) return null;

  return (
    <div className="rounded-lg border p-4 bg-muted/20">
      <Typography.Text className="text-sm font-medium">
        {t("newCustomer")}
      </Typography.Text>

      <form
        className="mt-3 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("firstName")} <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Bat"
              value={ctx.quickFirstName}
              onChange={(e) => ctx.setQuickFirstName(e.target.value)}
              className="h-11"
              autoFocus
              inputMode="text"
              autoComplete="given-name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  lastNameRef.current?.focus();
                }
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("lastName")}
            </label>
            <Input
              ref={lastNameRef}
              placeholder="e.g. Erdene"
              value={ctx.quickLastName}
              onChange={(e) => ctx.setQuickLastName(e.target.value)}
              className="h-11"
              inputMode="text"
              autoComplete="family-name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  phoneRef.current?.focus();
                }
              }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            {t("phone")}
          </label>
          <Input
            ref={phoneRef}
            placeholder="e.g. 99112233"
            value={ctx.quickPhone}
            onChange={(e) => {
              ctx.setQuickPhone(formatPhone(e.target.value));
            }}
            className="h-11"
            inputMode="tel"
            autoComplete="tel"
            type="tel"
          />
        </div>

        {ctx.customerCreateConflict ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span>{ctx.customerCreateError}</span>
          </div>
        ) : ctx.customerCreateError ? (
          <Typography.Text className="text-sm text-destructive">
            {ctx.customerCreateError}
          </Typography.Text>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              onOpenChange(false);
              ctx.resetQuickCustomerForm();
            }}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {ctx.creatingCustomer ? t("creating") : t("createCustomer")}
          </Button>
        </div>
      </form>
    </div>
  );
}
