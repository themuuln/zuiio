"use client";

import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HistoryIcon,
  Loader2,
  Search,
  User,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { NumericInput } from "@/components/ui/numeric-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { ColorSelect } from "@/components/vehicles/color-select";
import { formatPlateInput } from "@/lib/form-ux";
import {
  normalizeMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { reportServerError } from "@/lib/sentry-report-server";
import {
  addVehicleToQueue,
  lookupVehicleByPlate,
  quickRegisterVehicle,
  searchVehicles,
} from "@/lib/services/bay-view-actions";
import { assignVehicleToBay } from "@/lib/services/bay-view-service.actions";
import { StatusTimeline } from "./_status-timeline";
import {
  EMPTY_LOOKUP,
  type LookupResult,
  type SearchVehicleResult,
  type VehicleRegistrationFormValues,
  vehicleRegistrationSchema,
} from "./_vehicle-registration-schema";

// ── Types ──────────────────────────────────────────────────

export interface VehicleRegistrationFormProps {
  bayNumber: number;
  assignBayNumber?: number;
  branchId?: string;
  onRefresh?: () => void;
  onAssigned?: () => void;
  onQueued?: () => void;
}

// ── Component ──────────────────────────────────────────────

export function VehicleRegistrationForm({
  bayNumber,
  assignBayNumber,
  branchId,
  onRefresh,
  onAssigned,
  onQueued,
}: VehicleRegistrationFormProps) {
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
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Save state ────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMode, setSaveMode] = useState<"created" | "updated" | null>(null);

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

  // Focus plate on mount
  useEffect(() => {
    plateRef.current?.focus();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

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
  const handleLookup = useCallback(
    async (plateOverride?: string) => {
      const plateToSearch = plateOverride ?? plate;
      if (!plateToSearch.trim()) return;
      setLookupLoading(true);
      setLookupError(null);
      setLookupDone(false);
      setSaveSuccess(false);
      setSaveError(null);

      try {
        const result = await lookupVehicleByPlate(
          plateToSearch.trim().toUpperCase(),
        );
        setLookupResult(result);
        setLookupDone(true);
      } catch (err) {
        reportServerError("Unexpected error", err);
        setLookupError(
          err instanceof Error ? err.message : t("common.somethingWentWrong"),
        );
      } finally {
        setLookupLoading(false);
      }
    },
    [plate, t],
  );

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
      // Pass plate directly to avoid stale closure from setPlate
      handleLookup(vehicle.plate_number);
    },
    [handleLookup],
  );

  // ── Save payload ──────────────────────────────────────────
  const getSavePayload = useCallback(
    (data: VehicleRegistrationFormValues) => ({
      plateNumber: normalizeMongolianPlate(plate.trim()),
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

  // ── Save handler — saves vehicle + adds to queue, optionally assigns to bay ──
  const handleSave = useCallback(
    async (data: VehicleRegistrationFormValues) => {
      if (!plate.trim() || !data.make.trim() || !data.model.trim()) return;
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      try {
        const saveResult = await quickRegisterVehicle(getSavePayload(data));

        setSaveSuccess(true);
        setSaveMode(saveResult.isUpdate ? "updated" : "created");

        // Add to queue
        try {
          const { workOrderId } = await addVehicleToQueue({
            vehicleId: saveResult.vehicle.id,
            customerId: saveResult.customerId ?? undefined,
            complaint: data.complaint?.trim() || undefined,
            branchId,
          });

          // Assign to bay if requested
          if (assignBayNumber && workOrderId) {
            try {
              await assignVehicleToBay(workOrderId, assignBayNumber);
              onAssigned?.();
            } catch {
              onQueued?.();
            }
          } else {
            onQueued?.();
          }

          // Refresh lookup to get timeline
          const refreshResult = await lookupVehicleByPlate(
            normalizeMongolianPlate(plate.trim()),
          );
          setLookupResult(refreshResult);
          setLookupDone(true);

          onRefresh?.();
        } catch (err) {
          reportServerError("Unexpected error", err);
          // Vehicle was saved but queue failed — still notify parent
          onQueued?.();
        }
      } catch (err) {
        reportServerError("Unexpected error", err);
        setSaveError(
          err instanceof Error ? err.message : t("common.somethingWentWrong"),
        );
      } finally {
        setSaving(false);
      }
    },
    [
      plate,
      getSavePayload,
      t,
      branchId,
      assignBayNumber,
      onRefresh,
      onAssigned,
      onQueued,
    ],
  );

  // ── Existing vehicle queue handler ────────────────────────
  const handleQueueExisting = useCallback(async () => {
    const vehicleId = lookupResult.vehicle?.id;
    const customerId = lookupResult.customer?.id ?? null;

    if (!vehicleId) return;

    try {
      const formData = form.getValues();
      const { workOrderId } = await addVehicleToQueue({
        vehicleId,
        customerId: customerId ?? undefined,
        complaint: formData.complaint?.trim() || undefined,
        branchId,
      });

      // Assign to bay if requested
      if (assignBayNumber && workOrderId) {
        try {
          await assignVehicleToBay(workOrderId, assignBayNumber);
          onAssigned?.();
        } catch {
          onQueued?.();
        }
      } else {
        onQueued?.();
      }

      onRefresh?.();
    } catch (err) {
      reportServerError("Unexpected error", err);
    }
  }, [
    lookupResult,
    branchId,
    assignBayNumber,
    onRefresh,
    onAssigned,
    onQueued,
    form,
  ]);

  // ── Derived state ─────────────────────────────────────────
  const formValues = form.watch();
  const isExistingVehicle = lookupDone && lookupResult.exists;
  const activeWorkOrder =
    lookupDone && lookupResult.exists
      ? lookupResult.serviceHistory.find(
          (wo) => wo.status !== "Completed" && wo.status !== "Cancelled",
        )
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Plate Input ────────────────────────────────────── */}
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
            placeholder={t("enterPlate")}
            className="h-9 pl-10 pr-8 font-mono uppercase"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
          )}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-lg shadow-lg max-h-60 overflow-auto">
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
          onClick={() => handleLookup()}
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

      {/* ── Error/Success Banners ──────────────────────────── */}
      {lookupError && (
        <div className="bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs text-destructive">
          {lookupError}
        </div>
      )}

      {saveError && (
        <div className="bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs text-destructive">
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-success/10 border border-success/20 px-4 py-2 text-xs text-success flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          {saveMode === "updated"
            ? t("vehicleUpdated")
            : t("vehicleRegistered")}
        </div>
      )}

      {lookupDone && !lookupResult.exists && (
        <div className="bg-warning/10 border border-warning/20 px-4 py-2 text-xs text-warning-foreground">
          {t("vehicleNotFound")}
        </div>
      )}

      {/* ── Existing Vehicle: Assign/Queue Section ─────────── */}
      {isExistingVehicle && (
        <div className="flex flex-col gap-3 bg-muted/30 border border-border/60 rounded-lg p-4">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="size-4 text-primary" />
            {t("assignToBayNumber", { bayNumber: String(bayNumber) })}
          </Label>

          <Button
            type="button"
            variant="default"
            size="default"
            disabled={!!activeWorkOrder}
            onClick={handleQueueExisting}
            className="w-full"
          >
            <Zap className="size-4" />
            {activeWorkOrder
              ? activeWorkOrder.bay_number
                ? t("vehicleAlreadyInBay", {
                    bayNumber: String(activeWorkOrder.bay_number),
                  })
                : t("vehicleAlreadyInQueue")
              : t("assignToBayNumber", { bayNumber: String(bayNumber) })}
          </Button>
        </div>
      )}

      {/* ── New Vehicle: Registration Form ─────────────────── */}
      {lookupDone && !lookupResult.exists && (
        <form
          id="vehicle-registration-form"
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
                  <NumericInput
                    size="sm"
                    value={formValues.year ? parseInt(formValues.year, 10) : 0}
                    onChange={(val) =>
                      form.setValue("year", val?.toString() ?? "", {
                        shouldValidate: true,
                      })
                    }
                    onBlur={() => form.trigger("year")}
                    placeholder={`${t("year")} (e.g. 2020)`}
                    aria-invalid={!!form.formState.errors.year}
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
                    <NumericInput
                      size="sm"
                      value={
                        formValues.odometer
                          ? parseInt(formValues.odometer, 10)
                          : 0
                      }
                      onChange={(val) =>
                        form.setValue("odometer", val?.toString() ?? "", {
                          shouldValidate: true,
                        })
                      }
                      onBlur={() => form.trigger("odometer")}
                      className="text-xs"
                      placeholder={`${t("odometer")} (e.g. 120000)`}
                      aria-invalid={!!form.formState.errors.odometer}
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
                  <span className="text-sm font-medium">{t("ownerInfo")}</span>
                  {formValues.custFirstName || formValues.custPhone ? (
                    <p className="text-xs text-muted-foreground">
                      {[formValues.custFirstName, formValues.custLastName]
                        .filter(Boolean)
                        .join(" ") || t("unknown")}
                      {formValues.custPhone ? ` · ${formValues.custPhone}` : ""}
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

          {/* ── Customer Nested Drawer (conditional to avoid Base UI nesting context) ── */}
          {customerDrawerOpen && (
            <DetailDrawer
              open
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
              </DetailDrawer.Body>
              <DetailDrawer.Footer>
                <DetailDrawer.FooterActions>
                  <Button
                    variant="outline"
                    onClick={() => setCustomerDrawerOpen(false)}
                  >
                    {t("common.cancel") ?? "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={() => setCustomerDrawerOpen(false)}
                  >
                    {t("common.save") ?? "Save"}
                  </Button>
                </DetailDrawer.FooterActions>
              </DetailDrawer.Footer>
            </DetailDrawer>
          )}

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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(handleSave)();
                    }
                  }}
                />
              </FieldContent>
            </Field>
          </div>

          {/* ── Save Button (inline for new vehicles) ── */}
          <Button type="submit" disabled={saving} size="lg" className="w-full">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Zap className="size-4" />
            )}
            {saving ? t("saving") : t("saveAndAddToQueue")}
          </Button>
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

      {/* ── Active Work Order Warning ─────────────────────── */}
      {activeWorkOrder && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertTriangle className="size-4 mt-0.5 shrink-0 text-warning" />
          <Typography.Text className="text-sm text-warning-foreground">
            {activeWorkOrder.bay_number
              ? t("vehicleAlreadyInBay", {
                  bayNumber: String(activeWorkOrder.bay_number),
                })
              : t("vehicleAlreadyInQueue")}
          </Typography.Text>
        </div>
      )}

      {/* ── Bottom: Timeline ─────────────────────────────── */}
      {lookupDone && lookupResult.exists && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center size-8 bg-warning/10">
              <HistoryIcon className="size-4 text-warning" />
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
          <ScrollArea className="max-h-[420px] pr-1">
            {lookupResult.vehicle && (
              <div className="mb-4 bg-muted/30 border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">
                      {lookupResult.vehicle.plate_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lookupResult.vehicle.make} {lookupResult.vehicle.model}
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
              </div>
            )}
            <StatusTimeline
              mode="service"
              history={lookupResult.serviceHistory}
            />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
