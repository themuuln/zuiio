"use client";

import { useLocale, useTranslations } from "next-intl";
import { BankLogo } from "@/components/banks/bank-logo";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Typography } from "@/components/ui/typography";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { cn } from "@/lib/utils";

interface TransferBankPickerProps {
  banks: ResolvedTransferBank[];
  value: string | null;
  onChange: (bankId: string) => void;
  error?: string;
}

export function TransferBankPicker({
  banks,
  value,
  onChange,
  error,
}: TransferBankPickerProps) {
  const t = useTranslations("bayView");
  const locale = useLocale();

  if (banks.length === 0) {
    return (
      <Typography.Muted className="text-[11px]">
        {t("transferBankNotConfigured")}
      </Typography.Muted>
    );
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel className="text-xs font-semibold text-muted-foreground">
        {t("transferBank")}
      </FieldLabel>
      <FieldContent>
        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label={t("transferBank")}
        >
          {banks.map((bank) => {
            const selected = value === bank.id;
            const label = locale === "mn" ? bank.nameMn : bank.nameEn;
            return (
              <button
                key={bank.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(bank.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border/60 bg-card/50 hover:bg-muted/30",
                )}
              >
                <BankLogo bank={bank} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">
                    {label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    {bank.accountNumber}
                  </span>
                  {bank.accountHolder && (
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {bank.accountHolder}
                    </span>
                  )}
                </span>
                {bank.isDefault && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {t("transferBankDefault")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {error && <FieldError>{error}</FieldError>}
      </FieldContent>
    </Field>
  );
}
