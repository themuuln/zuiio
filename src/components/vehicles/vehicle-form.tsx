"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus, Search, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CustomerForm } from "@/components/customers/customer-form";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { ColorSelect } from "@/components/vehicles/color-select";
import { formatPlateInput, inputProps } from "@/lib/form-ux";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  carCatalogKeys,
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

// ── Schema ───────────────────────────────────────────────────
// Number fields are strings in the form (matching <Input type="number">).
// Validated in submit handler, converted to number there.

const vehicleSchema = z.object({
  plateNumber: z
    .string()
    .min(1, "Plate number is required")
    .refine(
      (val) => isValidMongolianPlate(val),
      "Must be 4 digits + 3 letters (e.g. 4444УНА)",
    ),
  make: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().optional(),
  vin: z.string().optional(),
  chassisNumber: z.string().optional(),
  trim: z.string().optional(),
  color: z.string().optional(),
  engine: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  bodyType: z.string().optional(),
  odometer: z.string().optional(),
  notes: z.string().optional(),
  licenseExpiryAt: z.string().optional(),
  nextServiceAt: z.string().optional(),
  importDate: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  category: z.string().optional(),
  seats: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

// ── Helpers ──────────────────────────────────────────────────

function getCustomerLabel(customer: Customer) {
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.company_name ||
    customer.contact_person ||
    customer.full_name ||
    customer.phone ||
    "Unnamed customer"
  );
}

// ── Component ────────────────────────────────────────────────

export type VehicleFormProps = {
  mode?: "quick" | "full";
  initialData?: Partial<CreateVehicleParams>;
  customerId?: string;
  showOwnerSelect?: boolean;
  onSuccess?: (vehicle: Vehicle) => void;
  onCancel?: () => void;
};

export function VehicleForm({
  mode = "full",
  initialData,
  customerId,
  showOwnerSelect = true,
  onSuccess,
  onCancel,
}: VehicleFormProps) {
  const queryClient = useQueryClient();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? "";
  const t = useTranslations("vehicles");
  const commonT = useTranslations("common");

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

  const watchedMake = form.watch("make");
  const selectedBrand = brands.find(
    (b) => b.name.toLowerCase() === (watchedMake || "").toLowerCase(),
  );
  const { data: models = [] } = useFilteredCarModels(
    selectedBrand?.id ?? null,
    orgSettingsRes.settings as Record<string, unknown> | undefined,
  );

  // ── Handlers ─────────────────────────────────────────────

  const handlePlateLookup = async () => {
    const plate = form.getValues("plateNumber").trim();
    if (!plate || plate.length < 7) {
      toast.error("Enter a valid plate number first");
      return;
    }
    setLooking(true);
    try {
      const res = await fetch(
        `/api/smartcar/lookup?plate=${encodeURIComponent(plate)}`,
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Lookup failed");
        return;
      }
      const d = json.data;
      if (d.make) form.setValue("make", d.make);
      if (d.model) form.setValue("model", d.model);
      if (d.year) form.setValue("year", String(d.year));
      if (d.vin) form.setValue("vin", d.vin);
      if (d.engineCc) form.setValue("engine", String(d.engineCc));
      if (d.fuelType) form.setValue("fuelType", d.fuelType);
      if (d.transmission) form.setValue("transmission", d.transmission);
      if (d.bodyType) form.setValue("bodyType", d.bodyType);
      toast.success("Plate lookup complete");
    } catch {
      toast.error("Lookup failed — try again");
    } finally {
      setLooking(false);
    }
  };

  const handleCreateBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/car-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      const newBrand = json.data;
      await queryClient.invalidateQueries({
        queryKey: carCatalogKeys.brands(),
      });
      form.setValue("make", newBrand.name);
      form.setValue("model", "");
      setNewBrandName("");
      toast.success(`Brand "${name}" created`);
    } catch {
      toast.error("Failed to create brand");
    }
  };

  const handleCreateModel = async () => {
    const name = newModelName.trim();
    if (!name || !selectedBrand) return;
    try {
      const res = await fetch(`/api/car-brands/${selectedBrand.id}/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      const newModel = json.data;
      await queryClient.invalidateQueries({
        queryKey: carCatalogKeys.models(selectedBrand.id),
      });
      form.setValue("model", newModel.name);
      setNewModelName("");
      toast.success(`Model "${name}" created`);
    } catch {
      toast.error("Failed to create model");
    }
  };

  const handleModelSelect = (modelName: string) => {
    form.setValue("model", modelName);
    const matched = models.find(
      (m) => m.name.toLowerCase() === modelName.toLowerCase(),
    );
    if (matched) {
      if (matched.body_type && !form.getValues("bodyType"))
        form.setValue(
          "bodyType",
          matched.body_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase()),
        );
      if (matched.fuel_type && !form.getValues("fuelType"))
        form.setValue(
          "fuelType",
          matched.fuel_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase()),
        );
      if (matched.transmission && !form.getValues("transmission"))
        form.setValue(
          "transmission",
          matched.transmission
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase()),
        );
      if (matched.drivetrain && !form.getValues("drivetrain"))
        form.setValue(
          "drivetrain",
          matched.drivetrain.split(",")[0].toUpperCase(),
        );
      if (matched.engine_options && !form.getValues("engine"))
        form.setValue("engine", matched.engine_options.split(",")[0].trim());
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!orgId) {
      setError("No organization selected");
      return;
    }

    // Validate optional number / format fields
    if (data.year?.trim()) {
      const n = Number(data.year);
      if (Number.isNaN(n) || n < 1900 || n > new Date().getFullYear() + 2) {
        form.setError("year", { message: "Enter a valid year" });
        return;
      }
    }
    if (data.odometer?.trim()) {
      const n = Number(data.odometer);
      if (Number.isNaN(n) || n < 0) {
        form.setError("odometer", { message: "Must be a positive number" });
        return;
      }
    }
    if (data.vin && data.vin.length !== 17) {
      form.setError("vin", { message: "VIN must be 17 characters" });
      return;
    }
    if (data.seats?.trim()) {
      const n = Number(data.seats);
      if (Number.isNaN(n) || n < 1 || n > 50) {
        form.setError("seats", { message: "Must be 1–50" });
        return;
      }
    }

    // Full-mode owner validation
    if (currentMode === "full" && showOwnerSelect && !selectedCustomer) {
      form.setError("root", {
        message: "Customer owner is required",
      });
      return;
    }

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
      };

      const vehicle = await createVehicleMutation.mutateAsync(payload);
      onSuccess?.(vehicle);
    } catch (err: any) {
      setError(err.message || "Failed to create vehicle");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* ── Mode Toggle Tabs ── */}
      <Tabs
        value={currentMode}
        onValueChange={(val) => setCurrentMode(val as "quick" | "full")}
        className="w-full shrink-0 animate-fade-in"
      >
        <TabsList className="flex w-full h-9 p-0.5 rounded-lg bg-muted border border-border">
          <TabsTrigger
            value="quick"
            className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
          >
            {t("quickCreateVehicle", { fallback: "Quick Vehicle" })}
          </TabsTrigger>
          <TabsTrigger
            value="full"
            className="flex-1 w-full rounded-md py-1 text-xs justify-center cursor-pointer"
          >
            {t("addVehicle", { fallback: "Full Details" })}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Customer Owner Section (Inline Customer Form) ── */}
      {currentMode === "full" && showOwnerSelect && (
        <Card className="border-border animate-fade-in">
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center justify-between">
              Owner Customer <span className="text-destructive">*</span>
              {selectedCustomer && (
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {getCustomerLabel(selectedCustomer)}
                  {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4">
                <div className="flex items-center gap-3">
                  <User className="size-5 text-green-600" />
                  <div>
                    <span className="font-medium">
                      {getCustomerLabel(selectedCustomer)}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {selectedCustomer.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!showQuickCustomer && (
                  <>
                    <SearchInput
                      placeholder="Search by name or phone..."
                      loading={customerSearching}
                      onSearch={setCustomerSearch}
                      debounceMs={400}
                    />
                    {customerSearch && customerResults.length > 0 && (
                      <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                        {customerResults.map((c) => (
                          <Button
                            variant="ghost"
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCustomer(c)}
                            className="w-full justify-start gap-3 p-3 min-h-[52px] h-auto"
                          >
                            <User className="size-5 shrink-0 text-muted-foreground" />
                            <div>
                              <span className="font-medium">
                                {getCustomerLabel(c)}
                              </span>
                              {c.phone && (
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {c.phone}
                                </span>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuickCustomer(true)}
                      className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
                    >
                      <Plus className="size-4" />
                      Quick add customer
                    </Button>
                  </>
                )}

                {/* Inline customer quick registration form */}
                {showQuickCustomer && (
                  <div className="border rounded-lg p-4 bg-muted/20 mt-2">
                    <Typography.Text className="text-sm font-semibold mb-3 block">
                      Quick Add Customer
                    </Typography.Text>
                    <CustomerForm
                      mode="quick"
                      onSuccess={(cust) => {
                        setSelectedCustomer(cust);
                        setShowQuickCustomer(false);
                      }}
                      onCancel={() => setShowQuickCustomer(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Vehicle Info Section ── */}
      <Card className="border-border">
        <CardHeader className="py-4">
          <CardTitle className="text-base">Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Plate Number */}
          <Field data-invalid={!!form.formState.errors.plateNumber}>
            <FieldLabel>
              Plate Number <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <div className="flex gap-2">
                <Input
                  value={form.watch("plateNumber")}
                  onChange={(e) => {
                    const formatted = formatPlateInput(
                      transliterateMongolianPlate(e.target.value),
                    );
                    form.setValue("plateNumber", formatted);
                  }}
                  className="h-11 flex-1 font-mono uppercase"
                  placeholder="4444УНА"
                  aria-invalid={!!form.formState.errors.plateNumber}
                  {...inputProps("plate")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 shrink-0 w-11"
                  onClick={handlePlateLookup}
                  disabled={looking || !form.watch("plateNumber")?.trim()}
                  title="Lookup plate on SmartCar.mn"
                >
                  {looking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.plateNumber && (
                <FieldError>
                  {form.formState.errors.plateNumber.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Make */}
          <Field data-invalid={!!form.formState.errors.make}>
            <FieldLabel>
              Make <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Combobox
                items={brands}
                value={selectedBrand ?? null}
                onValueChange={(brand) => {
                  form.setValue("make", brand?.name ?? "");
                  form.setValue("model", "");
                }}
                onInputValueChange={(inputValue) => setNewBrandName(inputValue)}
                isItemEqualToValue={(a, b) => a.id === b.id}
                itemToStringLabel={(brand) => brand.name}
              >
                <ComboboxInput placeholder="Search brand..." className="h-11" />
                <ComboboxContent>
                  <ComboboxList>
                    {(brand: (typeof brands)[number]) => (
                      <ComboboxItem key={brand.id} value={brand}>
                        {brand.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxEmpty>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-2 py-2 text-xs hover:bg-accent cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCreateBrand();
                      }}
                    >
                      <Plus className="size-4" />
                      Add &quot;{newBrandName}&quot;
                    </button>
                  </ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
              {form.formState.errors.make && (
                <FieldError>{form.formState.errors.make.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Model */}
          <Field data-invalid={!!form.formState.errors.model}>
            <FieldLabel>
              Model <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Combobox
                items={models}
                value={
                  models.find((m) => m.name === form.watch("model")) ?? null
                }
                onValueChange={(model) => {
                  if (model) handleModelSelect(model.name);
                }}
                onInputValueChange={(inputValue) => setNewModelName(inputValue)}
                disabled={!selectedBrand}
                isItemEqualToValue={(a, b) => a.id === b.id}
                itemToStringLabel={(model) => model.name}
              >
                <ComboboxInput
                  placeholder={
                    selectedBrand ? "Search model..." : "Select brand first"
                  }
                  className="h-11"
                />
                <ComboboxContent>
                  <ComboboxList>
                    {(model: (typeof models)[number]) => (
                      <ComboboxItem key={model.id} value={model}>
                        <span>
                          {model.name}
                          {model.year_start
                            ? ` (${model.year_start}${model.year_end ? `-${model.year_end}` : "+"})`
                            : ""}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxEmpty>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-2 py-2 text-xs hover:bg-accent cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCreateModel();
                      }}
                    >
                      <Plus className="size-4" />
                      Add &quot;{newModelName}&quot;
                    </button>
                  </ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
              {form.formState.errors.model && (
                <FieldError>{form.formState.errors.model.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Year */}
          <Field data-invalid={!!form.formState.errors.year}>
            <FieldLabel>Year</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                value={form.watch("year") || ""}
                onChange={(e) => form.setValue("year", e.target.value)}
                placeholder="2020"
                aria-invalid={!!form.formState.errors.year}
                {...inputProps("year")}
              />
              {form.formState.errors.year && (
                <FieldError>{form.formState.errors.year.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Odometer */}
          <Field data-invalid={!!form.formState.errors.odometer}>
            <FieldLabel>Odometer (km)</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                value={form.watch("odometer") || ""}
                onChange={(e) => form.setValue("odometer", e.target.value)}
                placeholder="120000"
                aria-invalid={!!form.formState.errors.odometer}
                {...inputProps("odometer")}
              />
              {form.formState.errors.odometer && (
                <FieldError>
                  {form.formState.errors.odometer.message}
                </FieldError>
              )}
            </FieldContent>
          </Field>

          {/* Color */}
          <Field>
            <FieldLabel>Color</FieldLabel>
            <FieldContent>
              <ColorSelect
                value={form.watch("color") || ""}
                onChange={(color) => form.setValue("color", color)}
                className="w-full"
              />
            </FieldContent>
          </Field>

          {/* Engine */}
          <Field>
            <FieldLabel>Engine</FieldLabel>
            <FieldContent>
              <Input
                value={form.watch("engine") || ""}
                onChange={(e) => form.setValue("engine", e.target.value)}
                placeholder="e.g. 2.5L, 3500cc"
                {...inputProps("engine")}
              />
            </FieldContent>
          </Field>

          {/* ── Full Mode Fields ── */}
          {currentMode === "full" && (
            <>
              <Field data-invalid={!!form.formState.errors.vin}>
                <FieldLabel>VIN</FieldLabel>
                <FieldContent>
                  <Input
                    value={form.watch("vin") || ""}
                    onChange={(e) => form.setValue("vin", e.target.value)}
                    className="font-mono"
                    placeholder="17 character VIN"
                    aria-invalid={!!form.formState.errors.vin}
                    {...inputProps("vin")}
                  />
                  {form.formState.errors.vin && (
                    <FieldError>{form.formState.errors.vin.message}</FieldError>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Chassis Number</FieldLabel>
                <FieldContent>
                  <Input
                    value={form.watch("chassisNumber") || ""}
                    onChange={(e) =>
                      form.setValue("chassisNumber", e.target.value)
                    }
                    className="font-mono"
                    placeholder="Frame/Chassis"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Trim</FieldLabel>
                <FieldContent>
                  <Input
                    value={form.watch("trim") || ""}
                    onChange={(e) => form.setValue("trim", e.target.value)}
                    placeholder="e.g. LE, Limited"
                    {...inputProps("trim")}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Fuel Type</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("fuelType") || ""}
                    onValueChange={(val) =>
                      form.setValue("fuelType", val ?? undefined)
                    }
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasoline">Gasoline</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="LPG">LPG</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Transmission</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("transmission") || ""}
                    onValueChange={(val) =>
                      form.setValue("transmission", val ?? undefined)
                    }
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="CVT">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Drivetrain</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("drivetrain") || ""}
                    onValueChange={(val) =>
                      form.setValue("drivetrain", val ?? undefined)
                    }
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select drivetrain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FWD">
                        FWD (Front Wheel Drive)
                      </SelectItem>
                      <SelectItem value="RWD">
                        RWD (Rear Wheel Drive)
                      </SelectItem>
                      <SelectItem value="AWD">AWD (All Wheel Drive)</SelectItem>
                      <SelectItem value="4WD">
                        4WD (Four Wheel Drive)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Body Type</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("bodyType") || ""}
                    onValueChange={(val) =>
                      form.setValue("bodyType", val ?? undefined)
                    }
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Crossover">Crossover</SelectItem>
                      <SelectItem value="Hatchback">Hatchback</SelectItem>
                      <SelectItem value="Wagon">Wagon</SelectItem>
                      <SelectItem value="Coupe">Coupe</SelectItem>
                      <SelectItem value="Convertible">Convertible</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.seats}>
                <FieldLabel>Seats</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    value={form.watch("seats") || ""}
                    onChange={(e) => form.setValue("seats", e.target.value)}
                    placeholder="5"
                    aria-invalid={!!form.formState.errors.seats}
                  />
                  {form.formState.errors.seats && (
                    <FieldError>
                      {form.formState.errors.seats.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>License Expiry</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={form.watch("licenseExpiryAt") || ""}
                    onChange={(e) =>
                      form.setValue("licenseExpiryAt", e.target.value)
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Next Service Due</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={form.watch("nextServiceAt") || ""}
                    onChange={(e) =>
                      form.setValue("nextServiceAt", e.target.value)
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Import Date</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={form.watch("importDate") || ""}
                    onChange={(e) =>
                      form.setValue("importDate", e.target.value)
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Country of Origin</FieldLabel>
                <FieldContent>
                  <Input
                    value={form.watch("countryOfOrigin") || ""}
                    onChange={(e) =>
                      form.setValue("countryOfOrigin", e.target.value)
                    }
                    placeholder="e.g. Japan, Germany"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Vehicle Category</FieldLabel>
                <FieldContent>
                  <Input
                    value={form.watch("category") || ""}
                    onChange={(e) => form.setValue("category", e.target.value)}
                    placeholder="e.g. M1, N1"
                  />
                </FieldContent>
              </Field>
            </>
          )}

          {/* Notes — always visible */}
          <div className="sm:col-span-2">
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  value={form.watch("notes") || ""}
                  onChange={(e) => form.setValue("notes", e.target.value)}
                  placeholder="General vehicle history or custom notes"
                  rows={2}
                />
              </FieldContent>
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            className="h-11 px-6"
          >
            {commonT("cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            form.formState.isSubmitting || createVehicleMutation.isPending
          }
          className="h-11 px-6 min-w-[140px]"
        >
          {form.formState.isSubmitting || createVehicleMutation.isPending ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            t("addVehicle")
          )}
        </Button>
      </div>
    </form>
  );
}
