"use client";

import { AlertTriangle, CalendarIcon, MessageSquare, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { AppointmentDatePicker } from "@/components/ui/appointment-date-picker";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { useForm } from "@/lib/hooks/use-form";
import { cn } from "@/lib/utils";
import { DialogActions } from "./_dialog-actions";

// ── Schema ───────────────────────────────────────────────────

const pickupCompleteSchema = z.object({
  satisfaction: z.number().nullable(),
  feedback: z.string().optional(),
  appointmentDate: z.string().optional(),
});

type PickupCompleteFormValues = z.infer<typeof pickupCompleteSchema>;

// ── Types ──────────────────────────────────────────────────

export interface PickupCompleteData {
  customerSatisfaction: number | null;
  customerFeedback: string;
  nextAppointmentDate: string | null;
}

interface PickupCompleteFormProps {
  vehiclePlate: string;
  onConfirm: (data: PickupCompleteData) => Promise<void>;
  onBack: () => void;
}

// ── Star Rating Component ────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          variant="ghost"
          size="sm"
          onClick={() => onChange(star)}
          className={cn(
            "p-1 h-auto rounded-md hover:scale-110 active:scale-95",
            star <= (value ?? 0)
              ? "text-amber-400 drop-shadow-sm"
              : "text-muted-foreground/20 hover:text-muted-foreground/40",
          )}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-8",
              star <= (value ?? 0) ? "fill-amber-400" : "",
            )}
          />
        </Button>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────

export function PickupCompleteForm({
  vehiclePlate,
  onConfirm,
  onBack,
}: PickupCompleteFormProps) {
  const t = useTranslations("bayView");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useClientNow();

  const form = useForm<PickupCompleteFormValues>({
    defaultValues: {
      satisfaction: null,
      feedback: "",
      appointmentDate: "",
    },
  });

  const satisfaction = form.watch("satisfaction");
  const appointmentDate = form.watch("appointmentDate");

  const submitHandler = async (data: PickupCompleteFormValues) => {
    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        customerSatisfaction: data.satisfaction,
        customerFeedback: data.feedback?.trim() ?? "",
        nextAppointmentDate: data.appointmentDate || null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete work order",
      );
      setSaving(false);
    }
  };

  const onSubmit = form.handleSubmit(submitHandler);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h3 className="text-sm font-semibold">{t("pickupCompleteTitle")}</h3>
        <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-1">
          {vehiclePlate}
        </span>
      </div>

      <form id="pickup-complete-form" onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
        {/* Scrollable content */}
        <div className="flex flex-col gap-5 px-4 pb-4 overflow-y-auto flex-1">
          {/* Satisfaction */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Star className="size-4" />
              {t("pickupSummarySatisfaction")}
              <span className="text-[10px] font-normal text-muted-foreground/60">
                ({t("optional")})
              </span>
            </FieldLabel>
            <FieldContent>
              <div className="flex items-center gap-3">
                <StarRating
                  value={satisfaction}
                  onChange={(v) => form.setValue("satisfaction", v)}
                />
                {satisfaction != null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => form.setValue("satisfaction", null)}
                  >
                    {t("clearDate")}
                  </Button>
                )}
              </div>
            </FieldContent>
          </Field>

          {/* Feedback */}
          <Field data-invalid={!!form.formState.errors.feedback}>
            <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t("pickupSummaryFeedback")}
              <span className="text-[10px] font-normal text-muted-foreground/60">
                ({t("optional")})
              </span>
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder={`${t("pickupSummaryFeedback")}...`}
                className="h-10"
                aria-invalid={!!form.formState.errors.feedback}
                {...form.register("feedback")}
              />
              {form.formState.errors.feedback && (
                <FieldError>{form.formState.errors.feedback.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Next appointment */}
          <Field data-invalid={!!form.formState.errors.appointmentDate}>
            <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="size-4" />
              {t("pickupSummaryAppointmentDate")}
            </FieldLabel>
            <FieldContent>
              <AppointmentDatePicker
                value={appointmentDate ? new Date(appointmentDate) : undefined}
                onChange={(d) =>
                  form.setValue(
                    "appointmentDate",
                    d ? d.toISOString().split("T")[0] : "",
                  )
                }
                minDate={now}
                className="w-full h-10"
              />
              {form.formState.errors.appointmentDate && (
                <FieldError>
                  {form.formState.errors.appointmentDate.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3">
              <AlertTriangle className="mt-1 size-4 shrink-0 text-red-500" />
              <Typography.Text className="text-xs text-red-700 dark:text-red-400">
                {error}
              </Typography.Text>
            </div>
          )}

          {/* Skip review — submit with current values (optional fields stay empty) */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.handleSubmit(submitHandler)()}
              size="sm"
              disabled={saving}
              className="text-muted-foreground/60 hover:text-muted-foreground text-xs"
            >
              {t("skipReview")}
            </Button>
          </div>
        </div>

        {/* Sticky actions at bottom — outside <form>'s scroll area */}
        <DialogActions
          onCancel={onBack}
          saving={saving}
          cancelLabel={t("cancel")}
          confirmLabel={t("complete")}
          savingLabel={t("saving")}
        />
      </form>
    </div>
  );
}
