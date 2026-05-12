"use client";

import { ArrowLeft, Car, Plus, Trash2, User, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MechanicSelect } from "@/components/mechanic-select";
import { Breadcrumb } from "@/components/breadcrumb";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import type { Customer, ServiceCatalog, Vehicle } from "@/lib/types";

interface ServiceLine {
  service_catalog_id: string | null;
  name: string;
  base_price: number;
  quantity: number;
  discount_amount_mnt: number;
  discount_percent: number;
  final_price: number;
  last_price?: number;
}

interface PartLine {
  part_name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  final_price: number;
  last_price?: number;
}

function formatMNT(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Customer ──
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickFirstName, setQuickFirstName] = useState("");
  const [quickLastName, setQuickLastName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [customerSearching, setCustomerSearching] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerCreateError, setCustomerCreateError] = useState<string | null>(
    null,
  );

  // ── Vehicle ──
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showQuickVehicle, setShowQuickVehicle] = useState(false);
  const [quickPlate, setQuickPlate] = useState("");
  const [quickMake, setQuickMake] = useState("");
  const [quickModel, setQuickModel] = useState("");
  const [quickYear, setQuickYear] = useState("");
  const [vehicleSearching, setVehicleSearching] = useState(false);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [vehicleCreateError, setVehicleCreateError] = useState<string | null>(
    null,
  );

  // ── Service Catalog & Lines ──
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [priceHistory, setPriceHistory] = useState<Record<string, number>>({});
  const [serviceSearch, setServiceSearch] = useState("");

  // ── Parts ──
  const [partLines, setPartLines] = useState<PartLine[]>([]);
  const [partHistory, setPartHistory] = useState<Record<string, number>>({});

  // ── Mechanic ──
  const [mechanics, setMechanics] = useState<
    { id: string; fullName: string | null; email: string }[]
  >([]);
  const [selectedMechanic, setSelectedMechanic] = useState("");

  // ── Notes ──
  const [description, setDescription] = useState("");

  // ── Auto-fill customer vehicles on select ──
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setCustomerSearch("");
      setShowQuickCustomer(false);
      // Pre-fill vehicle search with customer's vehicles
      if (orgId) {
        fetch(
          `/api/organizations/${orgId}/vehicles?customer=${customer.id}`,
        )
          .then((r) => r.json())
          .then((d) => {
            if (d.data?.length > 0) {
              setVehicles(d.data);
              setVehicleSearch(""); // Show customer's vehicles
            }
          })
          .catch(() => {});
      }
    },
    [orgId],
  );

  // ── Load initial data ──
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const orgId = d?.organizationId ?? d?.data?.organizationId;
        if (orgId) {
          setOrgId(orgId);
          Promise.all([
            fetch(`/api/organizations/${orgId}/services`).then((r) => r.json()),
            fetch(`/api/organizations/${orgId}/reports?type=mechanics`).then(
              (r) => r.json(),
            ),
            fetch(
              `/api/organizations/${orgId}/reports?type=dashboard&period=all`,
            ).then((r) => r.json()),
          ]).then(([catJson, mechJson, dashJson]) => {
            if (catJson.data) setCatalog(catJson.data);
            if (mechJson.data?.mechanics)
              setMechanics(mechJson.data.mechanics);
            // Load price history from top services
            if (dashJson.data?.topServices) {
              const prices: Record<string, number> = {};
              for (const svc of dashJson.data.topServices) {
                if (svc.revenue > 0 && svc.count > 0) {
                  prices[svc.name] = Math.round(svc.revenue / svc.count);
                }
              }
              setPriceHistory(prices);
            }
          });
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, []);

  // ── Search customers ──
  useEffect(() => {
    if (!orgId || !customerSearch) {
      if (!customerSearch) setCustomers([]);
      return;
    }
    setCustomerSearching(true);
    fetch(
      `/api/organizations/${orgId}/customers?q=${encodeURIComponent(customerSearch)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.data ?? []);
      })
      .finally(() => setCustomerSearching(false));
  }, [orgId, customerSearch]);

  // ── Search vehicles by plate ──
  useEffect(() => {
    if (!orgId || !vehicleSearch || vehicleSearch.length < 2) {
      if (!vehicleSearch && !selectedCustomer) setVehicles([]);
      return;
    }
    setVehicleSearching(true);
    const url = selectedCustomer
      ? `/api/organizations/${orgId}/vehicles?customer=${selectedCustomer.id}&plate=${encodeURIComponent(vehicleSearch)}`
      : `/api/organizations/${orgId}/vehicles?plate=${encodeURIComponent(vehicleSearch)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setVehicles(d.data ?? []);
      })
      .finally(() => setVehicleSearching(false));
  }, [orgId, vehicleSearch, selectedCustomer]);

  // ── Service handlers ──
  const addService = (svc: ServiceCatalog) => {
    if (serviceLines.find((s) => s.service_catalog_id === svc.id)) return;
    const last = priceHistory[svc.name] ?? Number(svc.default_price);
    setServiceLines((prev) => [
      ...prev,
      {
        service_catalog_id: svc.id,
        name: svc.name,
        base_price: Number(svc.default_price),
        quantity: 1,
        discount_amount_mnt: 0,
        discount_percent: 0,
        final_price: last,
        last_price: last !== Number(svc.default_price) ? last : undefined,
      },
    ]);
  };

  const updateService = (
    idx: number,
    field: keyof ServiceLine,
    value: number | string,
  ) => {
    setServiceLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      const s = updated[idx];
      const subtotal = Number(s.base_price) * Number(s.quantity);
      const discountMnt = Number(s.discount_amount_mnt);
      const discountPct = Number(s.discount_percent);
      updated[idx].final_price = Math.max(
        0,
        subtotal - discountMnt - (subtotal * discountPct) / 100,
      );
      return updated;
    });
  };

  const removeService = (idx: number) =>
    setServiceLines((prev) => prev.filter((_, i) => i !== idx));

  // ── Part handlers ──
  const addPart = () => {
    setPartLines((prev) => [
      ...prev,
      {
        part_name: "",
        part_number: "",
        quantity: 1,
        unit_price: 0,
        final_price: 0,
      },
    ]);
  };

  const updatePart = (
    idx: number,
    field: keyof PartLine,
    value: string | number,
  ) => {
    setPartLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        updated[idx].final_price =
          Number(updated[idx].quantity) * Number(updated[idx].unit_price);
      }
      return updated;
    });
  };

  const removePart = (idx: number) =>
    setPartLines((prev) => prev.filter((_, i) => i !== idx));

  // ── Totals ──
  const servicesTotal = serviceLines.reduce((s, l) => s + l.final_price, 0);
  const partsTotal = partLines.reduce((s, l) => s + l.final_price, 0);
  const grandTotal = servicesTotal + partsTotal;

  // ── Create Work Order ──
  const handleCreate = async () => {
    if (!orgId || !selectedCustomer || !selectedVehicle) {
      toast.error("Customer and vehicle are required");
      return;
    }
    setSaving(true);
    try {
      const woRes = await fetch(`/api/organizations/${orgId}/work-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          vehicle_id: selectedVehicle.id,
          description,
          mechanic_id: selectedMechanic || null,
        }),
      });
      const woJson = await woRes.json();
      if (woJson.error || !woJson.data) {
        toast.error(woJson.error?.message ?? "Failed to create work order");
        setSaving(false);
        return;
      }
      const woId = woJson.data.id;

      for (const svc of serviceLines) {
        await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}/services`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(svc),
          },
        );
      }
      for (const part of partLines) {
        await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}/parts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(part),
          },
        );
      }
      toast.success("Work order created");
      router.push(`/dashboard/work-orders/${woId}`);
    } catch {
      toast.error("Failed to create work order");
      setSaving(false);
    }
  };

  // ── Quick create customer ──
  const handleQuickCreateCustomer = async () => {
    if (!orgId || !quickFirstName.trim()) {
      setCustomerCreateError("First name is required");
      return;
    }
    setCreatingCustomer(true);
    setCustomerCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: quickFirstName.trim(),
          last_name: quickLastName.trim() || null,
          phone: quickPhone.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setCustomerCreateError(json.error.message ?? "Failed to create customer");
      } else if (json.data) {
        handleSelectCustomer(json.data);
        setQuickFirstName("");
        setQuickLastName("");
        setQuickPhone("");
        setShowQuickCustomer(false);
      }
    } catch {
      setCustomerCreateError("Network error — please try again");
    } finally {
      setCreatingCustomer(false);
    }
  };

  // ── Quick create vehicle ──
  const handleQuickCreateVehicle = async () => {
    if (!orgId || !quickPlate.trim()) {
      setVehicleCreateError("Plate number is required");
      return;
    }
    setCreatingVehicle(true);
    setVehicleCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate_number: quickPlate.trim().toUpperCase(),
          make: quickMake.trim() || "Unknown",
          model: quickModel.trim() || "Unknown",
          year: quickYear ? parseInt(quickYear, 10) : null,
          customer_id: selectedCustomer?.id ?? null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setVehicleCreateError(json.error.message ?? "Failed to create vehicle");
      } else if (json.data) {
        setSelectedVehicle(json.data);
        setQuickPlate("");
        setQuickMake("");
        setQuickModel("");
        setQuickYear("");
        setShowQuickVehicle(false);
      }
    } catch {
      setVehicleCreateError("Network error — please try again");
    } finally {
      setCreatingVehicle(false);
    }
  };

  const isFormValid = selectedCustomer && selectedVehicle && !saving;
  const customerRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Work Orders", href: "/dashboard/work-orders" },
          { label: "New Work Order" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard/work-orders" />}
          variant="ghost"
          size="icon"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Work Order</h1>
          <p className="text-sm text-muted-foreground">
            Create a work order in one page — all fields visible at a glance
          </p>
        </div>
      </div>

      {/* ── Customer ── */}
      <Card ref={customerRef}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Customer
            {selectedCustomer && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {[
                  selectedCustomer.first_name,
                  selectedCustomer.last_name,
                ]
                  .filter(Boolean)
                  .join(" ")}
                {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4">
              <div className="flex items-center gap-3">
                <User className="size-5 text-green-600" />
                <div>
                  <span className="font-medium">
                    {[selectedCustomer.first_name, selectedCustomer.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                  {selectedCustomer.phone && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {selectedCustomer.phone}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(null);
                  setVehicles([]);
                  setSelectedVehicle(null);
                }}
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
              {customerSearch && customers.length > 0 && (
                <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                  {customers.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 min-h-[48px]"
                    >
                      <User className="size-5 shrink-0 text-muted-foreground" />
                      <div>
                        <span className="font-medium">
                          {[c.first_name, c.last_name]
                            .filter(Boolean)
                            .join(" ") || "No name"}
                        </span>
                        {c.phone && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {c.phone}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!showQuickCustomer && (
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(true)}
                  className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:bg-muted/30 min-h-[48px]"
                >
                  <Plus className="size-4" />
                  Quick create customer
                </button>
              )}
              {showQuickCustomer && (
                <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
                  <p className="text-sm font-medium">New Customer</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="First name *"
                      value={quickFirstName}
                      onChange={(e) => setQuickFirstName(e.target.value)}
                      className="h-11"
                    />
                    <Input
                      placeholder="Last name"
                      value={quickLastName}
                      onChange={(e) => setQuickLastName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <Input
                    placeholder="Phone"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="h-11"
                  />
                  {customerCreateError && (
                    <p className="text-sm text-destructive">
                      {customerCreateError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowQuickCustomer(false);
                        setCustomerCreateError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={creatingCustomer || !quickFirstName.trim()}
                      onClick={handleQuickCreateCustomer}
                    >
                      {creatingCustomer
                        ? "Creating..."
                        : "Create & Select Customer"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Vehicle ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="size-4" />
            Vehicle
            {selectedVehicle && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {selectedVehicle.plate_number}
                {selectedVehicle.make &&
                  ` · ${selectedVehicle.make} ${selectedVehicle.model ?? ""}`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedVehicle ? (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4">
              <div className="flex items-center gap-3">
                <Car className="size-5 text-green-600" />
                <div>
                  <span className="font-mono font-semibold">
                    {selectedVehicle.plate_number}
                  </span>
                  <span className="ml-3 text-sm text-muted-foreground">
                    {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVehicle(null)}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <SearchInput
                placeholder="Search by plate number..."
                loading={vehicleSearching}
                onSearch={setVehicleSearch}
                debounceMs={400}
              />
              {vehicleSearch && vehicles.length > 0 && (
                <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                  {vehicles.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 min-h-[48px]"
                    >
                      <Car className="size-5 shrink-0 text-muted-foreground" />
                      <div>
                        <span className="font-mono font-semibold">
                          {v.plate_number}
                        </span>
                        <span className="ml-3 text-sm text-muted-foreground">
                          {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!showQuickVehicle && (
                <button
                  type="button"
                  onClick={() => setShowQuickVehicle(true)}
                  className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:bg-muted/30 min-h-[48px]"
                >
                  <Plus className="size-4" />
                  Quick create vehicle
                </button>
              )}
              {showQuickVehicle && (
                <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
                  <p className="text-sm font-medium">New Vehicle</p>
                  <Input
                    placeholder="Plate number *"
                    value={quickPlate}
                    onChange={(e) => setQuickPlate(e.target.value)}
                    className="h-11"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      placeholder="Make"
                      value={quickMake}
                      onChange={(e) => setQuickMake(e.target.value)}
                      className="h-11"
                    />
                    <Input
                      placeholder="Model"
                      value={quickModel}
                      onChange={(e) => setQuickModel(e.target.value)}
                      className="h-11"
                    />
                    <Input
                      placeholder="Year"
                      type="number"
                      value={quickYear}
                      onChange={(e) => setQuickYear(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  {vehicleCreateError && (
                    <p className="text-sm text-destructive">
                      {vehicleCreateError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowQuickVehicle(false);
                        setVehicleCreateError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={creatingVehicle || !quickPlate.trim()}
                      onClick={handleQuickCreateVehicle}
                    >
                      {creatingVehicle
                        ? "Creating..."
                        : "Create & Select Vehicle"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Services ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="size-4" />
            Services
            {serviceLines.length > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {serviceLines.length} service{serviceLines.length !== 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Service search */}
          <div className="relative">
            <SearchInput
              placeholder="Search services to add..."
              loading={false}
              onSearch={setServiceSearch}
              debounceMs={300}
            />
            {serviceSearch && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg bg-background shadow-lg max-h-60 overflow-y-auto">
                {catalog
                  .filter(
                    (s) =>
                      s.name
                        .toLowerCase()
                        .includes(serviceSearch.toLowerCase()) ||
                      (s.category &&
                        s.category
                          .toLowerCase()
                          .includes(serviceSearch.toLowerCase())),
                  )
                  .slice(0, 12)
                  .map((svc) => {
                    const last = priceHistory[svc.name] ?? Number(svc.default_price);
                    const isAdded = serviceLines.some(
                      (s) => s.service_catalog_id === svc.id,
                    );
                    return (
                      <button
                        type="button"
                        key={svc.id}
                        onClick={() => {
                          if (!isAdded) {
                            addService(svc);
                            setServiceSearch("");
                          }
                        }}
                        disabled={isAdded}
                        className={`flex items-center justify-between w-full p-3 text-left transition-colors hover:bg-muted/50 min-h-[48px] ${
                          isAdded ? "opacity-40" : ""
                        }`}
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {svc.name}
                          </span>
                          {svc.category && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {svc.category}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatMNT(Number(svc.default_price))}
                          </span>
                          {last !== Number(svc.default_price) && last > 0 && (
                            <span className="ml-2 text-xs text-amber-600">
                              last: {formatMNT(last)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                {catalog.filter(
                  (s) =>
                    s.name
                      .toLowerCase()
                      .includes(serviceSearch.toLowerCase()) ||
                    (s.category &&
                      s.category
                        .toLowerCase()
                        .includes(serviceSearch.toLowerCase())),
                ).length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No services found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service lines */}
          {serviceLines.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {serviceLines.map((svc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 hover:bg-muted/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{svc.name}</p>
                      {svc.last_price && (
                        <p className="text-[11px] text-amber-600">
                          Last sold: {formatMNT(svc.last_price)}
                        </p>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={svc.quantity}
                      onChange={(e) =>
                        updateService(
                          idx,
                          "quantity",
                          parseInt(e.target.value, 10) || 1,
                        )
                      }
                      className="w-14 h-10 text-center"
                      min={1}
                      aria-label="Quantity"
                    />
                    <Input
                      type="number"
                      value={svc.base_price}
                      onChange={(e) =>
                        updateService(
                          idx,
                          "base_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-24 h-10"
                      aria-label="Price"
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={svc.discount_amount_mnt || ""}
                        onChange={(e) =>
                          updateService(
                            idx,
                            "discount_amount_mnt",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-20 h-10"
                        placeholder="Disc ₮"
                        aria-label="Discount amount"
                      />
                    </div>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums shrink-0">
                      {formatMNT(svc.final_price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeService(idx)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                      aria-label="Remove service"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {serviceLines.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">
              Search and add services above
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Parts ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Parts</CardTitle>
          <Button variant="outline" size="sm" onClick={addPart}>
            <Plus className="size-4" /> Add Part
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {partLines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              No parts added yet
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {partLines.map((part, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 hover:bg-muted/20"
                  >
                    <div className="flex-1 min-w-0">
                      <Input
                        value={part.part_name}
                        onChange={(e) =>
                          updatePart(idx, "part_name", e.target.value)
                        }
                        className="h-10"
                        placeholder="Part name"
                        aria-label="Part name"
                      />
                    </div>
                    <Input
                      type="number"
                      value={part.quantity}
                      onChange={(e) =>
                        updatePart(
                          idx,
                          "quantity",
                          parseInt(e.target.value, 10) || 1,
                        )
                      }
                      className="w-16 h-10 text-center"
                      min={1}
                      aria-label="Quantity"
                    />
                    <Input
                      type="number"
                      value={part.unit_price || ""}
                      onChange={(e) =>
                        updatePart(
                          idx,
                          "unit_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-24 h-10"
                      aria-label="Unit price"
                    />
                    <span className="w-24 text-right text-sm font-semibold tabular-nums shrink-0">
                      {formatMNT(part.final_price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePart(idx)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                      aria-label="Remove part"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Mechanic + Description ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mechanic</CardTitle>
          </CardHeader>
          <CardContent>
            <MechanicSelect
              value={selectedMechanic}
              onChange={setSelectedMechanic}
              mechanics={mechanics}
              size="lg"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Description / Notes (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Totals ── */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Services</span>
              <span className="font-medium tabular-nums">
                {formatMNT(servicesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts</span>
              <span className="font-medium tabular-nums">
                {formatMNT(partsTotal)}
              </span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-xl font-bold">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatMNT(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Submit ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/dashboard/work-orders")}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleCreate}
              disabled={!isFormValid}
              className="min-h-[48px] gap-2"
            >
              <Wrench className="size-4" />
              {saving
                ? "Creating..."
                : `Create Work Order — ${formatMNT(grandTotal)}`}
            </Button>
          </div>
          {(!selectedCustomer || !selectedVehicle) && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Select a customer and vehicle to enable creation
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
