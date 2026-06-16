"use client";

import {
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HistoryIcon,
  Loader2,
  MessageSquarePlus,
  Search,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BuuzHint } from "@/components/ui/plate-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { ColorSelect } from "@/components/vehicles/color-select";
import { formatPlateInput } from "@/lib/form-ux";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { formatMNT } from "@/lib/utils";
import { STATUS_DOT } from "./_constants";
import {
  EMPTY_LOOKUP,
  formatDate,
  formatTime,
  type LookupResult,
  resolveQueueIds,
  type SearchVehicleResult,
  type VehicleRegistrationFormValues,
  vehicleRegistrationSchema,
} from "./_vehicle-registration-schema";

// ── Types ──────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQueued?: () => void;
  onAssigned?: () => void;
  assignBayNumber?: number;
  branchId?: string;
}

// ── Service Timeline ───────────────────────────────────────

function ServiceTimeline({
  history,
}: {
  history: LookupResult["serviceHistory"];
}) {
  const t = useTranslations("bayView");
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
        <HistoryIcon className="size-10 mb-2" />
        <Typography.Text className="text-sm">
          {t("noServiceHistory")}
        </Typography.Text>
        <Typography.Text className="text-xs mt-1">
          {t("serviceRecordsHere")}
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {history.map((entry, idx) => {
        const dotColor = STATUS_DOT[entry.status] ?? "bg-slate-400";
        const isLast = idx === history.length - 1;

        return (
          <div key={entry.work_order_id} className="relative flex gap-3 pb-4">
            {!isLast && (
              <div className="absolute left-3 top-5 bottom-0 w-0.5 bg-border" />
            )}

            <div className="relative z-10 mt-1 shrink-0">
              <div
                className={`size-5 ${dotColor} ring-2 ring-background flex items-center justify-center`}
              >
                {entry.status === "Completed" ? (
                  <CheckCircle2 className="size-3 text-white" />
                ) : (
                  <div className="size-2 bg-white" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold capitalize">
                  {entry.status}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(entry.created_at)} {formatTime(entry.created_at)}
                </span>
              </div>

              {entry.complaint && (
                <Typography.Muted className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {entry.complaint}
                </Typography.Muted>
              )}

              {entry.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.services.map((s) => (
                    <span
                      key={`${s.name}-${s.price}`}
                      className="inline-flex items-center gap-1 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                    >
                      <Wrench className="size-3" />
                      {s.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {entry.total > 0 && (
                  <span className="font-medium text-foreground/80">
                    {formatMNT(entry.total)}
                  </span>
                )}
                {entry.mechanic_name && (
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {entry.mechanic_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export function VehicleRegistrationDrawer({
  open,
  onOpenChange,
  onQueued,
  onAssigned,
  assignBayNumber,
  branchId,
}: Props) {
  const t = useTranslations("bayView");

  // ── Lookup state ──────────────────────────────────────────
  const [plate, setPlate] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult>(EMPTY_LOOKUP);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  // ── Vehicle search state ──────────────────────────────────
  const [searchResults, setSearchResults] = useState<SearchVehicleResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [plateFocused, setPlateFocused] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Save state ────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMode, setSaveMode] = useState<"created" | "updated" | null>(null);

  // ── Queue state ───────────────────────────────────────────
  const [queueSaving, setQueueSaving] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(null);
  const [savedCustomerId, setSavedCustomerId] = useState<string | null>(null);

  // ── Collapsible sections ──────────────────────────────────
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // ── Customer drawer ───────────────────────────────────────
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);

  const plateRef = useRef<HTMLInputElement>(null);

  const form = useForm<VehicleRegistrationFormValues>({
    resolver: zodResolver(vehicleRegistrationSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      color: "",
      vin: "",
      engine: "",
      odometer: "",
      custFirstName: "",
      custLastName: "",
      custPhone: "",
      complaint: "",
    },
  });

  // Focus plate on open
  useEffect(() => {
    if (!open) return;
    plateRef.current?.focus();
  }, [open]);

  // Reset on open
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only reset on open toggle
  useEffect(() => {
    if (!open) return;
    setPlate("");
    setLookupResult(EMPTY_LOOKUP);
    setLookupLoading(false);
    setLookupError(null);
    setLookupDone(false);
    setSaving(false);
    setSaveError(null);
    setSaveSuccess(false);
    setSaveMode(null);
    setQueueSaving(false);
    setQueueError(null);
    setSavedVehicleId(null);
    setSavedCustomerId(null);
    setSearchResults([]);
    setShowDropdown(false);
    setShowTechnicalDetails(false);
    form.reset({
      make: "",
      model: "",
      year: "",
      color: "",
      vin: "",
      engine: "",
      odometer: "",
      custFirstName: "",
      custLastName: "",
      custPhone: "",
      complaint: "",
    });
  }, [open]);

  // Populate form from lookup result
  useEffect(() => {
    if (lookupResult.vehicle) {
      const v = lookupResult.vehicle;
      form.reset({
        make: v.make,
        model: v.model,
        year: v.year?.toString() ?? "",
        color: v.color ?? "",
        vin: v.vin ?? "",
        engine: v.engine ?? "",
        odometer: v.odometer?.toString() ?? "",
        custFirstName: lookupResult.customer?.first_name?.split(" ")[0] ?? "",
        custLastName:
          lookupResult.customer?.first_name?.split(" ").slice(1).join(" ") ||
          lookupResult.customer?.last_name ||
          "",
        custPhone: lookupResult.customer?.phone ?? "",
        complaint: "",
      });
    }
  }, [lookupResult, form]);

  // ── Lookup handler ────────────────────────────────────────
  const handleLookup = useCallback(async () => {
    if (!plate.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupDone(false);
    setSaveSuccess(false);
    setSaveError(null);
    setQueueError(null);

    try {
      const { lookupVehicleByPlate } = await import(
        "@/lib/services/bay-view-actions"
      );
      const result = await lookupVehicleByPlate(plate.trim().toUpperCase());
      setLookupResult(result);
      setLookupDone(true);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : t("common.somethingWentWrong"),
      );
    } finally {
      setLookupLoading(false);
    }
  }, [plate, t]);

  // ── Vehicle search (debounced) ────────────────────────────
  const handleSearch = useCallback((term: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!term.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { searchVehicles } = await import(
          "@/lib/services/bay-view-actions"
        );
        const results = await searchVehicles(term);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleSelectVehicle = useCallback(
    (vehicle: (typeof searchResults)[0]) => {
      setPlate(vehicle.plate_number);
      setShowDropdown(false);
      handleLookup();
    },
    [handleLookup],
  );

  // ── Save payload ──────────────────────────────────────────
  const getSavePayload = useCallback(
    (data: VehicleRegistrationFormValues) => ({
      plateNumber: plate.trim().toUpperCase(),
      make: data.make.trim(),
      model: data.model.trim(),
      year: data.year ? parseInt(data.year, 10) : undefined,
      color: data.color?.trim() || undefined,
      vin: data.vin?.trim() || undefined,
      engine: data.engine?.trim() || undefined,
      odometer: data.odometer ? parseInt(data.odometer, 10) : undefined,
      customerFirstName: data.custFirstName?.trim() || undefined,
      customerLastName: data.custLastName?.trim() || undefined,
      customerPhone: data.custPhone?.trim() || undefined,
    }),
    [plate],
  );

  // ── Save handler ──────────────────────────────────────────
  const handleSave = useCallback(
    async (data: VehicleRegistrationFormValues) => {
      if (!plate.trim() || !data.make.trim() || !data.model.trim()) return;
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      try {
        const { quickRegisterVehicle, lookupVehicleByPlate } = await import(
          "@/lib/services/bay-view-actions"
        );
        const saveResult = await quickRegisterVehicle(getSavePayload(data));

        setSavedVehicleId(saveResult.vehicle.id);
        setSavedCustomerId(saveResult.customerId);
        setSaveSuccess(true);
        setSaveMode(saveResult.isUpdate ? "updated" : "created");

        // Queue and bay assignment are secondary — failures here don't undo vehicle save
        try {
          const { addVehicleToQueue } = await import(
            "@/lib/services/bay-view-actions"
          );
          const { workOrderId } = await addVehicleToQueue({
            vehicleId: saveResult.vehicle.id,
            customerId: saveResult.customerId ?? "",
            complaint: data.complaint?.trim() || undefined,
            branchId,
          });

          // Direct assign to bay if requested
          if (assignBayNumber && workOrderId) {
            try {
              const { assignVehicleToBay } = await import(
                "@/lib/services/bay-view-service.actions"
              );
              await assignVehicleToBay(workOrderId, assignBayNumber);
            } catch {
              toast.warning(t("saveSuccessBayAssignFailed"));
            }
          }
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : t("saveSuccessQueueFailed"),
          );
        }

        // Re-lookup to update timeline
        const refreshResult = await lookupVehicleByPlate(
          plate.trim().toUpperCase(),
        );
        setLookupResult(refreshResult);
        setLookupDone(true);

        if (assignBayNumber) {
          onAssigned?.();
        } else {
          onQueued?.();
        }
      } catch (err) {
        // Only vehicle save failure is fatal
        setSaveError(
          err instanceof Error ? err.message : t("common.somethingWentWrong"),
        );
      } finally {
        setSaving(false);
      }
    },
    [plate, getSavePayload, t, branchId, onQueued, onAssigned, assignBayNumber],
  );

  // ── Queue handler ─────────────────────────────────────────
  const handleAddToQueue = useCallback(async () => {
    const formData = form.getValues();
    const { vehicleId, customerId } = resolveQueueIds(
      savedVehicleId,
      savedCustomerId,
      lookupResult,
    );

    let workOrderId: string | undefined;

    if (!vehicleId) {
      if (!plate.trim() || !formData.make.trim() || !formData.model.trim()) {
        setQueueError(t("saveVehicleFirst"));
        return;
      }
      try {
        const { quickRegisterVehicle } = await import(
          "@/lib/services/bay-view-actions"
        );
        const saveResult = await quickRegisterVehicle(getSavePayload(formData));
        setSavedVehicleId(saveResult.vehicle.id);
        setSavedCustomerId(saveResult.customerId);

        const { addVehicleToQueue } = await import(
          "@/lib/services/bay-view-actions"
        );
        ({ workOrderId } = await addVehicleToQueue({
          vehicleId: saveResult.vehicle.id,
          customerId: saveResult.customerId ?? "",
          complaint: formData.complaint?.trim() || undefined,
          branchId,
        }));
      } catch (err) {
        setQueueError(
          err instanceof Error ? err.message : t("common.somethingWentWrong"),
        );
        return;
      }
    } else {
      setQueueSaving(true);
      setQueueError(null);
      try {
        const { addVehicleToQueue } = await import(
          "@/lib/services/bay-view-actions"
        );
        ({ workOrderId } = await addVehicleToQueue({
          vehicleId,
          customerId: customerId ?? undefined,
          complaint: formData.complaint?.trim() || undefined,
          branchId,
        }));
      } catch (err) {
        setQueueError(
          err instanceof Error ? err.message : t("common.somethingWentWrong"),
        );
        setQueueSaving(false);
        return;
      }
    }

    if (assignBayNumber && workOrderId) {
      try {
        const { assignVehicleToBay } = await import(
          "@/lib/services/bay-view-service.actions"
        );
        await assignVehicleToBay(workOrderId, assignBayNumber);
      } catch (err) {
        setQueueError(
          err instanceof Error ? err.message : t("common.somethingWentWrong"),
        );
        setQueueSaving(false);
        return;
      }
    }

    setQueueSaving(false);
    if (assignBayNumber) {
      onAssigned?.();
    } else {
      onQueued?.();
    }
  }, [
    plate,
    savedVehicleId,
    savedCustomerId,
    lookupResult,
    onQueued,
    onAssigned,
    assignBayNumber,
    form,
    getSavePayload,
    branchId,
    t,
  ]);

  // ── Derived state ─────────────────────────────────────────
  const formValues = form.watch();
  const isExistingVehicle = lookupDone && lookupResult.exists;

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      size="3xl"
      modal={false}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <DetailDrawer.Header>
        <DetailDrawer.Title>
          <span className="flex items-center gap-2">
            <Car className="size-4 text-blue-500" />
            {t("vehicleRegistration")}
          </span>
        </DetailDrawer.Title>
        <DetailDrawer.Description>
          {t("registerSubtitle")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      {/* ── Body ────────────────────────────────────────────── */}
      <DetailDrawer.Body>
        <div className="flex flex-col gap-6">
          {/* ── Main Content ─────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* ── Plate Input ────────────────────────────────── */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={plateRef}
                  value={plate}
                  onChange={(e) => {
                    const val = formatPlateInput(
                      transliterateMongolianPlate(e.target.value),
                    );
                    setPlate(val);
                    handleSearch(val);
                  }}
                  onFocus={() => {
                    setPlateFocused(true);
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setPlateFocused(false);
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowDropdown(false);
                      handleLookup();
                    }
                  }}
                  placeholder={`${t("enterPlate")} — ${t("lookupSubtitle")}`}
                  className="h-9 pl-10 pr-8 font-mono uppercase"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                )}
                {plateFocused && !showDropdown && (
                  <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-3 shadow-md transition-all duration-150">
                    <BuuzHint />
                  </div>
                )}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectVehicle(v);
                        }}
                      >
                        <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Car className="size-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {v.plate_number}
                            </span>
                            {v.year && (
                              <span className="text-xs text-muted-foreground">
                                {v.year}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {v.make} {v.model}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="lg"
                onClick={handleLookup}
                disabled={lookupLoading || !plate.trim()}
              >
                {lookupLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {t("lookup")}
              </Button>
            </div>

            {/* ── Error/Success Banners ──────────────────────── */}
            {lookupError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {lookupError}
              </div>
            )}

            {saveError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {saveMode === "updated"
                  ? t("vehicleUpdated")
                  : t("vehicleRegistered")}
              </div>
            )}

            {lookupDone && !lookupResult.exists && (
              <div
                className={`px-4 py-2 text-xs ${
                  lookupResult.smartcarFound
                    ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                    : "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                }`}
              >
                {lookupResult.smartcarFound
                  ? t("vehicleFoundSmartcar")
                  : t("vehicleNotFound")}
              </div>
            )}

            {/* ── Existing Vehicle: Queue Section ────────────── */}
            {isExistingVehicle && (
              <div className="flex flex-col gap-3 bg-muted/30 border border-border/60 rounded-lg p-4">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  {assignBayNumber ? (
                    <Zap className="size-4 text-emerald-500" />
                  ) : (
                    <MessageSquarePlus className="size-4 text-primary" />
                  )}
                  {assignBayNumber
                    ? t("assignToBayNumber", { bayNumber: assignBayNumber })
                    : t("addToWaitingQueue")}
                </Label>

                <Field data-invalid={!!form.formState.errors.complaint}>
                  <FieldContent>
                    <Textarea
                      placeholder={t("complaintPlaceholder")}
                      className="min-h-[60px] text-xs resize-none"
                      {...form.register("complaint")}
                    />
                  </FieldContent>
                </Field>

                {queueError && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                    {queueError}
                  </div>
                )}

                <Button
                  type="button"
                  variant="default"
                  size="default"
                  disabled={queueSaving}
                  onClick={handleAddToQueue}
                  className="w-full"
                >
                  {queueSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Zap className="size-4" />
                  )}
                  {queueSaving
                    ? t("addingToQueue")
                    : assignBayNumber
                      ? t("assignToBayNumber", { bayNumber: assignBayNumber })
                      : t("addQueueButton")}
                </Button>
              </div>
            )}

            {/* ── New Vehicle: Registration Form ─────────────── */}
            {lookupDone && !lookupResult.exists && (
              <form
                onSubmit={form.handleSubmit(handleSave)}
                className="flex flex-col gap-4"
              >
                {/* ── Primary: Brand, Model, Year, Color ──── */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Vehicle Information
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Field data-invalid={!!form.formState.errors.make}>
                      <FieldContent>
                        <Input
                          placeholder={`${t("brand")} (e.g. Toyota)`}
                          className="font-medium"
                          aria-invalid={!!form.formState.errors.make}
                          {...form.register("make")}
                        />
                        {form.formState.errors.make && (
                          <FieldError>
                            {form.formState.errors.make.message}
                          </FieldError>
                        )}
                      </FieldContent>
                    </Field>
                    <Field data-invalid={!!form.formState.errors.model}>
                      <FieldContent>
                        <Input
                          placeholder={`${t("model")} (e.g. Prius)`}
                          className="font-medium"
                          aria-invalid={!!form.formState.errors.model}
                          {...form.register("model")}
                        />
                        {form.formState.errors.model && (
                          <FieldError>
                            {form.formState.errors.model.message}
                          </FieldError>
                        )}
                      </FieldContent>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field data-invalid={!!form.formState.errors.year}>
                      <FieldContent>
                        <Input
                          type="number"
                          placeholder={`${t("year")} (e.g. 2020)`}
                          aria-invalid={!!form.formState.errors.year}
                          {...form.register("year")}
                        />
                        {form.formState.errors.year && (
                          <FieldError>
                            {form.formState.errors.year.message}
                          </FieldError>
                        )}
                      </FieldContent>
                    </Field>
                    <Field data-invalid={!!form.formState.errors.color}>
                      <FieldContent>
                        <ColorSelect
                          value={formValues.color ?? ""}
                          onChange={(val) => form.setValue("color", val)}
                          className="w-full"
                        />
                      </FieldContent>
                    </Field>
                  </div>
                </div>

                {/* ── Collapsible: Technical Details ───────── */}
                <Collapsible
                  open={showTechnicalDetails}
                  onOpenChange={setShowTechnicalDetails}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors py-1">
                    <ChevronDown
                      className={`size-3 transition-transform ${showTechnicalDetails ? "rotate-180" : ""}`}
                    />
                    {t("additionalDetails")}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Field data-invalid={!!form.formState.errors.vin}>
                          <FieldContent>
                            <Input
                              placeholder="VIN / Chassis"
                              className="text-xs"
                              aria-invalid={!!form.formState.errors.vin}
                              {...form.register("vin")}
                            />
                          </FieldContent>
                        </Field>
                        <Field data-invalid={!!form.formState.errors.engine}>
                          <FieldContent>
                            <Input
                              placeholder={`${t("engine")} (e.g. 2ZR-FE)`}
                              className="text-xs"
                              aria-invalid={!!form.formState.errors.engine}
                              {...form.register("engine")}
                            />
                          </FieldContent>
                        </Field>
                      </div>
                      <Field data-invalid={!!form.formState.errors.odometer}>
                        <FieldContent>
                          <Input
                            type="number"
                            placeholder={`${t("odometer")} (e.g. 120000)`}
                            className="text-xs"
                            aria-invalid={!!form.formState.errors.odometer}
                            {...form.register("odometer")}
                          />
                        </FieldContent>
                      </Field>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* ── Customer ──────────────────────────────── */}
                <div className="border-t border-border/50 pt-4">
                  <button
                    type="button"
                    onClick={() => setCustomerDrawerOpen(true)}
                    className="flex items-center justify-between w-full text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-8 bg-primary/10">
                        <User className="size-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {t("ownerInfo")}
                        </span>
                        {formValues.custFirstName || formValues.custPhone ? (
                          <p className="text-xs text-muted-foreground">
                            {[formValues.custFirstName, formValues.custLastName]
                              .filter(Boolean)
                              .join(" ") || t("unknown")}
                            {formValues.custPhone
                              ? ` · ${formValues.custPhone}`
                              : ""}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t("addCustomerInfo")}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </div>

                {/* ── Customer Nested Drawer ───────────────── */}
                <DetailDrawer
                  open={customerDrawerOpen}
                  onOpenChange={setCustomerDrawerOpen}
                  size="md"
                  modal
                >
                  <DetailDrawer.Header>
                    <DetailDrawer.Title>
                      <span className="flex items-center gap-2">
                        <User className="size-4 text-primary" />
                        {t("ownerInfo")}
                      </span>
                    </DetailDrawer.Title>
                    <DetailDrawer.Description>
                      {t("addCustomerInfo")}
                    </DetailDrawer.Description>
                  </DetailDrawer.Header>
                  <DetailDrawer.Body>
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          data-invalid={!!form.formState.errors.custFirstName}
                        >
                          <FieldContent>
                            <Input
                              placeholder="e.g. Bat"
                              className="text-xs"
                              aria-invalid={
                                !!form.formState.errors.custFirstName
                              }
                              {...form.register("custFirstName")}
                            />
                          </FieldContent>
                        </Field>
                        <Field
                          data-invalid={!!form.formState.errors.custLastName}
                        >
                          <FieldContent>
                            <Input
                              placeholder="e.g. Erdene"
                              className="text-xs"
                              aria-invalid={
                                !!form.formState.errors.custLastName
                              }
                              {...form.register("custLastName")}
                            />
                          </FieldContent>
                        </Field>
                      </div>
                      <Field data-invalid={!!form.formState.errors.custPhone}>
                        <FieldContent>
                          <Input
                            type="tel"
                            placeholder="e.g. 99112233"
                            inputMode="tel"
                            autoComplete="tel"
                            className="text-xs"
                            aria-invalid={!!form.formState.errors.custPhone}
                            {...form.register("custPhone")}
                          />
                          {form.formState.errors.custPhone && (
                            <FieldError>
                              {form.formState.errors.custPhone.message}
                            </FieldError>
                          )}
                        </FieldContent>
                      </Field>
                    </div>
                  </DetailDrawer.Body>
                  <DetailDrawer.Footer>
                    <Button
                      type="button"
                      variant="default"
                      className="w-full"
                      onClick={() => setCustomerDrawerOpen(false)}
                    >
                      {t("common.save") ?? "Save"}
                    </Button>
                  </DetailDrawer.Footer>
                </DetailDrawer>

                {/* ── Complaint ────────────────────────────── */}
                <div className="border-t border-border/50 pt-4">
                  <Field data-invalid={!!form.formState.errors.complaint}>
                    <FieldLabel className="mb-1 block text-xs font-medium text-muted-foreground">
                      Complaint / Reason for Visit
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        placeholder={t("complaintPlaceholder")}
                        className="min-h-[60px] text-xs resize-none"
                        {...form.register("complaint")}
                      />
                    </FieldContent>
                  </Field>
                </div>

                {/* ── Actions ──────────────────────────────── */}
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={saving}
                    size="default"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Zap className="size-4" />
                    )}
                    {saving
                      ? t("saving")
                      : assignBayNumber
                        ? t("saveAndAssignToBay", {
                            bayNumber: assignBayNumber,
                          })
                        : t("saveAndAddToQueue")}
                  </Button>
                </div>
              </form>
            )}

            {/* ── Waiting state ──────────────────────────────── */}
            {!lookupDone && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
                <Car className="size-12 mb-3" />
                <Typography.Text className="text-sm font-medium">
                  {t("enterPlateAbove")}
                </Typography.Text>
                <Typography.Text className="text-xs mt-1">
                  {t("timelineWillAppear")}
                </Typography.Text>
              </div>
            )}
          </div>

          {/* ── Bottom: Timeline ─────────────────────────────── */}
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-8 bg-amber-500/10">
                <HistoryIcon className="size-4 text-amber-500" />
              </div>
              <span className="text-sm font-semibold">
                {t("serviceTimeline")}
              </span>
              {lookupResult.serviceHistory.length > 0 && (
                <span className="bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {lookupResult.serviceHistory.length}
                </span>
              )}
            </div>

            {lookupDone ? (
              <ScrollArea className="max-h-[420px] pr-1">
                {lookupResult.vehicle && (
                  <div className="mb-4 bg-muted/30 border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">
                          {lookupResult.vehicle.plate_number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lookupResult.vehicle.make}{" "}
                          {lookupResult.vehicle.model}
                          {lookupResult.vehicle.year
                            ? ` · ${lookupResult.vehicle.year}`
                            : ""}
                        </div>
                      </div>
                      {lookupResult.vehicle.color && (
                        <div
                          className="size-5 border border-border"
                          style={{
                            backgroundColor:
                              lookupResult.vehicle.color.toLowerCase(),
                          }}
                          title={lookupResult.vehicle.color}
                        />
                      )}
                    </div>
                    {lookupResult.customer && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">
                        <User className="size-3" />
                        {[
                          lookupResult.customer.first_name,
                          lookupResult.customer.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ") || t("unknown")}{" "}
                        · {lookupResult.customer.phone}
                      </div>
                    )}
                  </div>
                )}
                <ServiceTimeline history={lookupResult.serviceHistory} />
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
                <Car className="size-12 mb-3" />
                <Typography.Text className="text-sm font-medium">
                  {t("enterPlateAbove")}
                </Typography.Text>
                <Typography.Text className="text-xs mt-1">
                  {t("timelineWillAppear")}
                </Typography.Text>
              </div>
            )}
          </div>
        </div>
      </DetailDrawer.Body>
    </DetailDrawer>
  );
}
