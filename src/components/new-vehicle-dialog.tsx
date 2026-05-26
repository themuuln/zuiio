"use client";

import { CarFront, Loader2, User } from "lucide-react";
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
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Customer } from "@/lib/types";

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
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleFormState>(initialForm);
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
        setCustomerResults(Array.isArray(json.data) ? json.data : []);
      } catch {
        setError("Failed to search customers");
      } finally {
        setCustomerSearching(false);
      }
    },
    [orgId],
  );

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
      onOpenChange(false);
      replace(`/dashboard/vehicles/${json.data.id}`);
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
              <p className="text-sm text-destructive">{error}</p>
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
                      <p className="font-medium">
                        {getCustomerLabel(selectedCustomer)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.phone ||
                          selectedCustomer.email ||
                          "No contact info"}
                      </p>
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
                    <p className="text-sm text-muted-foreground">
                      Search for an existing customer before adding the vehicle.
                    </p>
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
                            <p className="font-medium">
                              {getCustomerLabel(customer)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customer.phone ||
                                customer.email ||
                                "No contact info"}
                            </p>
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
                <Input
                  id="vehicle-plate"
                  value={form.plateNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      plateNumber: event.target.value.toUpperCase(),
                    }))
                  }
                  className="h-11 font-mono"
                  placeholder="1234 UBA"
                />
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
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-make"
                >
                  Make
                </label>
                <Input
                  id="vehicle-make"
                  value={form.make}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      make: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="Toyota"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-model"
                >
                  Model
                </label>
                <Input
                  id="vehicle-model"
                  value={form.model}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      model: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="Prius"
                />
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
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-color"
                >
                  Color
                </label>
                <Input
                  id="vehicle-color"
                  value={form.color}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      color: event.target.value,
                    }))
                  }
                  className="h-11"
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
                <Input
                  id="vehicle-fuel"
                  value={form.fuelType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fuelType: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="Gasoline"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-transmission"
                >
                  Transmission
                </label>
                <Input
                  id="vehicle-transmission"
                  value={form.transmission}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      transmission: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="Automatic"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-drivetrain"
                >
                  Drivetrain
                </label>
                <Input
                  id="vehicle-drivetrain"
                  value={form.drivetrain}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      drivetrain: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="AWD"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="vehicle-body"
                >
                  Body Type
                </label>
                <Input
                  id="vehicle-body"
                  value={form.bodyType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bodyType: event.target.value,
                    }))
                  }
                  className="h-11"
                  placeholder="SUV"
                />
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
            <Button type="submit" size="lg" disabled={saving}>
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
