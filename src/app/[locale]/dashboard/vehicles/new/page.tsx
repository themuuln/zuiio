"use client";

import { ArrowLeft, CarFront, Loader2, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorSelect } from "@/components/vehicles/color-select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { usePageHeader } from "@/hooks/use-page-header";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { customerKeys } from "@/lib/queries/keys";
import { useQuery } from "@tanstack/react-query";
import { formatPlateInput, inputProps } from "@/lib/form-ux";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
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
  odometer: string;
  licenseExpiryAt: string;
  nextServiceAt: string;
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
  notes: "",
};

function getCustomerLabel(customer: Customer, t?: (key: string) => string) {
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.company_name ||
    customer.contact_person ||
    customer.full_name ||
    customer.phone ||
    (t?.("unnamedCustomer") ?? "Unnamed customer")
  );
}

function NewVehicleForm() {
  const t = useTranslations("vehicles");
  const { replace } = useRouter();
  const { setDetailVehicleId } = usePageHeader();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");

  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const { data: preselectedCustomer } = useQuery({
    queryKey: customerKeys.detail(orgId ?? "", preselectedCustomerId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/customers/${preselectedCustomerId}`,
      );
      const json = await res.json();
      return json.data as Customer;
    },
    enabled: !!orgId && !!preselectedCustomerId,
    staleTime: 30_000,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<VehicleFormState>(initialForm);
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    preselectedCustomer ?? null,
  );

  // Auto-select customer when preselected data loads from URL param
  useEffect(() => {
    if (preselectedCustomer && !selectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
    }
  }, [preselectedCustomer, selectedCustomer]);

  // Load all customers when no customer is selected yet
  useEffect(() => {
    if (!selectedCustomer) {
      searchCustomers("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer]);

  const searchCustomers = useCallback(
    async (query: string) => {
      if (!orgId) {
        setCustomerResults([]);
        return;
      }

      setCustomerSearching(true);

      try {
        const url = query.trim()
          ? `/api/organizations/${orgId}/customers?q=${encodeURIComponent(query)}`
          : `/api/organizations/${orgId}/customers`;
        const response = await fetch(url);
        const json = await response.json();
        setCustomerResults(Array.isArray(json.data) ? json.data : []);
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
      setError(t("noOrganization"));
      return;
    }

    if (!selectedCustomer) {
      setError("Select a customer before creating a vehicle");
      return;
    }

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!form.plateNumber.trim())
      errors.plateNumber = t("plateRequired", {
        fallback: "Plate number is required",
      });
    else if (!isValidMongolianPlate(form.plateNumber))
      errors.plateNumber = t("plateInvalid", {
        fallback: "Must be 4 digits + 3 letters (e.g. 4444УНА)",
      });
    if (!form.make.trim())
      errors.make = t("makeRequired", { fallback: "Make is required" });
    if (!form.model.trim())
      errors.model = t("modelRequired", { fallback: "Model is required" });
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
        setError(json.error.message);
        return;
      }

      toast.success(t("vehicleCreated"));
      replace("/dashboard/vehicles");
      setDetailVehicleId(json.data.id);
    } catch {
      toast.error(t("failedToCreate"));
      setError(t("failedToCreate"));
    } finally {
      setSaving(false);
    }
  };

  if (orgQuery.isLoading) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[40rem] w-full" />
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard/vehicles" />}
          variant="ghost"
          size="icon-xs"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            New Vehicle
          </Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            Register a vehicle and link it to its current owner.
          </Typography.Muted>
        </div>
      </div>

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
            <CardTitle className="text-base">{t("owner")}</CardTitle>
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
                      {getCustomerLabel(selectedCustomer, t)}
                    </Typography.Text>
                    <Typography.Muted className="text-sm text-muted-foreground">
                      {selectedCustomer.phone ||
                        selectedCustomer.email ||
                        t("noContactInfo")}
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
                  onFocus={() => searchCustomers("")}
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
                            {getCustomerLabel(customer, t)}
                          </Typography.Text>
                          <Typography.Muted className="text-sm text-muted-foreground">
                            {customer.phone ||
                              customer.email ||
                              t("noContactInfo")}
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
            <CardTitle className="text-base">
              {t("vehicleInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor="plateNumber"
              >
                {t("plate")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="plateNumber"
                value={form.plateNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    plateNumber: formatPlateInput(
                      transliterateMongolianPlate(event.target.value),
                    ),
                  }))
                }
                className={`h-11 font-mono ${fieldErrors.plateNumber ? "border-destructive" : ""}`}
                placeholder="1234 UBA"
                aria-invalid={!!fieldErrors.plateNumber}
                {...inputProps("plate")}
              />
              {fieldErrors.plateNumber && (
                <Typography.Text className="mt-1 text-xs text-destructive">
                  {fieldErrors.plateNumber}
                </Typography.Text>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="vin">
                {t("vin")}{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="vin"
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
              <label className="mb-1 block text-sm font-medium" htmlFor="make">
                {t("make")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="make"
                value={form.make}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    make: event.target.value,
                  }))
                }
                className={`h-11 ${fieldErrors.make ? "border-destructive" : ""}`}
                aria-invalid={!!fieldErrors.make}
                placeholder="Toyota"
                {...inputProps("make")}
              />
              {fieldErrors.make && (
                <Typography.Text className="mt-1 text-xs text-destructive">
                  {fieldErrors.make}
                </Typography.Text>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="model">
                {t("model")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="model"
                value={form.model}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    model: event.target.value,
                  }))
                }
                className={`h-11 ${fieldErrors.model ? "border-destructive" : ""}`}
                aria-invalid={!!fieldErrors.model}
                placeholder="Prius"
                {...inputProps("model")}
              />
              {fieldErrors.model && (
                <Typography.Text className="mt-1 text-xs text-destructive">
                  {fieldErrors.model}
                </Typography.Text>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="year">
                {t("year")}
              </label>
              <Input
                id="year"
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
                htmlFor="odometer"
              >
                {t("odometer")}
              </label>
              <Input
                id="odometer"
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
              <label className="mb-1 block text-sm font-medium" htmlFor="trim">
                {t("trim")}
              </label>
              <Input
                id="trim"
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
              <label className="mb-1 block text-sm font-medium" htmlFor="color">
                {t("color")}
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
                htmlFor="engine"
              >
                {t("engine")}
              </label>
              <Input
                id="engine"
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
                htmlFor="chassisNumber"
              >
                {t("chassisNumber")}
              </label>
              <Input
                id="chassisNumber"
                value={form.chassisNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    chassisNumber: event.target.value,
                  }))
                }
                className="h-11"
                {...inputProps("chassis")}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor="fuelType"
              >
                {t("fuelType")}
              </label>
              <Select
                id="fuelType"
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
                htmlFor="transmission"
              >
                {t("transmission")}
              </label>
              <Select
                id="transmission"
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
                htmlFor="drivetrain"
              >
                {t("drivetrain")}
              </label>
              <Select
                id="drivetrain"
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
                htmlFor="bodyType"
              >
                {t("bodyType")}
              </label>
              <Select
                id="bodyType"
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
                htmlFor="licenseExpiryAt"
              >
                {t("licenseExpiry")}
              </label>
              <Input
                id="licenseExpiryAt"
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
                htmlFor="nextServiceAt"
              >
                {t("nextService")}
              </label>
              <Input
                id="nextServiceAt"
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
              <label className="mb-1 block text-sm font-medium" htmlFor="notes">
                {t("notes")}
              </label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Condition notes, accessories, or customer requests"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            render={<Link href="/dashboard/vehicles" />}
            type="button"
            variant="outline"
          >
            {t("cancel")}
          </Button>
          <Button type="submit" size="default" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CarFront className="size-4" />
            )}
            {saving ? t("saving") : t("createVehicle")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NewVehicleForm />
    </Suspense>
  );
}
