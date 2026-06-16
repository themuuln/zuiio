"use client";

import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { TransferBankPicker } from "@/components/banks/transfer-bank-picker";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { getDefaultTransferBank } from "@/lib/payments/org-bank-accounts";
import { formatMNT } from "@/lib/utils";
import {
  computePaymentFeeAmount,
  computePaymentTotal,
  type PaymentMethodFees,
} from "./_payment-fees";
import { type BayPaymentMethod, PAYMENT_METHODS } from "./_schema";

const PAYMENT_METHOD_LABEL_KEY: Record<BayPaymentMethod, string> = {
  cash: "cash",
  card: "card",
  bank_transfer: "bankTransfer",
  manual: "manual",
};

interface PaymentMethodFieldProps {
  value: BayPaymentMethod;
  onChange: (value: BayPaymentMethod) => void;
  transferBankId: string | null;
  onTransferBankChange: (bankId: string) => void;
  subtotal: number;
  fees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  error?: string;
  transferBankError?: string;
}

export function PaymentMethodField({
  value,
  onChange,
  transferBankId,
  onTransferBankChange,
  subtotal,
  fees,
  transferBanks,
  error,
  transferBankError,
}: PaymentMethodFieldProps) {
  const t = useTranslations("bayView");
  const feePercent = fees[value] ?? 0;
  const feeAmount = computePaymentFeeAmount(subtotal, value, fees);
  const totalDue = computePaymentTotal(subtotal, value, fees);
  const defaultBank = getDefaultTransferBank(transferBanks);

  useEffect(() => {
    if (value !== "bank_transfer" || transferBankId || !defaultBank) return;
    onTransferBankChange(defaultBank.id);
  }, [value, transferBankId, defaultBank, onTransferBankChange]);

  return (
    <div className="flex flex-col gap-3">
      <Field data-invalid={!!error}>
        <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <Wallet className="size-4" />
          {t("paymentMethod")}
        </FieldLabel>
        <FieldContent>
          <Select
            value={value}
            onValueChange={(val) => onChange(val as BayPaymentMethod)}
          >
            <SelectTrigger className="h-10" aria-label={t("paymentMethod")}>
              <SelectValue>{t(PAYMENT_METHOD_LABEL_KEY[value])}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => {
                const methodFee = fees[method] ?? 0;
                return (
                  <SelectItem key={method} value={method}>
                    <span className="flex items-center gap-2">
                      {t(PAYMENT_METHOD_LABEL_KEY[method])}
                      {methodFee > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          (+{methodFee}%)
                        </span>
                      )}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {subtotal > 0 && (
            <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("paymentSubtotal")}
                </span>
                <span className="tabular-nums font-medium">
                  {formatMNT(subtotal)}
                </span>
              </div>
              {feeAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("paymentFee", { percent: feePercent })}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatMNT(feeAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/40 pt-1">
                <span className="font-medium">{t("paymentTotal")}</span>
                <span className="tabular-nums font-semibold">
                  {formatMNT(totalDue)}
                </span>
              </div>
            </div>
          )}

          {error && <FieldError>{error}</FieldError>}
          {subtotal <= 0 && (
            <Typography.Muted className="text-[11px]">
              {t("paymentNoFeeOnZero")}
            </Typography.Muted>
          )}
        </FieldContent>
      </Field>

      {value === "bank_transfer" && (
        <TransferBankPicker
          banks={transferBanks}
          value={transferBankId}
          onChange={onTransferBankChange}
          error={transferBankError}
        />
      )}
    </div>
  );
}
