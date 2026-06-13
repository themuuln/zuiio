"use client";

import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useRecordRefund } from "@/lib/queries/use-refunds";
import { formatMNT } from "@/lib/utils";
import {
  type RecordRefundInput,
  recordRefundSchema,
} from "@/lib/validation/refunds";

const REFUND_REASONS = [
  "service_cancelled",
  "overcharge",
  "quality_issue",
  "duplicate_charge",
  "warranty",
  "customer_complaint",
  "other",
] as const;

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  orgId: string;
  invoiceTotal: number;
  amountPaid: number;
  amountRefunded: number;
  invoiceNumber: string;
}

export function RefundDialog({
  open,
  onOpenChange,
  invoiceId,
  orgId,
  invoiceTotal,
  amountPaid,
  amountRefunded,
  invoiceNumber,
}: RefundDialogProps) {
  const t = useTranslations();
  const recordRefund = useRecordRefund(orgId);
  const [step, setStep] = useState<"form" | "confirm">("form");

  const maxRefundable = amountPaid - amountRefunded;

  const form = useForm({
    resolver: zodResolver(recordRefundSchema),
    defaultValues: {
      invoice_id: invoiceId,
      amount: maxRefundable,
      method: "cash" as const,
      reason: "",
      reference: "",
      notes: "",
    },
  });

  const watchedAmount = form.watch("amount");
  const watchedMethod = form.watch("method");
  const watchedReason = form.watch("reason");

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setStep("form");
      form.reset();
    }
    onOpenChange(value);
  };

  const onSubmitForm = () => {
    setStep("confirm");
  };

  const onConfirmRefund = async (data: RecordRefundInput) => {
    try {
      await recordRefund.mutateAsync({
        invoice_id: data.invoice_id,
        amount: data.amount,
        method: data.method,
        reason: data.reason,
        reference: data.reference,
        notes: data.notes,
      });
      form.reset();
      setStep("form");
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      service_cancelled: t("refund.reasonServiceCancelled"),
      overcharge: t("refund.reasonOvercharge"),
      quality_issue: t("refund.reasonQualityIssue"),
      duplicate_charge: t("refund.reasonDuplicateCharge"),
      warranty: t("refund.reasonWarranty"),
      customer_complaint: t("refund.reasonCustomerComplaint"),
      other: t("refund.reasonOther"),
    };
    return labels[reason] ?? reason;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t("payment.cash"),
      card: t("payment.card"),
      bank_transfer: t("payment.bankTransfer"),
      store_credit: t("invoice.storeCredit"),
    };
    return labels[method] ?? method;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-5" />
            {t("invoice.recordRefund")}
          </DialogTitle>
          <DialogDescription>
            {t("invoice.refundDesc")} — #{invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form
            onSubmit={form.handleSubmit(onSubmitForm)}
            className="space-y-4"
          >
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoice.total")}
                </span>
                <span className="font-medium">{formatMNT(invoiceTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoice.totalPaid")}
                </span>
                <span className="font-medium">{formatMNT(amountPaid)}</span>
              </div>
              {amountRefunded > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("invoice.totalRefunded")}
                  </span>
                  <span className="font-medium text-muted-foreground">
                    -{formatMNT(amountRefunded)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">
                  {t("invoice.maxRefundable")}
                </span>
                <span className="font-semibold text-primary">
                  {formatMNT(maxRefundable)}
                </span>
              </div>
            </div>

            <Field>
              <FieldLabel>{t("invoice.refundAmount")}</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0.01}
                  max={maxRefundable}
                  step={0.01}
                  value={form.watch("amount")}
                  onChange={(e) =>
                    form.setValue(
                      "amount",
                      Number.parseFloat(e.target.value) || 0,
                    )
                  }
                />
                <FieldError
                  {...(form.formState.errors.amount
                    ? {
                        errors: [
                          { message: form.formState.errors.amount.message },
                        ],
                      }
                    : {})}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("invoice.refundMethod")}</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("method")}
                  onValueChange={(value) =>
                    form.setValue(
                      "method",
                      value as RecordRefundInput["method"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("payment.cash")}</SelectItem>
                    <SelectItem value="card">{t("payment.card")}</SelectItem>
                    <SelectItem value="bank_transfer">
                      {t("payment.bankTransfer")}
                    </SelectItem>
                    <SelectItem value="store_credit">
                      {t("invoice.storeCredit")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError
                  {...(form.formState.errors.method
                    ? {
                        errors: [
                          { message: form.formState.errors.method.message },
                        ],
                      }
                    : {})}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("invoice.refundReason")}</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("reason")}
                  onValueChange={(value) =>
                    form.setValue("reason", value ?? "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("invoice.refundReasonPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {REFUND_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {getReasonLabel(reason)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError
                  {...(form.formState.errors.reason
                    ? {
                        errors: [
                          { message: form.formState.errors.reason.message },
                        ],
                      }
                    : {})}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("invoice.refundReference")}</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={t("invoice.refundReferencePlaceholder")}
                  value={form.watch("reference")}
                  onChange={(e) => form.setValue("reference", e.target.value)}
                />
                <FieldError
                  {...(form.formState.errors.reference
                    ? {
                        errors: [
                          { message: form.formState.errors.reference.message },
                        ],
                      }
                    : {})}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("common.notes")}</FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder={t("invoice.refundNotesPlaceholder")}
                  className="resize-none"
                  rows={2}
                  value={form.watch("notes")}
                  onChange={(e) => form.setValue("notes", e.target.value)}
                />
                <FieldError
                  {...(form.formState.errors.notes
                    ? {
                        errors: [
                          { message: form.formState.errors.notes.message },
                        ],
                      }
                    : {})}
                />
              </FieldContent>
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={maxRefundable <= 0}>
                {t("common.continue")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>{t("refund.confirmTitle")}</AlertTitle>
              <AlertDescription>
                {t("refund.confirmDescription")}
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoice.refundAmount")}
                </span>
                <span className="font-semibold text-destructive">
                  -{formatMNT(watchedAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("invoice.refundMethod")}
                </span>
                <span>{getMethodLabel(watchedMethod ?? "cash")}</span>
              </div>
              {watchedReason && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("invoice.refundReason")}
                  </span>
                  <span>{getReasonLabel(watchedReason)}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("form")}
              >
                {t("common.back")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => form.handleSubmit(onConfirmRefund)()}
                disabled={recordRefund.isPending}
              >
                {recordRefund.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                {t("invoice.confirmRefund")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
