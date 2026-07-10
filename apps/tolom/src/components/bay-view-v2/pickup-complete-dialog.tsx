"use client";

import {
  CalendarIcon,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AppointmentDatePicker } from "@/components/ui/appointment-date-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientNow } from "@/hooks/use-client-now";
import { reportServerError } from "@/lib/sentry-report-server";
import { cn } from "@/lib/utils";

export interface PickupCompleteData {
  customerSatisfaction: number | null;
  customerFeedback: string;
  nextAppointmentDate: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  woId: string;
  vehiclePlate: string;
  totalCost: number;
  onConfirm: (data: PickupCompleteData) => Promise<void>;
}

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
            "p-1 h-auto transition-[color,transform] duration-150 hover:scale-110 active:scale-95",
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

export function PickupCompleteDialog({
  open,
  onOpenChange,
  woId: _woId,
  vehiclePlate,
  totalCost: _totalCost,
  onConfirm,
}: Props) {
  const t = useTranslations("bayView");
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useClientNow();

  // Reset state on open
  useEffect(() => {
    if (open) {
      setSatisfaction(null);
      setFeedback("");
      setAppointmentDate("");
      setSaving(false);
      setError(null);
    }
  }, [open]);

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
      reportServerError("Unexpected error", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete work order",
      );
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4 text-emerald-500" />
            {t("pickupCompleteTitle")}
            <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 px-2 py-1 ml-1">
              {vehiclePlate}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("pickupCompleteTitle")} — {vehiclePlate}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Satisfaction */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Star className="size-4" />
              {t("pickupSummarySatisfaction")}
              <span className="text-[10px] font-normal text-muted-foreground/60">
                ({t("optional")})
              </span>
            </Label>
            <div className="flex items-center gap-3">
              <StarRating value={satisfaction} onChange={setSatisfaction} />
              {satisfaction != null && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setSatisfaction(null)}
                >
                  {t("clearDate")}
                </Button>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t("pickupSummaryFeedback")}
              <span className="text-[10px] font-normal text-muted-foreground/60">
                ({t("optional")})
              </span>
            </Label>
            <Input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`${t("pickupSummaryFeedback")}...`}
            />
          </div>

          {/* Next appointment */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="size-4" />
              {t("pickupSummaryAppointmentDate")}
              <span className="text-[10px] font-normal text-muted-foreground/60">
                ({t("optional")})
              </span>
            </Label>
            <AppointmentDatePicker
              value={appointmentDate ? new Date(appointmentDate) : undefined}
              onChange={(d) =>
                setAppointmentDate(d ? d.toISOString().split("T")[0] : "")
              }
              minDate={now}
              className="w-full"
            />
          </div>

          {/* Error */}
          {error && (
            <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-between pt-2 border-t">
            <Button
              variant="ghost"
              onClick={handleSubmit}
              size="sm"
              disabled={saving}
              className="text-muted-foreground text-xs"
            >
              {t("skipReview")}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                size="default"
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleSubmit} size="default" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
                {saving ? t("saving") : t("complete")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
