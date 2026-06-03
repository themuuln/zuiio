"use client";

import {
  Car,
  CheckCircle2,
  HistoryIcon,
  Loader2,
  MessageSquarePlus,
  Search,
  User,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { ColorSelect } from "@/components/vehicles/color-select";
import { formatPlateInput } from "@/lib/form-ux";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { formatMNT } from "@/lib/utils";
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
  initialMode?: "register" | "lookup";
  onQueued?: () => void;
  branchId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-500",
  "Ready for Pickup": "bg-green-400",
  "In Progress": "bg-amber-500",
  Diagnosing: "bg-blue-500",
  New: "bg-slate-400",
  Cancelled: "bg-red-400",
};

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
        const dotColor = STATUS_COLORS[entry.status] ?? "bg-slate-400";
        const isLast = idx === history.length - 1;

        return (
          <div key={entry.work_order_id} className="relative flex gap-3 pb-4">
            {!isLast && (
              <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-border" />
            )}

            <div className="relative z-10 mt-1 shrink-0">
              <div
                className={`size-5  ${dotColor} ring-2 ring-background flex items-center justify-center`}
              >
                {entry.status === "Completed" ? (
                  <CheckCircle2 className="size-3 text-white" />
                ) : (
                  <div className="size-2  bg-white" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold capitalize">
                  {entry.status}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDate(entry.created_at)} {formatTime(entry.created_at)}
                </span>
              </div>

              {entry.complaint && (
                <Typography.Muted className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {entry.complaint}
                </Typography.Muted>
              )}

              {entry.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {entry.services.map((s) => (
                    <span
                      key={`${s.name}-${s.price}`}
                      className="inline-flex items-center gap-1  bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400"
                    >
                      <Wrench className="size-2.5" />
                      {s.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                {entry.total > 0 && (
                  <span className="font-medium text-foreground/80">
                    {formatMNT(entry.total)}
                  </span>
                )}
                {entry.mechanic_name && (
                  <span className="flex items-center gap-1">
                    <User className="size-2.5" />
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

// ── Component ──────────────────────────────────────────────

export function VehicleRegistrationDialog({
  open,
  onOpenChange,
  initialMode = "register",
  onQueued,
  branchId,
}: Props) {
  const t = useTranslations("bayView");
  const [mode, setMode] = useState<"register" | "lookup">(initialMode);
  const [plate, setPlate] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult>(EMPTY_LOOKUP);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMode, setSaveMode] = useState<"created" | "updated" | null>(null);

  // ── Vehicle search state ─────────────────────────────────────
  const [searchResults, setSearchResults] = useState<SearchVehicleResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Queue state ──────────────────────────────────────────────
  const [queueSaving, setQueueSaving] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(null);
  const [savedCustomerId, setSavedCustomerId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) return;
    plateRef.current?.focus();
  }, [open]);

  // Reset on open
  useEffect(() => {
    if (open) {
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
    }
  }, [open, form]);

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

  const handleLookup = useCallback(async () => {
    if (!plate.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupDone(false);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const { lookupVehicleByPlate } = await import(
        "@/lib/services/bay-view-actions"
      );
      const result = await lookupVehicleByPlate(plate.trim().toUpperCase());
      setLookupResult(result);
      setLookupDone(true);

      if (result.exists) {
        setMode("register");
      }
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  }, [plate]);

  // ── Vehicle search (debounced) ────────────────────────────────
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

        // Store returned IDs for queue use
        setSavedVehicleId(saveResult.vehicle.id);
        setSavedCustomerId(saveResult.customerId);

        setSaveSuccess(true);
        setSaveMode(saveResult.isUpdate ? "updated" : "created");

        // Re-lookup to update timeline
        const refreshResult = await lookupVehicleByPlate(
          plate.trim().toUpperCase(),
        );
        setLookupResult(refreshResult);
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to register vehicle",
        );
      } finally {
        setSaving(false);
      }
    },
    [plate, getSavePayload],
  );

  const handleAddToQueue = useCallback(async () => {
    const formData = form.getValues();
    const { vehicleId, customerId } = resolveQueueIds(
      savedVehicleId,
      savedCustomerId,
      lookupResult,
    );

    if (!vehicleId) {
      // Vehicle hasn't been saved yet — save first
      if (!plate.trim() || !formData.make.trim() || !formData.model.trim()) {
        setQueueError("Fill in vehicle info (plate, make, model) first.");
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
        await addVehicleToQueue({
          vehicleId: saveResult.vehicle.id,
          customerId: saveResult.customerId ?? "",
          complaint: formData.complaint?.trim() || undefined,
          branchId,
        });
      } catch (err) {
        setQueueError(
          err instanceof Error ? err.message : "Failed to add to queue",
        );
        return;
      }
    } else if (!customerId) {
      setQueueError(
        "Customer name and phone are required to add to queue. Fill in owner info and save first.",
      );
      return;
    } else {
      // Both IDs resolved — queue directly
      setQueueSaving(true);
      setQueueError(null);
      try {
        const { addVehicleToQueue } = await import(
          "@/lib/services/bay-view-actions"
        );
        await addVehicleToQueue({
          vehicleId,
          customerId,
          complaint: formData.complaint?.trim() || undefined,
          branchId,
        });
      } catch (err) {
        setQueueError(
          err instanceof Error ? err.message : "Failed to add to queue",
        );
        setQueueSaving(false);
        return;
      }
    }

    setQueueSaving(false);
    onQueued?.();
  }, [
    plate,
    savedVehicleId,
    savedCustomerId,
    lookupResult,
    onQueued,
    form,
    getSavePayload,
    branchId,
  ]);

  // Determine whether queue action is available
  const { vehicleId: resolvedVehicleId, customerId: resolvedCustomerId } =
    resolveQueueIds(savedVehicleId, savedCustomerId, lookupResult);
  const canQueue = !!resolvedVehicleId && !!resolvedCustomerId;

  const formValues = form.watch();
  const needsSave =
    !resolvedVehicleId &&
    plate.trim() &&
    formValues.make.trim() &&
    formValues.model.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Car className="size-4 text-blue-500" />
            {mode === "lookup"
              ? t("vehicleServiceHistory")
              : t("vehicleRegistration")}
          </DialogTitle>
          <DialogDescription>
            {mode === "lookup" ? t("lookupSubtitle") : t("registerSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              setMode(mode === "register" ? "lookup" : "register");
              setLookupResult(EMPTY_LOOKUP);
              setLookupDone(false);
              setLookupError(null);
              setSaveSuccess(false);
              setSaveError(null);
              setQueueError(null);
            }}
          >
            {mode === "register" ? t("switchToLookup") : t("switchToRegister")}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Registration Form */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Plate search with autocomplete */}
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
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowDropdown(false);
                      handleLookup();
                    }
                  }}
                  placeholder={`${t("enterPlate")} — ${t("lookupSubtitle")}`}
                  className="pl-10 pr-8"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                )}
                {/* Autocomplete dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
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

            {lookupError && (
              <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {lookupError}
              </div>
            )}

            {saveError && (
              <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className=" bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {saveMode === "updated"
                  ? t("vehicleUpdated")
                  : t("vehicleRegistered")}
              </div>
            )}

            {lookupDone && !lookupResult.exists && (
              <div className=" bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
                {t("vehicleNotFound")}
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="flex flex-col gap-4"
            >
              {/* ── Primary: Brand, Model ── */}
              <div className="flex flex-col gap-2">
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

              {/* ── Secondary: Year, Color ── */}
              <div className="grid grid-cols-2 gap-2">
                <Field data-invalid={!!form.formState.errors.year}>
                  <FieldLabel className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("year")}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      placeholder="e.g. 2020"
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
                  <FieldLabel className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("color")}
                  </FieldLabel>
                  <FieldContent>
                    <ColorSelect
                      value={formValues.color ?? ""}
                      onChange={(val) => form.setValue("color", val)}
                      className="w-full"
                    />
                  </FieldContent>
                </Field>
              </div>

              {/* ── Separator ── */}
              <div className="border-t border-border/50" />

              {/* ── Less Important: VIN, Engine, Odometer ── */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground/70">
                  {t("additionalDetails")}
                </Label>
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

              {/* ── Separator ── */}
              <div className="border-t border-border/50" />

              {/* ── Owner Info (Optional) ── */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted-foreground/70">
                  {t("ownerInfo")}{" "}
                  <span className="text-muted-foreground/50">(optional)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Field data-invalid={!!form.formState.errors.custFirstName}>
                    <FieldContent>
                      <Input
                        placeholder="e.g. Bat"
                        className="text-xs"
                        aria-invalid={!!form.formState.errors.custFirstName}
                        {...form.register("custFirstName")}
                      />
                    </FieldContent>
                  </Field>
                  <Field data-invalid={!!form.formState.errors.custLastName}>
                    <FieldContent>
                      <Input
                        placeholder="e.g. Erdene"
                        className="text-xs"
                        aria-invalid={!!form.formState.errors.custLastName}
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

              <Button
                type="submit"
                className="w-full"
                disabled={saving}
                size="default"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : lookupResult.exists ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Car className="size-4" />
                )}
                {saving
                  ? t("saving")
                  : lookupResult.exists
                    ? t("updateVehicle")
                    : t("registerVehicleBtn")}
              </Button>
            </form>

            {/* ── Add to Queue section ───────────────────────────── */}
            {(lookupDone || !!savedVehicleId) && (
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MessageSquarePlus className="size-3.5 text-primary" />
                    Add to Waiting Queue
                  </Label>
                  <Field data-invalid={!!form.formState.errors.complaint}>
                    <FieldContent>
                      <Textarea
                        placeholder="Complaint or reason for visit (optional)"
                        className="min-h-[60px] text-xs resize-none"
                        {...form.register("complaint")}
                      />
                    </FieldContent>
                  </Field>

                  {!canQueue && needsSave && (
                    <Typography.Muted className="text-[10px] text-muted-foreground/60">
                      Save the vehicle first, then you can add it to the queue.
                    </Typography.Muted>
                  )}

                  {!canQueue && resolvedVehicleId && !resolvedCustomerId && (
                    <Typography.Text className="text-[10px] text-amber-600">
                      Fill in owner info (name + phone) and save to add to
                      queue.
                    </Typography.Text>
                  )}

                  {queueError && (
                    <div className=" bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-2 text-xs text-red-600 dark:text-red-400">
                      {queueError}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant={canQueue ? "default" : "outline"}
                    size="default"
                    disabled={
                      queueSaving ||
                      (!canQueue && !needsSave) ||
                      (!!resolvedVehicleId && !resolvedCustomerId)
                    }
                    onClick={handleAddToQueue}
                  >
                    {queueSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MessageSquarePlus className="size-4" />
                    )}
                    {queueSaving
                      ? "Adding..."
                      : canQueue
                        ? "Add to Queue"
                        : needsSave
                          ? "Save & Add to Queue"
                          : "Add to Queue"}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right: Timeline */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-7  bg-amber-500/10">
                <HistoryIcon className="size-3.5 text-amber-500" />
              </div>
              <span className="text-sm font-semibold">
                {t("serviceTimeline")}
              </span>
              {lookupResult.serviceHistory.length > 0 && (
                <span className=" bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {lookupResult.serviceHistory.length}
                </span>
              )}
            </div>

            {lookupDone ? (
              <ScrollArea className="max-h-[420px] pr-1">
                {lookupResult.vehicle && (
                  <div className="mb-4  bg-muted/30 border border-border/60 p-3">
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
                          className="size-5  border border-border"
                          style={{
                            backgroundColor:
                              lookupResult.vehicle.color.toLowerCase(),
                          }}
                          title={lookupResult.vehicle.color}
                        />
                      )}
                    </div>
                    {lookupResult.customer && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
