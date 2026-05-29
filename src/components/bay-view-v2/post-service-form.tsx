"use client";

import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronUp,
  Gauge,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
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
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface WorkOrderServiceItem {
  id: string;
  service_name: string;
  service_catalog_id: string | null;
  catalog_interval_months: number | null;
  catalog_interval_km: number | null;
}

interface ServiceFormEntry {
  workOrderServiceId: string;
  serviceName: string;
  serviceCatalogId: string | null;
  intervalMonths: number | null;
  intervalKm: number | null;
  priority: "standard" | "important" | "urgent";
  notes: string;
  expanded: boolean;
}

export interface PostServiceFormData {
  odometerReading: number | null;
  recommendations: Array<{
    workOrderServiceId: string;
    serviceName: string;
    serviceCatalogId: string | null;
    intervalMonths: number | null;
    intervalKm: number | null;
    priority: "standard" | "important" | "urgent";
    notes?: string;
  }>;
  mechanicNotes: string;
}

interface PostServiceFormProps {
  woId: string;
  vehicleId: string;
  vehiclePlate: string;
  currentOdometer: number | null;
  services: WorkOrderServiceItem[];
  newStatus: string;
  onConfirm: (data: PostServiceFormData) => Promise<void>;
  onCancel: () => void;
}

// ── Schema ───────────────────────────────────────────────────

const postServiceSchema = z.object({
  odometer: z.string().optional(),
  mechanicNotes: z.string().optional(),
});

type PostServiceFormValues = z.infer<typeof postServiceSchema>;

// ── Helpers ──────────────────────────────────────────────────

