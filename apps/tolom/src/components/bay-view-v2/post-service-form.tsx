"use client";

import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronUp,
  Gauge,
  Loader2,
  MessageSquare,
  Package,
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
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { getDefaultTransferBank } from "@/lib/payments/org-bank-accounts";
import { formatMNT } from "@/lib/utils";
import { PaymentMethodField } from "./_payment-method-field";
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
  parts,
  newStatus,
  grandTotal,
  paymentMethodFees,
  transferBanks,
  onConfirm,
  onBack,
}: Omit<PostServiceFormProps, "woId" | "vehicleId" | "onCancel"> & {
  onBack: () => void;
}) {
  const t = useTranslations("bayView");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const defaultTransferBank = getDefaultTransferBank(transferBanks);

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
      paymentMethod: "bank_transfer",
      transferBankId: defaultTransferBank?.id ?? "",
    },
  });


  const paymentMethod = form.watch("paymentMethod");
  const transferBankId = form.watch("transferBankId");
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
        paymentMethod: data.paymentMethod,
        transferBankId: data.transferBankId || null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("failedToSavePostServiceData"),
      );
    } finally {
      setSaving(false);
    }
  });

  // Sync all entries expanded/collapsed when the "Expand All" / "Collapse All" button is clicked
  const toggleAllExpanded = useCallback(() => {
    setAllExpanded((prev) => {
      const next = !prev;
      setEntries((prevEntries) =>
        prevEntries.map((e) => ({ ...e, expanded: next })),
      );
      return next;
    });
  }, []);

  const isComplete = newStatus === "Completed";

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1 min-h-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-1">
          {vehiclePlate}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Odometer */}
            <Field data-invalid={!!form.formState.errors.odometer}>
              <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Gauge className="size-4" />
                {t("postServiceOdometer")}
              </FieldLabel>
              <FieldContent>
                <div className="relative max-w-full">
                  <NumericInput
                    value={odometerValue ? parseInt(odometerValue, 10) : 0}
                    onChange={(val) => form.setValue("odometer", val?.toString() ?? "", { shouldValidate: true })}
                    onBlur={() => form.trigger("odometer")}
                    placeholder={t("postServiceOdometerPlaceholder")}
                    className="h-10 pr-10"
                    min={0}
                    aria-invalid={!!form.formState.errors.odometer}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                    км
                  </span>
                </div>
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
                  onClick={toggleAllExpanded}
                  className="gap-1 text-xs h-auto"
                  type="button"
                >
                  {allExpanded ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                  {allExpanded ? t("collapseToggle") : t("expandToggle")}
                </Button>
              </div>

              {!hasEntries && (
                <Typography.Muted className="text-xs text-muted-foreground/60 italic py-6 text-center">
                  {t("noServicesRecorded")}
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
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Mechanic notes */}
            <Field data-invalid={!!form.formState.errors.mechanicNotes}>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">
                {t("mechanicNotesLabel")}
              </FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder={t("notePlaceholder")}
                  rows={3}
                  aria-invalid={!!form.formState.errors.mechanicNotes}
                  className="min-h-[72px] resize-none"
                  {...form.register("mechanicNotes")}
                />
                {form.formState.errors.mechanicNotes && (
                  <FieldError>
                    {form.formState.errors.mechanicNotes.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            {/* Parts */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Package className="size-4" />
                  {t("parts")}
                  <Badge variant="secondary">{parts.length}</Badge>
                </span>
              </div>

              {parts.length === 0 ? (
                <Typography.Muted className="text-xs text-muted-foreground/60 italic py-6 text-center">
                  {t("noPartsRecorded")}
                </Typography.Muted>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {parts.map((part) => (
                    <div
                      key={part.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">
                          {part.part_name}
                        </span>
                        {part.part_number && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            #{part.part_number}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {part.quantity} x {formatMNT(part.unit_price)}
                        </span>
                        <span className="text-sm font-medium tabular-nums">
                          {formatMNT(part.final_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isComplete && (
          <PaymentMethodField
            value={paymentMethod}
            onChange={(method) => form.setValue("paymentMethod", method)}
            transferBankId={transferBankId || null}
            onTransferBankChange={(bankId) =>
              form.setValue("transferBankId", bankId)
            }
            subtotal={grandTotal}
            fees={paymentMethodFees}
            transferBanks={transferBanks}
            error={form.formState.errors.paymentMethod?.message}
          />
        )}

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
        <div className="flex gap-3 justify-end pt-3 border-t">
          <Button
            variant="outline"
            onClick={onBack}
            type="button"
            size="default"
            disabled={saving}
            className="h-10 min-w-[100px]"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            size="default"
            disabled={saving}
            className="h-10 min-w-[140px]"
          >
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
  parts,
  newStatus,
  grandTotal,
  paymentMethodFees,
  transferBanks,
  onConfirm,
  onCancel,
}: PostServiceFormProps) {
  const t = useTranslations("bayView");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const defaultTransferBank = getDefaultTransferBank(transferBanks);

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
      paymentMethod: "bank_transfer",
      transferBankId: defaultTransferBank?.id ?? "",
    },
  });


  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const paymentMethod = form.watch("paymentMethod");
  const transferBankId = form.watch("transferBankId");
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
        paymentMethod: data.paymentMethod,
        transferBankId: data.transferBankId || null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("failedToSavePostServiceData"),
      );
    } finally {
      setSaving(false);
    }
  });

  // Sync all entries expanded/collapsed when the "Expand All" / "Collapse All" button is clicked
  const toggleAllExpanded = useCallback(() => {
    setAllExpanded((prev) => {
      const next = !prev;
      setEntries((prevEntries) =>
        prevEntries.map((e) => ({ ...e, expanded: next })),
      );
      return next;
    });
  }, []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              {/* Odometer */}
              <Field data-invalid={!!form.formState.errors.odometer}>
                <FieldLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Gauge className="size-4" />
                  {t("postServiceOdometer")}
                </FieldLabel>
                <FieldContent>
                  <div className="relative max-w-full">
                    <NumericInput
                      value={odometerValue ? parseInt(odometerValue, 10) : 0}
                      onChange={(val) => form.setValue("odometer", val?.toString() ?? "", { shouldValidate: true })}
                      onBlur={() => form.trigger("odometer")}
                      placeholder={t("postServiceOdometerPlaceholder")}
                      className="h-10 pr-10"
                      min={0}
                      aria-invalid={!!form.formState.errors.odometer}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSubmit(e as unknown as React.FormEvent);
                        }
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
                      км
                    </span>
                  </div>
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
                    onClick={toggleAllExpanded}
                    className="gap-1 text-xs h-auto"
                    type="button"
                  >
                    {allExpanded ? (
                      <ChevronUp className="size-3" />
                    ) : (
                      <ChevronDown className="size-3" />
                    )}
                    {allExpanded ? t("collapseToggle") : t("expandToggle")}
                  </Button>
                </div>

                {!hasEntries && (
                  <Typography.Muted className="text-xs text-muted-foreground/60 italic py-6 text-center">
                    {t("noServicesRecorded")}
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
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Mechanic notes */}
              <Field data-invalid={!!form.formState.errors.mechanicNotes}>
                <FieldLabel className="text-xs font-semibold text-muted-foreground">
                  {t("mechanicNotesLabel")}
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    placeholder={t("notePlaceholder")}
                    rows={3}
                    aria-invalid={!!form.formState.errors.mechanicNotes}
                    className="min-h-[72px] resize-none"
                    {...form.register("mechanicNotes")}
                  />
                  {form.formState.errors.mechanicNotes && (
                    <FieldError>
                      {form.formState.errors.mechanicNotes.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              {/* Parts */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Package className="size-4" />
                    {t("parts")}
                    <Badge variant="secondary">{parts.length}</Badge>
                  </span>
                </div>

                {parts.length === 0 ? (
                  <Typography.Muted className="text-xs text-muted-foreground/60 italic py-6 text-center">
                    {t("noPartsRecorded")}
                  </Typography.Muted>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium">
                            {part.part_name}
                          </span>
                          {part.part_number && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              #{part.part_number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {part.quantity} x {formatMNT(part.unit_price)}
                          </span>
                          <span className="text-sm font-medium tabular-nums">
                            {formatMNT(part.final_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isComplete && (
            <PaymentMethodField
              value={paymentMethod}
              onChange={(method) => form.setValue("paymentMethod", method)}
              transferBankId={transferBankId || null}
              onTransferBankChange={(bankId) =>
                form.setValue("transferBankId", bankId)
              }
              subtotal={grandTotal}
              fees={paymentMethodFees}
              transferBanks={transferBanks}
              error={form.formState.errors.paymentMethod?.message}
            />
          )}

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
          <div className="flex gap-3 justify-end pt-3 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              type="button"
              size="default"
              disabled={saving}
              className="h-10 min-w-[100px]"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={saving}
              className="h-10 min-w-[140px]"
            >
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
