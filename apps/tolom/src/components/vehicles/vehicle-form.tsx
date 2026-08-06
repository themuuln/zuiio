"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { vehicleKeys } from "@/lib/queries/keys";
import {
  type CarBrand,
  type CarModel,
  useCarBrands,
  useFilteredCarBrands,
  useFilteredCarModels,
} from "@/lib/queries/use-car-catalog";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useCreateVehicle,
  useCustomerSearch,
} from "@/lib/queries/use-wizard-data";
import type { CreateVehicleParams, Customer, Vehicle } from "@/lib/types";
import { vehicleSchema } from "@/lib/validation/vehicle-schema";
import { FormFooter } from "./form-sections/_form-footer";
import { FullDetailsSection } from "./form-sections/_full-details-section";
import { ModeTabs } from "./form-sections/_mode-tabs";
import { NotesSection } from "./form-sections/_notes-section";
import { OwnerSection } from "./form-sections/_owner-section";
import { lookupVehicleByPlate } from "./form-sections/_plate-lookup";
import type { VehicleFormValues } from "./form-sections/_types";
import { VehicleInfoSection } from "./form-sections/_vehicle-info-section";

// ── Schema ───────────────────────────────────────────────────
// Import shared vehicle schema — fields match exactly.
// Number fields are strings in the form (matching NumericInput).
// Validated in submit handler, converted to number there.

// ── Component ────────────────────────────────────────────────

export type VehicleFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreateVehicleParams>;
  customerId?: string;
  showOwnerSelect?: boolean;
  onSuccess?: (vehicle: Vehicle) => void;
  onCancel?: () => void;
  /** Show Cancel/Save buttons inside the form (default: true) */
  showButtons?: boolean;
  /** Custom form element id (for linking external submit buttons) */
  formId?: string;
};

