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
          className="grid grid-cols-1 gap-2"
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
                  "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  selected
                    ? "bg-muted/40"
                    : "border-border/60 bg-card/50 hover:bg-muted/20",
                )}
                style={
                  selected
                    ? {
                        borderColor: bank.brandColor,
                        backgroundColor: `${bank.brandColor}12`,
                      }
                    : undefined
                }
              >
                <BankLogo bank={bank} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate mb-0.5">
                    {label}
                  </span>
                  <span className="block text-base font-semibold tabular-nums tracking-wide">
                    {bank.accountNumber}
                  </span>
                  {bank.accountHolder && (
                    <span className="block text-xs text-muted-foreground truncate mt-0.5">
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
