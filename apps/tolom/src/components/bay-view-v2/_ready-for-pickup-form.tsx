"use client";

import { AlertTriangle, Gauge, MessageSquare, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { TransferBankPicker } from "@/components/banks/transfer-bank-picker";
import { FieldLabel } from "@/components/ui/field";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { getDefaultTransferBank } from "@/lib/payments/org-bank-accounts";
import { reportServerError } from "@/lib/sentry-report-server";
import { cn, formatMNT } from "@/lib/utils";
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
  const t = useTranslations("bayView") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useForm<ReadyForPickupFormValues>({
    resolver: zodResolver(readyForPickupSchema),
    defaultValues: {
      odometer: currentOdometer?.toString() ?? "",
      mechanicNotes: "",
      paymentMethod: "bank_transfer",
      transferBankId: getDefaultTransferBank(transferBanks)?.id ?? "",
    },
  });
  const watchedPaymentMethod = form.watch("paymentMethod");
  const transferBankId = form.watch("transferBankId");
  const odometerValue = Number(form.watch("odometer")) || 0;
  const feePercent = paymentMethodFees[watchedPaymentMethod] ?? 0;
  const feeAmount = useMemo(
    () =>
      computePaymentFeeAmount(
        grandTotal,
        watchedPaymentMethod,
        paymentMethodFees,
      ),
    [grandTotal, watchedPaymentMethod, paymentMethodFees],
  );
  const totalDue = useMemo(
    () =>
      computePaymentTotal(grandTotal, watchedPaymentMethod, paymentMethodFees),
    [grandTotal, watchedPaymentMethod, paymentMethodFees],
  );

  const defaultBank = getDefaultTransferBank(transferBanks);

  // Auto-select default bank when switching to bank_transfer
  useEffect(() => {
    if (
      watchedPaymentMethod === "bank_transfer" &&
      !transferBankId &&
      defaultBank
    ) {
      form.setValue("transferBankId", defaultBank.id);
    }
  }, [watchedPaymentMethod, transferBankId, defaultBank, form.setValue]);

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
      reportServerError("Unexpected error", err);
      setError(
        err instanceof Error ? err.message : t("failedToSavePostServiceData"),
      );
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header — title + subtitle + plate */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 bg-card px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">
            {t("markReady")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("readyForPickupSubtitle")}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground/70">
          {vehiclePlate}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {/* Total due summary */}
            <section className="flex items-center justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Wallet className="size-4 text-muted-foreground/60" />
                {t("total")}
              </span>
              <span className="text-lg font-bold tabular-nums text-primary">
                {formatMNT(totalDue)}
              </span>
            </section>

            {/* Form card */}
            <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
              {/* Odometer */}
              <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
                <FieldLabel
                  htmlFor="rfp-odometer"
                  className="flex items-center gap-2 text-sm font-medium text-foreground/80"
                >
                  <Gauge className="size-4 text-muted-foreground/60" />
                  {t("postServiceOdometer")}
                </FieldLabel>
                <div className="flex items-center gap-1.5">
                  <NumericInput
                    value={odometerValue}
                    placeholder={t("postServiceOdometerPlaceholder")}
                    className="h-9 w-32 rounded-lg border border-border bg-background px-2.5 text-right text-sm font-semibold tabular-nums text-foreground"
                    min={0}
                    autoFocus
                    onChange={(val) =>
                      form.setValue("odometer", val?.toString() ?? "", {
                        shouldValidate: true,
                      })
                    }
                    onBlur={() => form.trigger("odometer")}
                  />
                  <span className="text-xs text-muted-foreground/70">км</span>
                </div>
              </div>

              {/* Mechanic notes */}
              <div className="border-b border-border/50 px-4 py-3">
                <FieldLabel
                  htmlFor="rfp-notes"
                  className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/80"
                >
                  <MessageSquare className="size-4 text-muted-foreground/60" />
                  {t("mechanicNotesLabel")}
                </FieldLabel>
                <Textarea
                  id="rfp-notes"
                  placeholder={t("notePlaceholder")}
                  rows={2}
                  className="min-h-[60px] resize-none rounded-lg border-border bg-background"
                  {...form.register("mechanicNotes")}
                />
              </div>

              {/* Payment method */}
              <div className="px-4 py-3">
                <FieldLabel className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Wallet className="size-4 text-muted-foreground/60" />
                  {t("paymentMethod")}
                </FieldLabel>

                <div className="flex flex-wrap items-center gap-px rounded-lg border border-border/50 bg-muted/40 p-0.5">
                  {PAYMENT_METHODS.map((method) => {
                    const methodFee = paymentMethodFees[method] ?? 0;
                    const isActive = watchedPaymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => form.setValue("paymentMethod", method)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold transition-[color,background-color] duration-200 cursor-pointer sm:flex-none",
                          isActive
                            ? "bg-background text-foreground border border-border/30 shadow-sm"
                            : "text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80",
                        )}
                      >
                        {t(PAYMENT_METHOD_LABEL_KEY[method])}
                        {methodFee > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            (+{methodFee}%)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

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

                {watchedPaymentMethod === "bank_transfer" && (
                  <div className="mt-3">
                    <TransferBankPicker
                      banks={transferBanks}
                      value={transferBankId ?? null}
                      onChange={(bankId) =>
                        form.setValue("transferBankId", bankId)
                      }
                    />
                  </div>
                )}
              </div>
            </section>

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
