"use client";

import { AlertTriangle, Gauge, MessageSquare, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { TransferBankPicker } from "@/components/banks/transfer-bank-picker";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { NumericInput } from "@/components/ui/numeric-input";
import { useForm } from "@/lib/hooks/use-form";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { getDefaultTransferBank } from "@/lib/payments/org-bank-accounts";
import { formatMNT } from "@/lib/utils";
import { DialogActions } from "./_dialog-actions";
import {
  computePaymentFeeAmount,
  computePaymentTotal,
  type PaymentMethodFees,
} from "./_payment-fees";
import { type BayPaymentMethod, PAYMENT_METHODS } from "./_schema";

// ── Schema ───────────────────────────────────────────────────

const readyForPickupSchema = z.object({
  odometer: z.string().optional(),
  mechanicNotes: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transferBankId: z.string().optional(),
});

type ReadyForPickupFormValues = z.infer<typeof readyForPickupSchema>;

// ── Types ──────────────────────────────────────────────────

interface ReadyForPickupFormData {
  odometerReading: number | null;
  mechanicNotes: string;
  paymentMethod: BayPaymentMethod;
  transferBankId: string | null;
}

interface ReadyForPickupFormProps {
  vehiclePlate: string;
  currentOdometer: number | null;
  grandTotal: number;
  paymentMethodFees: PaymentMethodFees;
  transferBanks: ResolvedTransferBank[];
  onConfirm: (data: ReadyForPickupFormData) => Promise<void>;
  onBack: () => void;
}

const PAYMENT_METHOD_LABEL_KEY: Record<BayPaymentMethod, string> = {
  cash: "cash",
  card: "card",
  bank_transfer: "bankTransfer",
  manual: "manual",
};

// ── Component ──────────────────────────────────────────────

export function ReadyForPickupForm({
  vehiclePlate,
  currentOdometer,
  grandTotal,
  paymentMethodFees,
  transferBanks,
  onConfirm,
  onBack,
}: ReadyForPickupFormProps) {
  const t = useTranslations("bayView");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultTransferBank = getDefaultTransferBank(transferBanks);

  const form = useForm<ReadyForPickupFormValues>({
    defaultValues: {
      odometer: currentOdometer?.toString() ?? "",
      mechanicNotes: "",
      paymentMethod: "bank_transfer",
      transferBankId: defaultTransferBank?.id ?? "",
    },
  });


  const paymentMethod = form.watch("paymentMethod");
  const transferBankId = form.watch("transferBankId");
  const odometerValue = Number(form.watch("odometer")) || 0;
  const feePercent = paymentMethodFees[paymentMethod] ?? 0;
  const feeAmount = useMemo(
    () => computePaymentFeeAmount(grandTotal, paymentMethod, paymentMethodFees),
    [grandTotal, paymentMethod, paymentMethodFees],
  );
  const totalDue = useMemo(
    () => computePaymentTotal(grandTotal, paymentMethod, paymentMethodFees),
    [grandTotal, paymentMethod, paymentMethodFees],
  );

  const defaultBank = getDefaultTransferBank(transferBanks);

  // Auto-select default bank when switching to bank_transfer
  useEffect(() => {
    if (paymentMethod === "bank_transfer" && !transferBankId && defaultBank) {
      form.setValue("transferBankId", defaultBank.id);
    }
  }, [paymentMethod, transferBankId, defaultBank, form.setValue]);

  const onSubmit = form.handleSubmit(async (data) => {
    const odometerReading = data.odometer?.trim()
      ? parseInt(data.odometer, 10)
      : null;

    if (
      data.odometer?.trim() &&
      (odometerReading === null ||
        Number.isNaN(odometerReading) ||
        odometerReading < 0)
    ) {
      setError(
        t("pleaseEnterValidOdometer") ||
          "Please enter a valid odometer reading",
      );
      return;
    }

    if (
      data.paymentMethod === "bank_transfer" &&
      transferBanks.length > 0 &&
      !data.transferBankId
    ) {
      setError(t("transferBankRequired"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        odometerReading,
        mechanicNotes: data.mechanicNotes?.trim() ?? "",
        paymentMethod: data.paymentMethod,
        transferBankId: data.transferBankId || null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("failedToSavePostServiceData"),
      );
      setSaving(false);
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h3 className="text-sm font-semibold">{t("markReady")}</h3>
        <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-1">
          {vehiclePlate}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
        {/* Scrollable content */}
        <div className="flex flex-col gap-4 px-4 pb-4 overflow-y-auto flex-1">
          {/* Odometer */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Gauge className="size-4" />
              {t("postServiceOdometer")}
            </FieldLabel>
            <FieldContent>
              <div className="relative max-w-full">
                <NumericInput
                  value={odometerValue}
                  placeholder={t("postServiceOdometerPlaceholder")}
                  className="h-10 pr-10"
                  min={0}
                  onChange={(val) => form.setValue("odometer", val?.toString() ?? "", { shouldValidate: true })}
                  onBlur={() => form.trigger("odometer")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                  км
                </span>
              </div>
            </FieldContent>
            </Field>

          {/* Mechanic notes */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t("mechanicNotesLabel")}
            </FieldLabel>
            <FieldContent>
              <Textarea
                placeholder={t("notePlaceholder")}
                rows={3}
                className="min-h-[72px] resize-none"
                {...form.register("mechanicNotes")}
              />
            </FieldContent>
          </Field>

          {/* Payment method */}
          <div className="flex flex-col gap-3">
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Wallet className="size-4" />
                {t("paymentMethod")}
              </FieldLabel>
              <FieldContent>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) =>
                    form.setValue("paymentMethod", val as BayPaymentMethod)
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue>
                      {t(PAYMENT_METHOD_LABEL_KEY[paymentMethod])}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => {
                      const methodFee = paymentMethodFees[method] ?? 0;
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

                {grandTotal > 0 && (
                  <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("paymentSubtotal")}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatMNT(grandTotal)}
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

                {grandTotal <= 0 && (
                  <Typography.Muted className="text-[11px]">
                    {t("paymentNoFeeOnZero")}
                  </Typography.Muted>
                )}
              </FieldContent>
            </Field>

            {paymentMethod === "bank_transfer" && (
              <TransferBankPicker
                banks={transferBanks}
                value={transferBankId ?? null}
                onChange={(bankId) => form.setValue("transferBankId", bankId)}
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3">
              <AlertTriangle className="mt-1 size-4 shrink-0 text-red-500" />
              <Typography.Text className="text-xs text-red-700 dark:text-red-400">
                {error}
              </Typography.Text>
            </div>
          )}
        </div>

        {/* Sticky actions at bottom */}
        <DialogActions
          onCancel={onBack}
          saving={saving}
          cancelLabel={t("cancel")}
          confirmLabel={t("markReady")}
          savingLabel={t("postServiceSaving")}
        />
      </form>
    </div>
  );
}