export function VehicleForm({
  mode = "full",
  initialData,
  customerId,
  showOwnerSelect = true,
  onSuccess,
  onCancel,
  showButtons = true,
  formId = "vehicle-form",
}: VehicleFormProps) {
  const queryClient = useQueryClient();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const t = useTranslations("vehicles") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const commonT = useTranslations("common") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const [currentMode, setCurrentMode] = useState<"quick" | "full">(mode);
  const [error, setError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newModelName, setNewModelName] = useState("");

  // Customer search / selection (UI state, not form state)
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customerResults = [], isFetching: customerSearching } =
    useCustomerSearch(orgId || undefined, customerSearch);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plateNumber: initialData?.plateNumber ?? "",
      make: initialData?.make ?? "",
      model: initialData?.model ?? "",
      year: initialData?.year != null ? String(initialData.year) : "",
      vin: initialData?.vin ?? "",
      chassisNumber: initialData?.chassisNumber ?? "",
      trim: initialData?.trim ?? "",
      color: initialData?.color ?? "",
      engine: initialData?.engine ?? "",
      fuelType: initialData?.fuelType ?? "",
      transmission: initialData?.transmission ?? "",
      drivetrain: initialData?.drivetrain ?? "",
      bodyType: initialData?.bodyType ?? "",
      odometer:
        initialData?.odometer != null ? String(initialData.odometer) : "",
      notes: initialData?.notes ?? "",
      licenseExpiryAt: initialData?.licenseExpiryAt ?? "",
      nextServiceAt: initialData?.nextServiceAt ?? "",
      importDate: initialData?.importDate ?? "",
      countryOfOrigin: initialData?.countryOfOrigin ?? "",
      category: initialData?.category ?? "",
      seats: initialData?.seats != null ? String(initialData.seats) : "",
    },
  });

  // Protect unsaved form data from accidental navigation
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.formState.isDirty]);
  const createVehicleMutation = useCreateVehicle(orgId);

  // Sync mode if prop changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Clear errors on mode change
  useEffect(() => {
    setError(null);
  }, []);

  // Initialize selected customer if customerId prop is given
  useEffect(() => {
    if (customerId && orgId) {
      const fetchCustomer = async () => {
        try {
          const res = await fetch(
            `/api/organizations/${orgId}/customers?q=${customerId}`,
          );
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            const matched = json.data.find(
              (c: Customer) => c.id === customerId,
            );
            if (matched) setSelectedCustomer(matched);
          }
        } catch {
          // ignore
        }
      };
      fetchCustomer();
    }
  }, [customerId, orgId]);

  // Car catalog dropdowns
  const orgSettingsRes = useOrgSettings(orgId || undefined);
  const { data: brands = [] } = useFilteredCarBrands(
    orgSettingsRes.settings as Record<string, unknown> | undefined,
  );
  const { data: allBrands = [] } = useCarBrands();

  // Track brands/models pinned by SmartCar lookup so they appear even if outside niche
  const [pinnedBrands, setPinnedBrands] = useState<CarBrand[]>([]);
  const [pinnedModels, setPinnedModels] = useState<string[]>([]);

  // Merge pinned brands into the display list (deduped)
  const displayBrands = useMemo(() => {
    const merged = [...brands];
    for (const pb of pinnedBrands) {
      if (!merged.some((b) => b.id === pb.id)) {
        merged.push(pb);
      }
    }
    return merged;
  }, [brands, pinnedBrands]);

  const watchedMake = form.watch("make");
  const selectedBrand =
    displayBrands.find(
      (b) => b.name.toLowerCase() === (watchedMake || "").toLowerCase(),
    ) ?? null;
  const { data: models = [] } = useFilteredCarModels(
    selectedBrand?.id ?? null,
    orgSettingsRes.settings as Record<string, unknown> | undefined,
  );

  // Merge pinned models into the display list (deduped by name)
  const displayModels = useMemo(() => {
    if (!pinnedModels.length) return models;
    const existing = new Set(models.map((m) => m.name.toLowerCase()));
    const pinned = pinnedModels
      .filter((name) => !existing.has(name.toLowerCase()))
      .map(
        (name) =>
          ({
            id: `pinned-${name}`,
            name,
            body_type: null,
            fuel_type: null,
            transmission: null,
            drivetrain: null,
            year_start: null,
            year_end: null,
            engine_options: null,
            is_active: true,
          }) as CarModel,
      );
    return [...pinned, ...models];
  }, [models, pinnedModels]);

  // ── Handlers ─────────────────────────────────────────────

  const plateRef = useRef<HTMLInputElement>(null);

  const handlePlateLookup = async () => {
    plateRef.current?.blur();
    const plate = form.getValues("plateNumber").trim();
    await lookupVehicleByPlate({
      plate,
      form,
      allBrands,
      t,
      setLooking,
      setPinnedBrands,
      setPinnedModels,
    });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!orgId) {
      setError(t("noOrganization"));
      return;
    }

    // Validate optional number / format fields
    if (data.year?.trim()) {
      const n = Number(data.year);
      if (Number.isNaN(n) || n < 1900 || n > new Date().getFullYear() + 2) {
        form.setError("year", { message: t("validation.yearInvalid") });
        toast.error(t("validation.yearInvalid"));
        return;
      }
    }
    if (data.odometer?.trim()) {
      const n = Number(data.odometer);
      if (Number.isNaN(n) || n < 0) {
        form.setError("odometer", {
          message: t("validation.odometerPositive"),
        });
        toast.error(t("validation.odometerPositive"));
        return;
      }
    }
    if (data.seats?.trim()) {
      const n = Number(data.seats);
      if (Number.isNaN(n) || n < 1 || n > 50) {
        form.setError("seats", { message: t("validation.seatsRange") });
        toast.error(t("validation.seatsRange"));
        return;
      }
    }

    // Customer owner is optional — vehicle can be created without one

    setError(null);

    try {
      const payload: CreateVehicleParams = {
        plateNumber: data.plateNumber.trim().toUpperCase(),
        make: data.make.trim(),
        model: data.model.trim(),
        year: data.year?.trim() ? Number(data.year) : undefined,
        customerId: showOwnerSelect
          ? selectedCustomer?.id
          : customerId || undefined,
        vin: currentMode === "full" ? data.vin?.trim() || undefined : undefined,
        chassisNumber:
          currentMode === "full"
            ? data.chassisNumber?.trim() || undefined
            : undefined,
        trim:
          currentMode === "full" ? data.trim?.trim() || undefined : undefined,
        color: data.color?.trim() || undefined,
        engine: data.engine?.trim() || undefined,
        fuelType: data.fuelType || undefined,
        transmission: data.transmission || undefined,
        drivetrain:
          currentMode === "full" ? data.drivetrain || undefined : undefined,
        bodyType:
          currentMode === "full" ? data.bodyType || undefined : undefined,
        odometer: data.odometer?.trim() ? Number(data.odometer) : undefined,
        notes: data.notes?.trim() || undefined,
        licenseExpiryAt:
          currentMode === "full"
            ? data.licenseExpiryAt || undefined
            : undefined,
        nextServiceAt:
          currentMode === "full" ? data.nextServiceAt || undefined : undefined,
        importDate:
          currentMode === "full" ? data.importDate || undefined : undefined,
        countryOfOrigin:
          currentMode === "full"
            ? data.countryOfOrigin || undefined
            : undefined,
        category:
          currentMode === "full" ? data.category || undefined : undefined,
        seats:
          currentMode === "full" && data.seats?.trim()
            ? Number(data.seats)
            : undefined,
        steering:
          currentMode === "full" ? data.steering || undefined : undefined,
        height:
          currentMode === "full" && data.height?.trim()
            ? Number(data.height)
            : undefined,
        width:
          currentMode === "full" && data.width?.trim()
            ? Number(data.width)
            : undefined,
        length:
          currentMode === "full" && data.length?.trim()
            ? Number(data.length)
            : undefined,
        weight:
          currentMode === "full" && data.weight?.trim()
            ? Number(data.weight)
            : undefined,
      };

      const vehicle = await createVehicleMutation.mutateAsync(payload);
      // Force cache invalidation so the vehicle list refetches
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: vehicleKeys.all(orgId),
        });
      }
      onSuccess?.(vehicle);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("failedToCreateVehicle");
      setError(msg);
      toast.error(msg);
    }
  });

  return (
    <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* ── Mode Toggle Tabs ── */}
      <ModeTabs
        currentMode={currentMode}
        onModeChange={(val) => setCurrentMode(val)}
        t={t}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Customer Owner Section (Inline Customer Form) ── */}
      {currentMode === "full" && showOwnerSelect && (
        <OwnerSection
          form={form}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          customerResults={customerResults}
          customerSearching={customerSearching}
          showQuickCustomer={showQuickCustomer}
          setShowQuickCustomer={setShowQuickCustomer}
          t={t}
          commonT={commonT}
        />
      )}

      {/* ── Vehicle Info Section ── */}
      <VehicleInfoSection
        form={form}
        t={t}
        brands={brands}
        models={models}
        displayModels={displayModels}
        selectedBrand={selectedBrand}
        newBrandName={newBrandName}
        setNewBrandName={setNewBrandName}
        newModelName={newModelName}
        setNewModelName={setNewModelName}
        plateRef={plateRef}
        looking={looking}
        plateAutoFocus={!!initialData?.plateNumber}
        handlePlateLookup={handlePlateLookup}
      >
        {/* ── Full Mode Fields ── */}
        <FullDetailsSection form={form} t={t} currentMode={currentMode} />

        {/* Notes — always visible */}
        <NotesSection form={form} t={t} />
      </VehicleInfoSection>

      {showButtons && (
        <FormFooter
          onCancel={onCancel}
          disabled={
            form.formState.isSubmitting || createVehicleMutation.isPending
          }
          isSubmitting={
            form.formState.isSubmitting || createVehicleMutation.isPending
          }
          t={t}
          commonT={commonT}
        />
      )}
    </form>
  );
}
