"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CarFront,
  Check,
  ChevronDown,
  Loader2,
  Search,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ColorSelect } from "@/components/vehicles/color-select";
import { useCarBrands, useCarModels } from "@/lib/queries/use-car-catalog";
import { useRouter } from "@/lib/i18n/navigation";
import { usePageHeader } from "@/hooks/use-page-header";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { inputProps } from "@/lib/form-ux";
import { vehicleKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Customer, VehicleWithOwner } from "@/lib/types";
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

type NewVehicleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewVehicleDialog({
  open,
  onOpenChange,
}: NewVehicleDialogProps) {
  const { replace } = useRouter();
  const { setDetailVehicleId } = usePageHeader();
  const queryClient = useQueryClient();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [form, setForm] = useState<VehicleFormState>(initialForm);

  // Car catalog dropdowns
  const { data: brands = [] } = useCarBrands();
  const selectedBrand = brands.find(
    (b) => b.name.toLowerCase() === form.make.toLowerCase(),
  );
  const { data: models = [] } = useCarModels(selectedBrand?.id ?? null);
  const selectedModel = models.find(
    (m) => m.name.toLowerCase() === form.model.toLowerCase(),
  );
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()),
  );

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
      }));
      toast.success(`Found: ${d.make} ${d.model} (${d.year})`);
    } catch {
      toast.error("Lookup failed — try again");
    } finally {
      setLooking(false);
    }
  };

  // When a model is selected, auto-fill related fields from the catalog
  const handleModelSelect = (modelName: string) => {
    setForm((current) => {
      const next = { ...current, model: modelName };
      const matched = models.find(
        (m) => m.name.toLowerCase() === modelName.toLowerCase(),
      );
      if (matched) {
        if (matched.body_type && !current.bodyType) {
          // Capitalize first letter for display
          next.bodyType = matched.body_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase());
        }
        if (matched.fuel_type && !current.fuelType) {
          next.fuelType = matched.fuel_type
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase());
        }
        if (matched.transmission && !current.transmission) {
          next.transmission = matched.transmission
            .split(",")[0]
            .replace(/^\w/, (c) => c.toUpperCase());
        }
        if (matched.drivetrain && !current.drivetrain) {
          next.drivetrain = matched.drivetrain.split(",")[0].toUpperCase();
        }
        if (matched.engine_options && !current.engine) {
          next.engine = matched.engine_options.split(",")[0].trim();
        }
      }
      return next;
    });
  };
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const searchCustomers = useCallback(
    async (query: string) => {
      if (!orgId || !query.trim()) {
        setCustomerResults([]);
        return;
      }

      setCustomerSearching(true);

      try {
        const response = await fetch(
          `/api/organizations/${orgId}/customers?q=${encodeURIComponent(query)}`,
        );
        const json = await response.json();
        const customers = json.data?.data ?? json.data;
        setCustomerResults(Array.isArray(customers) ? customers : []);
      } catch {
        setError("Failed to search customers");
      } finally {
        setCustomerSearching(false);
      }
    },
    [orgId],
  );

  // Clear errors on any input change
  useEffect(() => {
    if (error || Object.keys(fieldErrors).length > 0) {
      setError(null);
      setFieldErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

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
    if (!form.make.trim()) errors.make = "Make is required";
    if (!form.model.trim()) errors.model = "Model is required";
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

      // Optimistic cache update — keep list consistent while navigating away
      const ownerName =
        [selectedCustomer.first_name, selectedCustomer.last_name]
          .filter(Boolean)
          .join(" ") || null;
      const optimisticVehicle: VehicleWithOwner = {
        ...json.data,
        owner_name: ownerName,
        owner_phone: selectedCustomer.phone ?? null,
      };
      queryClient.setQueryData(
        vehicleKeys.list(orgId, ""),
        (old: VehicleWithOwner[] | undefined) => [
          optimisticVehicle,
          ...(old ?? []),
        ],
      );
      queryClient.invalidateQueries({
        queryKey: vehicleKeys.all(orgId),
      });
      onOpenChange(false);
      replace("/dashboard/vehicles");
      setDetailVehicleId(json.data.id);
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
      setCustomerResults([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Vehicle</DialogTitle>
          <DialogDescription>
            Register a vehicle and link it to its current owner.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <Typography.Text className="text-sm text-destructive">
                {error}
              </Typography.Text>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Owner</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </div>
                    <div>
                      <Typography.Text className="font-medium">
                        {getCustomerLabel(selectedCustomer)}
                      </Typography.Text>
                      <Typography.Muted className="text-sm text-muted-foreground">
                        {selectedCustomer.phone ||
                          selectedCustomer.email ||
                          "No contact info"}
                      </Typography.Muted>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <SearchInput
                    placeholder="Search customer by name, phone, or company..."
                    loading={customerSearching}
                    onSearch={searchCustomers}
                    debounceMs={400}
                  />
                  {!Array.isArray(customerResults) ||
                  customerResults.length === 0 ? (
                    <Typography.Muted className="text-sm text-muted-foreground">
                      Search for an existing customer before adding the vehicle.
                    </Typography.Muted>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {customerResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <User className="size-4" />
                          </div>
                          <div>
                            <Typography.Text className="font-medium">
                              {getCustomerLabel(customer)}
                            </Typography.Text>
                            <Typography.Muted className="text-sm text-muted-foreground">
                              {customer.phone ||
                                customer.email ||
                                "No contact info"}
                            </Typography.Muted>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-plate"
                >
                  Plate Number
                </label>
                <div className="flex gap-2">
                  <Input
                    id="vehicle-plate"
                    value={form.plateNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        plateNumber: transliterateMongolianPlate(
                          event.target.value,
                        ),
                      }))
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
                  htmlFor="vehicle-vin"
                >
                  VIN
                </label>
                <Input
                  id="vehicle-vin"
                  value={form.vin}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      vin: event.target.value,
                    }))
                  }
                  className="h-11 font-mono"
                  placeholder="JTJHK31U..."
                  {...inputProps("vin")}
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-make"
                >
                  Make
                </label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        id="vehicle-make"
                        className={`flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${fieldErrors.make ? "border-destructive" : ""}`}
                        aria-invalid={!!fieldErrors.make}
                      />
                    }
                  >
                    <span className={form.make ? "" : "text-muted-foreground"}>
                      {form.make || "Select brand"}
                    </span>
                    <ChevronDown className="size-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <div className="border-b border-border p-2">
                      <Input
                        placeholder="Search..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredBrands.map((brand) => (
                        <button
                          key={brand.id}
                          type="button"
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${selectedBrand?.id === brand.id ? "bg-accent" : ""}`}
                          onClick={() => {
                            setForm((current) => ({
                              ...current,
                              make: brand.name,
                              model: "",
                            }));
                            setBrandSearch("");
                          }}
                        >
                          {selectedBrand?.id === brand.id && (
                            <Check className="size-4" />
                          )}
                          {brand.name}
                        </button>
                      ))}
                      {brandSearch &&
                        !filteredBrands.some(
                          (b) =>
                            b.name.toLowerCase() === brandSearch.toLowerCase(),
                        ) && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                make: brandSearch,
                                model: "",
                              }));
                              setBrandSearch("");
                            }}
                          >
                            Use \"{brandSearch}\"
                          </button>
                        )}
                    </div>
                  </PopoverContent>
                </Popover>
                {fieldErrors.make && (
                  <Typography.Text className="mt-1 text-xs text-destructive">
                    {fieldErrors.make}
                  </Typography.Text>
                )}
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-model"
                >
                  Model
                </label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        id="vehicle-model"
                        disabled={!selectedBrand && !form.make}
                        className={`flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors.model ? "border-destructive" : ""}`}
                        aria-invalid={!!fieldErrors.model}
                      />
                    }
                  >
                    <span className={form.model ? "" : "text-muted-foreground"}>
                      {form.model || "Select model"}
                    </span>
                    <ChevronDown className="size-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <div className="border-b border-border p-2">
                      <Input
                        placeholder="Search..."
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${selectedModel?.id === model.id ? "bg-accent" : ""}`}
                          onClick={() => {
                            handleModelSelect(model.name);
                            setModelSearch("");
                          }}
                        >
                          {selectedModel?.id === model.id && (
                            <Check className="size-4" />
                          )}
                          {model.name}
                          {model.year_start
                            ? ` (${model.year_start}${model.year_end ? "-" + model.year_end : "+"})`
                            : ""}
                        </button>
                      ))}
                      {modelSearch &&
                        !filteredModels.some(
                          (m) =>
                            m.name.toLowerCase() === modelSearch.toLowerCase(),
                        ) && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              handleModelSelect(modelSearch);
                              setModelSearch("");
                            }}
                          >
                            Use \"{modelSearch}\"
                          </button>
                        )}
                    </div>
                  </PopoverContent>
                </Popover>
                {fieldErrors.model && (
                  <Typography.Text className="mt-1 text-xs text-destructive">
                    {fieldErrors.model}
                  </Typography.Text>
                )}
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-year"
                >
                  Year
                </label>
                <Input
                  id="vehicle-year"
                  type="number"
                  value={form.year}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      year: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="2020"
                  {...inputProps("year")}
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-odometer"
                >
                  Odometer (km)
                </label>
                <Input
                  id="vehicle-odometer"
                  type="number"
                  value={form.odometer}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      odometer: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="120000"
                  {...inputProps("odometer")}
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-trim"
                >
                  Trim
                </label>
                <Input
                  id="vehicle-trim"
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
                  htmlFor="vehicle-color"
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
                  htmlFor="vehicle-engine"
                >
                  Engine
                </label>
                <Input
                  id="vehicle-engine"
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
                  htmlFor="vehicle-chassis"
                >
                  Chassis Number
                </label>
                <Input
                  id="vehicle-chassis"
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
                  htmlFor="vehicle-fuel"
                >
                  Fuel Type
                </label>
                <Select
                  id="vehicle-fuel"
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
                  htmlFor="vehicle-transmission"
                >
                  Transmission
                </label>
                <Select
                  id="vehicle-transmission"
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
                  htmlFor="vehicle-drivetrain"
                >
                  Drivetrain
                </label>
                <Select
                  id="vehicle-drivetrain"
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
                  htmlFor="vehicle-body"
                >
                  Body Type
                </label>
                <Select
                  id="vehicle-body"
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
                  htmlFor="vehicle-license"
                >
                  License Expiry
                </label>
                <Input
                  id="vehicle-license"
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
                  htmlFor="vehicle-next-service"
                >
                  Next Service
                </label>
                <Input
                  id="vehicle-next-service"
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
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-import-date"
                >
                  Import Date
                </label>
                <Input
                  id="vehicle-import-date"
                  type="date"
                  value={form.importDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      importDate: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-notes"
                >
                  Notes
                </label>
                <textarea
                  id="vehicle-notes"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Condition notes, accessories, or customer requests"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="default" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CarFront className="size-4" />
              )}
              {saving ? "Saving..." : "Create Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
