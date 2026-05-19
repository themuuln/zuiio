"use client";

import {
  CalendarIcon,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Star,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={cn(
            "p-0.5 rounded-md transition-all duration-150 hover:scale-110 active:scale-95",
            star <= (value ?? 0)
              ? "text-amber-400 drop-shadow-sm"
              : "text-muted-foreground/20 hover:text-muted-foreground/40",
          )}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-7",
              star <= (value ?? 0) ? "fill-amber-400" : "",
            )}
          />
        </button>
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
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useClientNow();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        customerSatisfaction: satisfaction,
        customerFeedback: feedback.trim(),
        nextAppointmentDate: appointmentDate || null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete work order",
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm py-4"
      onClick={onCancel}
      onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-label={t("pickupCompleteTitle")}
      tabIndex={-1}
    >
      <Card
        className="mx-4 w-full max-w-md shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            {t("pickupCompleteTitle")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-1">
              {vehiclePlate}
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md p-1 hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 pt-4">
          {/* Satisfaction */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Star className="size-3.5" />
              {t("pickupSummarySatisfaction")}
            </Label>
            <StarRating value={satisfaction} onChange={setSatisfaction} />
          </div>

          {/* Feedback */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              {t("pickupSummaryFeedback")}
            </Label>
            <Input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`${t("pickupSummaryFeedback")}...`}
              className="h-10"
            />
          </div>

          {/* Next appointment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {t("pickupSummaryAppointmentDate")}
            </Label>
            <Input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="h-10"
              min={now.toISOString().split("T")[0]}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={onCancel} size="lg" disabled={saving}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} size="lg" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {saving ? t("saving") : t("complete")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
