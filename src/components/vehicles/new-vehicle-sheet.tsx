"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CarFront, Loader2, Plus, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ColorSelect } from "@/components/vehicles/color-select";
import {
  carCatalogKeys,
  useCarBrands,
  useCarModels,
} from "@/lib/queries/use-car-catalog";
import { useCustomerSearch } from "@/lib/queries/use-wizard-data";
import { QuickCreateCustomerSheet } from "@/components/customers/quick-create-customer-sheet";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { formatPlateInput, inputProps } from "@/lib/form-ux";
import { vehicleKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Customer } from "@/lib/types";
import { Typography } from "@/components/ui/typography";

type VehicleFormState = {
  plateNumber: string;
  vin: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: string;
  trim: string;
  color: string;
  engine: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  bodyType: string;
  steering: string;
  seats: string;
  category: string;
  countryOfOrigin: string;
  odometer: string;
  licenseExpiryAt: string;
  nextServiceAt: string;
  importDate: string;
  notes: string;
};

const initialForm: VehicleFormState = {
  plateNumber: "",
  vin: "",
  chassisNumber: "",
  make: "",
  model: "",
  year: "",
  trim: "",
  color: "",
  engine: "",
  fuelType: "",
  transmission: "",
  drivetrain: "",
  bodyType: "",
  steering: "",
  seats: "",
  category: "",
  countryOfOrigin: "",
  odometer: "",
  licenseExpiryAt: "",
  nextServiceAt: "",
  importDate: "",
  notes: "",
};

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

type NewVehicleSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (vehicleId: string) => void;
};

