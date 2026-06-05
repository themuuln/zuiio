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
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  type PostServiceFormProps,
  type PostServiceFormValues,
  postServiceSchema,
  type ServiceFormEntry,
} from "./_schema";
import { ServiceCard } from "./_service-card";

// ── Component ──────────────────────────────────────────────

// ── Form Body (renders inline, no dialog wrapper) ──────────

export function PostServiceFormBody({
  vehiclePlate,
  currentOdometer,
  services,
  newStatus,
  onConfirm,
  onBack,
}: Omit<PostServiceFormProps, "woId" | "vehicleId" | "onCancel"> & {
  onBack: () => void;
}) {
  const t = useTranslations("bayView");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);

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

  const odometerRegister = form.register("odometer");
  const mergedOdometerRef = useCallback(
    (el: HTMLInputElement | null) => {
      odometerRegister.ref({ current: el });
      if (el) el.focus();
    },
    [odometerRegister],
  );

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
    <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1 min-h-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-1">
          {vehiclePlate}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Odometer */}
        <Field data-invalid={!!form.formState.errors.odometer}>
          <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <Gauge className="size-4" />
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
              <FieldError>{form.formState.errors.odometer.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Services */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <MessageSquare className="size-4" />
              {t("postServiceServicesTitle")}
              <Badge variant="secondary">{entries.length}</Badge>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAllExpanded(!allExpanded)}
              className="gap-1 text-xs h-auto"
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
            <AlertTriangle className="mt-1 size-4 shrink-0 text-red-500" />
            <Typography.Text className="text-xs text-red-700 dark:text-red-400">
              {error}
            </Typography.Text>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button
            variant="outline"
            onClick={onBack}
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
    </div>
  );
}

// ── Component (standalone dialog version) ──────────────────

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
            <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Gauge className="size-4" />
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <MessageSquare className="size-4" />
                {t("postServiceServicesTitle")}
                <Badge variant="secondary">{entries.length}</Badge>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAllExpanded(!allExpanded)}
                className="gap-1 text-xs h-auto"
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
              <AlertTriangle className="mt-1 size-4 shrink-0 text-red-500" />
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
