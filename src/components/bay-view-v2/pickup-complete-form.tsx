"use client";

import { CalendarIcon, Loader2, MessageSquare, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { AppointmentDatePicker } from "@/components/ui/appointment-date-picker";
import { Input } from "@/components/ui/input";
import { useClientNow } from "@/hooks/use-client-now";
import { useForm } from "@/lib/hooks/use-form";
import { cn } from "@/lib/utils";

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
  woId: string;
  vehiclePlate: string;
  totalCost: number;
  onConfirm: (data: PickupCompleteData) => Promise<void>;
  onCancel: () => void;
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
  woId: _woId,
  vehiclePlate,
  totalCost: _totalCost,
  onConfirm,
  onCancel,
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const onSubmit = form.handleSubmit(async (data) => {
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
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {t("pickupCompleteTitle")}
        </h3>
        <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-1">
          {vehiclePlate}
        </span>
      </div>
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
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-between pt-2 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onSubmit}
          size="sm"
          disabled={saving}
          className="text-muted-foreground text-xs"
        >
          {t("skipReview")}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            type="button"
            size="default"
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" size="default" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
            {saving ? t("saving") : t("complete")}
          </Button>
        </div>
      </div>
    </form>
  );
}