function computeNextDueDate(months: number | null): string | null {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function computeNextDueKm(
  km: number | null,
  odometer: number | null,
): number | null {
  if (!km || !odometer) return null;
  return odometer + km;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatKm(km: number): string {
  return km.toLocaleString("en-US");
}

// ── Component ──────────────────────────────────────────────

export function PostServiceForm({
  woId: _woId,
  vehicleId: _vehicleId,
  vehiclePlate,
  currentOdometer,
  services,
  newStatus,
  onConfirm,
  onCancel,
}: PostServiceFormProps) {
  const t = useTranslations("bayView");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);

  // Build form entries from services (UI state, not form-managed)
  const [entries, setEntries] = useState<ServiceFormEntry[]>(() =>
    services.map((svc) => ({
      workOrderServiceId: svc.id,
      serviceName: svc.service_name,
      serviceCatalogId: svc.service_catalog_id,
      intervalMonths: svc.catalog_interval_months,
      intervalKm: svc.catalog_interval_km,
      priority: "standard" as const,
      notes: "",
      expanded: true,
    })),
  );

  const form = useForm<PostServiceFormValues>({
    resolver: zodResolver(postServiceSchema),
    defaultValues: {
      odometer: currentOdometer?.toString() ?? "",
      mechanicNotes: "",
    },
  });

  // Merge form.register ref with auto-focus ref for odometer
  const odometerRegister = form.register("odometer");
  const mergedOdometerRef = useCallback(
    (el: HTMLInputElement | null) => {
      odometerRegister.ref({ current: el });
      if (el) el.focus();
    },
    [odometerRegister],
  );

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const odometerValue = form.watch("odometer");
  const odometerNum = useMemo(
    () => (odometerValue ? parseInt(odometerValue, 10) : null),
    [odometerValue],
  );
  const hasEntries = entries.length > 0;

  function updateEntry(index: number, updates: Partial<ServiceFormEntry>) {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...updates } : e)),
    );
  }

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
      setError("Please enter a valid odometer reading");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onConfirm({
        odometerReading,
        recommendations: entries.map((e) => ({
          workOrderServiceId: e.workOrderServiceId,
          serviceName: e.serviceName,
          serviceCatalogId: e.serviceCatalogId,
          intervalMonths: e.intervalMonths,
          intervalKm: e.intervalKm,
          priority: e.priority,
          notes: e.notes || undefined,
        })),
        mechanicNotes: data.mechanicNotes?.trim() ?? "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save post-service data",
      );
      setSaving(false);
    }
  });

  const isComplete = newStatus === "Completed";

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Car className="size-4 text-muted-foreground" />
            {isComplete ? t("postServiceCompleteTitle") : t("postServiceTitle")}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-1">
              {vehiclePlate}
            </span>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Odometer */}
          <Field data-invalid={!!form.formState.errors.odometer}>
            <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Gauge className="size-3.5" />
              {t("postServiceOdometer")}
            </FieldLabel>
            <FieldContent>
              <Input
                ref={mergedOdometerRef}
                type="number"
                placeholder={t("postServiceOdometerPlaceholder")}
                className="h-10"
                min={0}
                aria-invalid={!!form.formState.errors.odometer}
                onChange={odometerRegister.onChange}
                onBlur={odometerRegister.onBlur}
                name={odometerRegister.name}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              {form.formState.errors.odometer && (
                <FieldError>
                  {form.formState.errors.odometer.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Services */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3.5" />
                {t("postServiceServicesTitle")}
                <Badge variant="secondary">{entries.length}</Badge>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAllExpanded(!allExpanded)}
                className="gap-0.5 text-[10px] h-auto"
                type="button"
              >
                {allExpanded ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                {allExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>

            {!hasEntries && (
              <Typography.Muted className="text-xs text-muted-foreground/60 italic py-2">
                No services recorded on this work order.
              </Typography.Muted>
            )}

            <div className="flex flex-col gap-2">
              {entries.map((entry, idx) => (
                <ServiceCard
                  key={entry.workOrderServiceId}
                  entry={entry}
                  odometer={odometerNum}
                  onChange={(updates) => updateEntry(idx, updates)}
                />
              ))}
            </div>
          </div>

          {/* Mechanic notes */}
          <Field data-invalid={!!form.formState.errors.mechanicNotes}>
            <FieldLabel className="text-xs font-semibold text-muted-foreground">
              Mechanic Notes
            </FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("notePlaceholder")}
                className="h-10"
                aria-invalid={!!form.formState.errors.mechanicNotes}
                {...form.register("mechanicNotes")}
              />
              {form.formState.errors.mechanicNotes && (
                <FieldError>
                  {form.formState.errors.mechanicNotes.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <Typography.Text className="text-xs text-red-700 dark:text-red-400">
                {error}
              </Typography.Text>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t">
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
              {saving
                ? t("postServiceSaving")
                : isComplete
                  ? t("complete")
                  : t("markReady")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Service Card Sub-Component ────────────────────────────

function ServiceCard({
  entry,
  odometer,
  onChange,
}: {
  entry: ServiceFormEntry;
  odometer: number | null;
  onChange: (updates: Partial<ServiceFormEntry>) => void;
}) {
  const t = useTranslations("bayView");
  const nextDate = computeNextDueDate(entry.intervalMonths);
  const nextKm = computeNextDueKm(entry.intervalKm, odometer);

  const priorityBorderColors: Record<string, string> = {
    standard: "border-l-blue-400/50",
    important: "border-l-amber-400/60",
    urgent: "border-l-red-400/60",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/50 overflow-hidden transition-all duration-200 border-l-2",
        priorityBorderColors[entry.priority],
      )}
    >
      {/* Header — always visible */}
      <Button
        variant="ghost"
        type="button"
        onClick={() => onChange({ expanded: !entry.expanded })}
        className="w-full justify-between px-3 py-2.5 h-auto"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {entry.serviceName}
          </span>
          {/* Priority badge */}
          {entry.priority !== "standard" && (
            <Badge variant="outline">{entry.priority}</Badge>
          )}
        </div>
        {entry.expanded ? (
          <ChevronUp className="size-3.5 shrink-0 text-muted-foreground/50" />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />
        )}
      </Button>

      {entry.expanded && (
        <div className="px-3 pb-3 flex flex-col gap-2.5 border-t border-border/40 pt-2.5">
          {/* Intervals row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`post-service-interval-months-${entry.workOrderServiceId}`}
                className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                {t("postServiceIntervalMonths")}
              </label>
              <Input
                id={`post-service-interval-months-${entry.workOrderServiceId}`}
                type="number"
                value={entry.intervalMonths ?? ""}
                onChange={(e) =>
                  onChange({
                    intervalMonths: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  })
                }
                className="h-8 text-xs"
                min={0}
                placeholder="—"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`post-service-interval-km-${entry.workOrderServiceId}`}
                className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                {t("postServiceIntervalKm")}
              </label>
              <Input
                id={`post-service-interval-km-${entry.workOrderServiceId}`}
                type="number"
                value={entry.intervalKm ?? ""}
                onChange={(e) =>
                  onChange({
                    intervalKm: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  })
                }
                className="h-8 text-xs"
                min={0}
                placeholder="—"
              />
            </div>
          </div>

          {/* Next due */}
          {(nextDate || nextKm) && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 rounded-md px-2 py-1.5">
              <span className="font-medium">{t("postServiceNextDue")}:</span>
              {nextDate && <span>{formatDate(nextDate)}</span>}
              {nextDate && nextKm && <span>·</span>}
              {nextKm && <span>{formatKm(nextKm)} km</span>}
            </div>
          )}

          {/* Priority + Notes row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`post-service-priority-${entry.workOrderServiceId}`}
                className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                {t("postServicePriority")}
              </label>
              <Select
                value={entry.priority}
                onValueChange={(val) => {
                  if (val)
                    onChange({
                      priority: val as "standard" | "important" | "urgent",
                    });
                }}
              >
                <SelectTrigger
                  id={`post-service-priority-${entry.workOrderServiceId}`}
                  className="h-8 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="text-xs">
                    {t("postServicePriorityStandard")}
                  </SelectItem>
                  <SelectItem value="important" className="text-xs">
                    {t("postServicePriorityImportant")}
                  </SelectItem>
                  <SelectItem value="urgent" className="text-xs">
                    {t("postServicePriorityUrgent")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`entry-notes-${entry.workOrderServiceId}`}
                className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider"
              >
                Notes
              </label>
              <Input
                id={`entry-notes-${entry.workOrderServiceId}`}
                value={entry.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                className="h-8 text-xs"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