export function NewVehicleSheet({
  open,
  onOpenChange,
  onSuccess,
}: NewVehicleSheetProps) {
  const queryClient = useQueryClient();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const t = useTranslations("vehicles");
  const commonT = useTranslations("common");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<VehicleFormState>(initialForm);

  // Customer search via React Query
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: customerResults = [], isFetching: customerSearching } =
    useCustomerSearch(orgId ?? undefined, customerSearch);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Quick create customer
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  // Car catalog dropdowns
  const { data: brands = [] } = useCarBrands();
  const selectedBrand = brands.find(
    (b) => b.name.toLowerCase() === form.make.toLowerCase(),
  );
  const { data: models = [] } = useCarModels(selectedBrand?.id ?? null);

  const handleModelSelect = (modelName: string) => {
    setForm((current) => {
      const next = { ...current, model: modelName };
      const matched = models.find(
        (m) => m.name.toLowerCase() === modelName.toLowerCase(),
      );
      if (matched) {
        if (matched.body_type && !current.bodyType)
          next.bodyType = matched.body_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase());
        if (matched.fuel_type && !current.fuelType)
          next.fuelType = matched.fuel_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase());
        if (matched.transmission && !current.transmission)
          next.transmission = matched.transmission
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase());
        if (matched.drivetrain && !current.drivetrain)
          next.drivetrain = matched.drivetrain.split(",")[0].toUpperCase();
        if (matched.engine_options && !current.engine)
          next.engine = matched.engine_options.split(",")[0].trim();
      }
      return next;
    });
  };

  // SmartCar plate lookup
  const handlePlateLookup = async () => {
    const plate = form.plateNumber.trim();
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
      setForm((current) => ({
        ...current,
        make: d.make || current.make,
        model: d.model || current.model,
        year: d.year ? String(d.year) : current.year,
        vin: d.vin || current.vin,
        engine: d.engineCc ? String(d.engineCc) : current.engine,
        fuelType: d.fuelType || current.fuelType,
        transmission: d.transmission || current.transmission,
        bodyType: d.bodyType || current.bodyType,
        color: d.color || current.color,
        importDate: d.importDate || current.importDate,
        steering: d.steering || current.steering,
        seats: d.seats ? String(d.seats) : current.seats,
        category: d.category || current.category,
        countryOfOrigin: d.country || current.countryOfOrigin,
      }));
      toast.success(`Found: ${d.make} ${d.model} (${d.year})`);
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
      setForm((current) => ({ ...current, make: newBrand.name, model: "" }));
      setNewBrandName("");
      toast.success(`Brand "${name}" created`);
    } catch {
      toast.error("Failed to create brand");
    }
  };

  // Clear global error on form change (keep field errors until blur)
  useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const validateField = (field: string, value: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === "plateNumber") {
        if (!value.trim()) next.plateNumber = "Plate number is required";
        else if (!isValidMongolianPlate(value))
          next.plateNumber = "Must be 4 digits + 3 letters (e.g. 4444УНА)";
      } else if (field === "make") {
        if (!value.trim()) next.make = "Brand is required";
      } else if (field === "model") {
        if (!value.trim()) next.model = "Model is required";
      } else if (field === "year") {
        if (
          value &&
          (Number(value) < 1900 || Number(value) > new Date().getFullYear() + 1)
        )
          next.year = "Invalid year";
      } else if (field === "odometer") {
        if (value && Number(value) < 0) next.odometer = "Must be positive";
      } else if (field === "vin") {
        if (value && value.length !== 17)
          next.vin = "VIN must be 17 characters";
      } else if (field === "seats") {
        if (value && (Number(value) < 1 || Number(value) > 50))
          next.seats = "Must be 1–50";
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orgId) {
      setError("No organization selected");
      return;
    }

    if (!selectedCustomer) {
      setError("Select a customer before creating a vehicle");
      return;
    }

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!form.plateNumber.trim())
      errors.plateNumber = "Plate number is required";
    else if (!isValidMongolianPlate(form.plateNumber))
      errors.plateNumber = "Must be 4 digits + 3 letters (e.g. 4444УНА)";
    if (!form.make.trim()) errors.make = "Brand is required";
    if (!form.model.trim()) errors.model = "Model is required";
    if (
      form.year &&
      (Number(form.year) < 1900 ||
        Number(form.year) > new Date().getFullYear() + 1)
    )
      errors.year = "Invalid year";
    if (form.odometer && Number(form.odometer) < 0)
      errors.odometer = "Must be positive";
    if (form.vin && form.vin.length !== 17)
      errors.vin = "VIN must be 17 characters";
    if (form.seats && (Number(form.seats) < 1 || Number(form.seats) > 50))
      errors.seats = "Must be 1–50";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${orgId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customerId: selectedCustomer.id,
          year: form.year ? Number(form.year) : undefined,
          odometer: form.odometer ? Number(form.odometer) : undefined,
        }),
      });
      const json = await response.json();

      if (json.error) {
        toast.error(json.error.message);
        return;
      }

      toast.success("Vehicle created");
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.all(orgId),
      });
      setForm(initialForm);
      setSelectedCustomer(null);
      setCustomerSearch("");
      onSuccess?.(json.data.id);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm(initialForm);
      setError(null);
      setFieldErrors({});
      setSelectedCustomer(null);
      setCustomerSearch("");
      setShowQuickCustomer(false);
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl"
        showCloseButton
      >
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>{t("addVehicle")}</SheetTitle>
          <SheetDescription>
            Register a vehicle and link it to its current owner.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 p-4">
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <Typography.Text className="text-sm text-destructive">
                    {error}
                  </Typography.Text>
                </CardContent>
              </Card>
            )}

            <form onSubmit={handleSubmit} id="new-vehicle-sheet-form">
              <input
                type="submit"
                style={{ display: "none" }}
                aria-hidden="true"
              />

              {/* ── Owner Section ── */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="size-4" />
                    Owner
                    <span className="text-destructive">*</span>
                    {selectedCustomer && (
                      <span className="ml-auto text-sm font-normal text-muted-foreground">
                        {getCustomerLabel(selectedCustomer)}
                        {selectedCustomer.phone &&
                          ` · ${selectedCustomer.phone}`}
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
                    </div>
                  )}
                </CardContent>
              </Card>

              {orgId && (
                <QuickCreateCustomerSheet
                  open={showQuickCustomer}
                  onOpenChange={setShowQuickCustomer}
                  orgId={orgId}
                  onCreated={(customer) => setSelectedCustomer(customer)}
                />
              )}

              {/* ── Vehicle Information Section ── */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-plate"
                    >
                      Plate Number <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="sheet-vehicle-plate"
                        value={form.plateNumber}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            plateNumber: formatPlateInput(
                              transliterateMongolianPlate(event.target.value),
                            ),
                          }))
                        }
                        onBlur={() =>
                          validateField("plateNumber", form.plateNumber)
                        }
                        className={`h-11 flex-1 font-mono ${fieldErrors.plateNumber ? "border-destructive" : ""}`}
                        placeholder="1234 UBA"
                        aria-invalid={!!fieldErrors.plateNumber}
                        {...inputProps("plate")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 shrink-0"
                        onClick={handlePlateLookup}
                        disabled={looking || !form.plateNumber.trim()}
                        title="Lookup plate on SmartCar.mn"
                      >
                        {looking ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Search className="size-4" />
                        )}
                      </Button>
                    </div>
                    {fieldErrors.plateNumber && (
                      <Typography.Text className="mt-1 text-xs text-destructive">
                        {fieldErrors.plateNumber}
                      </Typography.Text>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-vin"
                    >
                      VIN
                    </label>
                    <Input
                      id="sheet-vehicle-vin"
                      value={form.vin}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          vin: event.target.value,
                        }))
                      }
                      onBlur={() => validateField("vin", form.vin)}
                      className={`h-11 font-mono ${fieldErrors.vin ? "border-destructive" : ""}`}
                      placeholder="JTJHK31U..."
                      aria-invalid={!!fieldErrors.vin}
                      {...inputProps("vin")}
                    />
                    {fieldErrors.vin && (
                      <Typography.Text className="mt-1 text-xs text-destructive">
                        {fieldErrors.vin}
                      </Typography.Text>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-make"
                    >
                      Make <span className="text-destructive">*</span>
                    </label>
                    <Combobox
                      items={brands}
                      value={selectedBrand ?? null}
                      onValueChange={(brand) => {
                        setForm((current) => ({
                          ...current,
                          make: brand?.name ?? "",
                          model: "",
                        }));
                      }}
                      onInputValueChange={(inputValue) =>
                        setNewBrandName(inputValue)
                      }
                      isItemEqualToValue={(a, b) => a.id === b.id}
                      itemToStringLabel={(brand) => brand.name}
                    >
                      <ComboboxInput
                        placeholder="Search brand..."
                        className={`h-11 ${fieldErrors.make ? "border-destructive" : ""}`}
                        aria-invalid={!!fieldErrors.make}
                      />
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
                            className="flex w-full items-center gap-2 px-2 py-2 text-xs hover:bg-accent"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleCreateBrand();
                            }}
                          >
                            <Plus className="size-4" />
                            Add "{newBrandName}"
                          </button>
                        </ComboboxEmpty>
                      </ComboboxContent>
                    </Combobox>
                    {fieldErrors.make && (
                      <Typography.Text className="mt-1 text-xs text-destructive">
                        {fieldErrors.make}
                      </Typography.Text>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-model"
                    >
                      Model <span className="text-destructive">*</span>
                    </label>
                    <Combobox
                      items={models}
                      value={models.find((m) => m.name === form.model) ?? null}
                      onValueChange={(model) => {
                        if (model) handleModelSelect(model.name);
                      }}
                      disabled={!selectedBrand}
                      isItemEqualToValue={(a, b) => a.id === b.id}
                      itemToStringLabel={(model) => model.name}
                    >
                      <ComboboxInput
                        placeholder={
                          selectedBrand
                            ? "Search model..."
                            : "Select brand first"
                        }
                        className={`h-11 ${fieldErrors.model ? "border-destructive" : ""}`}
                        aria-invalid={!!fieldErrors.model}
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {(model: (typeof models)[number]) => (
                            <ComboboxItem key={model.id} value={model}>
                              <span>
                                {model.name}
                                {model.year_start
                                  ? ` (${model.year_start}${model.year_end ? "-" + model.year_end : "+"})`
                                  : ""}
                              </span>
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                        <ComboboxEmpty>No model found</ComboboxEmpty>
                      </ComboboxContent>
                    </Combobox>
                    {fieldErrors.model && (
                      <Typography.Text className="mt-1 text-xs text-destructive">
                        {fieldErrors.model}
                      </Typography.Text>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-year"
                    >
                      Year
                    </label>
                    <Input
                      id="sheet-vehicle-year"
                      type="number"
                      value={form.year}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          year: event.target.value,
                        }))
                      }
                      onBlur={() => validateField("year", form.year)}
                      className={`h-11 ${fieldErrors.year ? "border-destructive" : ""}`}
                      placeholder="2020"
                      aria-invalid={!!fieldErrors.year}
                      {...inputProps("year")}
                    />
                    {fieldErrors.year && (
                      <Typography.Text className="mt-1 text-xs text-destructive">
                        {fieldErrors.year}
                      </Typography.Text>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-odometer"
                    >
                      Odometer (km)
                    </label>
                    <Input
                      id="sheet-vehicle-odometer"
                      type="number"
                      value={form.odometer}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          odometer: event.target.value,
                        }))
                      }
                      onBlur={() => validateField("odometer", form.odometer)}
                      className={`h-11 ${fieldErrors.odometer ? "border-destructive" : ""}`}
                      placeholder="120000"
                      aria-invalid={!!fieldErrors.odometer}
                      {...inputProps("odometer")}
                    />
                    {fieldErrors.odometer && (
                      <Typography.Text className="mt-1 text-xs text-destructive">
                        {fieldErrors.odometer}
                      </Typography.Text>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-trim"
                    >
                      Trim
                    </label>
                    <Input
                      id="sheet-vehicle-trim"
                      value={form.trim}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          trim: event.target.value,
                        }))
                      }
                      className="h-11"
                      {...inputProps("trim")}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-color"
                    >
                      Color
                    </label>
                    <ColorSelect
                      value={form.color}
                      onChange={(color) =>
                        setForm((current) => ({ ...current, color }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-engine"
                    >
                      Engine
                    </label>
                    <Input
                      id="sheet-vehicle-engine"
                      value={form.engine}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          engine: event.target.value,
                        }))
                      }
                      className="h-11"
                      {...inputProps("engine")}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-chassis"
                    >
                      Chassis Number
                    </label>
                    <Input
                      id="sheet-vehicle-chassis"
                      value={form.chassisNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          chassisNumber: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-fuel"
                    >
                      Fuel Type
                    </label>
                    <Select
                      id="sheet-vehicle-fuel"
                      value={form.fuelType || null}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          fuelType: val ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
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
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-transmission"
                    >
                      Transmission
                    </label>
                    <Select
                      id="sheet-vehicle-transmission"
                      value={form.transmission || null}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          transmission: val ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Automatic">Automatic</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="CVT">CVT</SelectItem>
                        <SelectItem value="DCT">DCT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-drivetrain"
                    >
                      Drivetrain
                    </label>
                    <Select
                      id="sheet-vehicle-drivetrain"
                      value={form.drivetrain || null}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          drivetrain: val ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select drivetrain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AWD">AWD</SelectItem>
                        <SelectItem value="4WD">4WD</SelectItem>
                        <SelectItem value="FWD">FWD</SelectItem>
                        <SelectItem value="RWD">RWD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-body"
                    >
                      Body Type
                    </label>
                    <Select
                      id="sheet-vehicle-body"
                      value={form.bodyType || null}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          bodyType: val ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="Hatchback">Hatchback</SelectItem>
                        <SelectItem value="Coupe">Coupe</SelectItem>
                        <SelectItem value="Convertible">Convertible</SelectItem>
                        <SelectItem value="Wagon">Wagon</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Bus">Bus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-steering"
                    >
                      Steering
                    </label>
                    <Select
                      id="sheet-vehicle-steering"
                      value={form.steering || null}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          steering: val ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select steering side" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Left">Left (Лев)</SelectItem>
                        <SelectItem value="Right">Right (Баруун)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-seats"
                    >
                      Seats
                    </label>
                    <Input
                      id="sheet-vehicle-seats"
                      type="number"
                      value={form.seats}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          seats: event.target.value,
                        }))
                      }
                      onBlur={() => validateField("seats", form.seats)}
                      className={`h-11 ${fieldErrors.seats ? "border-destructive" : ""}`}
                      placeholder="8"
                      min="1"
                      max="50"
                      aria-invalid={!!fieldErrors.seats}
                    />
                    {fieldErrors.seats && (
                      <Typography.Text className="mt-1 text-xs text-destructive">
                        {fieldErrors.seats}
                      </Typography.Text>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-category"
                    >
                      Category
                    </label>
                    <Select
                      id="sheet-vehicle-category"
                      value={form.category || null}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          category: val ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Family">
                          Гэр бүлийн (Family)
                        </SelectItem>
                        <SelectItem value="Business">
                          Бизнес (Business)
                        </SelectItem>
                        <SelectItem value="Commercial">
                          Ачины (Commercial)
                        </SelectItem>
                        <SelectItem value="Sports">Спорт (Sports)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-country"
                    >
                      Country of Origin
                    </label>
                    <Select
                      id="sheet-vehicle-country"
                      value={form.countryOfOrigin || null}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          countryOfOrigin: val ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Japan">Япон (Japan)</SelectItem>
                        <SelectItem value="Korea">Солонгос (Korea)</SelectItem>
                        <SelectItem value="Germany">
                          Герман (Germany)
                        </SelectItem>
                        <SelectItem value="USA">АНУ (USA)</SelectItem>
                        <SelectItem value="China">Хятад (China)</SelectItem>
                        <SelectItem value="Russia">Орос (Russia)</SelectItem>
                        <SelectItem value="Other">Бусад (Other)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-license"
                    >
                      License Expiry
                    </label>
                    <Input
                      id="sheet-vehicle-license"
                      type="date"
                      value={form.licenseExpiryAt}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          licenseExpiryAt: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-next-service"
                    >
                      Next Service
                    </label>
                    <Input
                      id="sheet-vehicle-next-service"
                      type="date"
                      value={form.nextServiceAt}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          nextServiceAt: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="sheet-vehicle-notes"
                    >
                      Notes
                    </label>
                    <Textarea
                      id="sheet-vehicle-notes"
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Condition notes, accessories, or customer requests"
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 border-t bg-background p-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="min-h-[48px] flex-1"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>
            <Button
              type="submit"
              form="new-vehicle-sheet-form"
              size="default"
              disabled={saving || !selectedCustomer}
              className="min-h-[48px] gap-2 flex-1"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CarFront className="size-4" />
              )}
              {saving ? "Saving..." : "Create Vehicle"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
