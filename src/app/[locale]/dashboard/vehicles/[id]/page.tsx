"use client";

import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/lib/database.types";
import { Link, useRouter } from "@/lib/i18n/navigation";

interface VehicleOwnerSummary {
  customer_id: string;
  name: string;
  phone: string | null;
  is_primary: boolean;
}

interface VehicleServiceLine {
  id: string;
  service_name: string | null;
  name: string | null;
  quantity: number;
  final_price: number;
}

interface VehicleServiceHistoryItem {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  complaint: string | null;
  total: number;
  created_at: string;
  work_order_services: VehicleServiceLine[];
}

interface VehicleDetailResponse {
  id: string;
  plate_number: string;
  vin: string | null;
  chassis_number: string | null;
  make: string;
  model: string;
  year: number | null;
  trim: string | null;
  color: string | null;
  engine: string | null;
  fuel_type: string | null;
  transmission: string | null;
  drivetrain: string | null;
  body_type: string | null;
  odometer: number | null;
  last_visit_at: string | null;
  next_service_at: string | null;
  license_expiry_at: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  owners: VehicleOwnerSummary[];
  service_history: VehicleServiceHistoryItem[];
}

interface VehicleFormState {
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
}

const emptyForm: VehicleFormState = {
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

function formatMNT(value: number) {
  return new Intl.NumberFormat("mn-MN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<VehicleFormState>(emptyForm);

  const syncForm = useCallback((nextVehicle: VehicleDetailResponse) => {
    setForm({
      plateNumber: nextVehicle.plate_number,
      vin: nextVehicle.vin ?? "",
      chassisNumber: nextVehicle.chassis_number ?? "",
      make: nextVehicle.make,
      model: nextVehicle.model,
      year: nextVehicle.year ? String(nextVehicle.year) : "",
      trim: nextVehicle.trim ?? "",
      color: nextVehicle.color ?? "",
      engine: nextVehicle.engine ?? "",
      fuelType: nextVehicle.fuel_type ?? "",
      transmission: nextVehicle.transmission ?? "",
      drivetrain: nextVehicle.drivetrain ?? "",
      bodyType: nextVehicle.body_type ?? "",
      odometer: nextVehicle.odometer ? String(nextVehicle.odometer) : "",
      licenseExpiryAt: nextVehicle.license_expiry_at?.slice(0, 10) ?? "",
      nextServiceAt: nextVehicle.next_service_at?.slice(0, 10) ?? "",
      notes: nextVehicle.notes ?? "",
    });
  }, []);

  const fetchVehicle = useCallback(async () => {
    if (!orgId || !vehicleId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
      );
      const json = await response.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      setVehicle(json.data);
      syncForm(json.data);
    } catch {
      setError("Failed to load vehicle");
    } finally {
      setLoading(false);
    }
  }, [orgId, syncForm, vehicleId]);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) => {
        const nextOrgId = data?.organizationId ?? data?.data?.organizationId;
        if (!nextOrgId) {
          setError("No organization found");
          return;
        }

        setOrgId(nextOrgId);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (orgId) {
      void fetchVehicle();
    }
  }, [fetchVehicle, orgId]);

  const handleSave = async () => {
    if (!orgId || !vehicleId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plateNumber: form.plateNumber.trim(),
            vin: form.vin.trim() || null,
            chassisNumber: form.chassisNumber.trim() || null,
            make: form.make.trim(),
            model: form.model.trim(),
            year: form.year ? Number(form.year) : null,
            trim: form.trim.trim() || null,
            color: form.color.trim() || null,
            engine: form.engine.trim() || null,
            fuelType: form.fuelType.trim() || null,
            transmission: form.transmission.trim() || null,
            drivetrain: form.drivetrain.trim() || null,
            bodyType: form.bodyType.trim() || null,
            odometer: form.odometer ? Number(form.odometer) : null,
            licenseExpiryAt: form.licenseExpiryAt || null,
            nextServiceAt: form.nextServiceAt || null,
            notes: form.notes.trim() || null,
          }),
        },
      );
      const json = await response.json();

      if (json.error) {
        toast.error(json.error.message);
        setError(json.error.message);
        return;
      }

      const nextVehicle = {
        ...(vehicle as VehicleDetailResponse),
        ...json.data,
      };

      setVehicle(nextVehicle);
      syncForm(nextVehicle);
      setEditing(false);
      toast.success("Vehicle updated");
    } catch {
      toast.error("Failed to save vehicle");
      setError("Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-[38rem] w-full" />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          render={<Link href="/dashboard/vehicles" />}
          variant="ghost"
          className="w-fit"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => void fetchVehicle()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  const primaryOwner =
    vehicle.owners.find((owner) => owner.is_primary) ??
    vehicle.owners[0] ??
    null;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Vehicles", href: "/dashboard/vehicles" },
          { label: vehicle.plate_number },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button
          render={<Link href="/dashboard/vehicles" />}
          variant="ghost"
          size="icon"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {vehicle.plate_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {[vehicle.year, vehicle.make, vehicle.model]
              .filter(Boolean)
              .join(" ")}
          </p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                syncForm(vehicle);
                setEditing(false);
              }}
            >
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {primaryOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() =>
                router.push(`/dashboard/customers/${primaryOwner.customer_id}`)
              }
              className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium">{primaryOwner.name}</p>
                <p className="text-xs text-muted-foreground">
                  {primaryOwner.phone || "No phone number"}
                </p>
              </div>
              <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle information</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <VehicleEditForm
              form={form}
              onChange={setForm}
            />
          ) : (
            <VehicleReadView vehicle={vehicle} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Last visit</p>
              <p className="text-sm font-medium">
                {formatDate(vehicle.last_visit_at)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                Next service due
              </p>
              <p className="text-sm font-medium">
                {formatDate(vehicle.next_service_at)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                License expiry
              </p>
              <p className="text-sm font-medium">
                {formatDate(vehicle.license_expiry_at)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">
                {formatDate(vehicle.created_at)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
              <p className="mb-1 text-xs text-muted-foreground">Notes</p>
              <p className="whitespace-pre-wrap text-sm font-medium">
                {vehicle.notes || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Service history ({vehicle.service_history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicle.service_history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No service history yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {vehicle.service_history.map((workOrder) => (
                <button
                  key={workOrder.id}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/work-orders/${workOrder.id}`)
                  }
                  className="rounded-lg bg-muted/50 p-4 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={workOrder.status} />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(workOrder.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {workOrder.complaint ||
                          workOrder.description ||
                          "General service"}
                      </p>
                      {workOrder.work_order_services.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {workOrder.work_order_services
                            .map(
                              (service) => service.service_name || service.name,
                            )
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMNT(Number(workOrder.total))}
                      </span>
                      <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Condensed Read-Only View ─────────────────────

function VehicleReadView({ vehicle }: { vehicle: VehicleDetailResponse }) {
  const [showMore, setShowMore] = useState(false);

  const primaryFields = [
    ["Plate number", vehicle.plate_number],
    ["Make", vehicle.make],
    ["Model", vehicle.model],
    ["Year", vehicle.year ? String(vehicle.year) : null],
    ["VIN", vehicle.vin],
    ["Odometer", vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : null],
  ];

  const detailFields = [
    ["Chassis number", vehicle.chassis_number],
    ["Trim / series", vehicle.trim],
    ["Color", vehicle.color],
    ["Engine", vehicle.engine],
    ["Fuel type", vehicle.fuel_type],
    ["Transmission", vehicle.transmission],
    ["Drivetrain", vehicle.drivetrain],
    ["Body type", vehicle.body_type],
    ["Last visit", vehicle.last_visit_at ? new Date(vehicle.last_visit_at).toLocaleDateString() : null],
    ["License expiry", vehicle.license_expiry_at ? new Date(vehicle.license_expiry_at).toLocaleDateString() : null],
    ["Next service", vehicle.next_service_at ? new Date(vehicle.next_service_at).toLocaleDateString() : null],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {primaryFields.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-muted/50 p-3">
            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || "—"}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showMore ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        {showMore ? "Show less" : `Show ${detailFields.filter(([, v]) => v).length} more details`}
      </button>

      {showMore && (
        <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {detailFields.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1 text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {vehicle.notes && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-1 text-xs text-muted-foreground">Notes</p>
          <p className="text-sm">{vehicle.notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Condensed Edit Form ───────────────────────────

function VehicleEditForm({
  form,
  onChange,
}: {
  form: VehicleFormState;
  onChange: (updater: (prev: VehicleFormState) => VehicleFormState) => void;
}) {
  const [showMore, setShowMore] = useState(false);

  const setField = (field: keyof VehicleFormState, value: string) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  const Field = ({
    label,
    field,
    type = "text",
    className = "",
    placeholder,
    uppercase,
  }: {
    label: string;
    field: keyof VehicleFormState;
    type?: string;
    className?: string;
    placeholder?: string;
    uppercase?: boolean;
  }) => (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium" htmlFor={field}>
        {label}
      </label>
      <Input
        id={field}
        type={type}
        value={form[field]}
        onChange={(e) =>
          setField(field, uppercase ? e.target.value.toUpperCase() : e.target.value)
        }
        className="h-11"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plate number" field="plateNumber" className="sm:col-span-2" uppercase placeholder="ABC123" />
        <Field label="Make" field="make" />
        <Field label="Model" field="model" />
        <Field label="Year" field="year" type="number" />
        <Field label="VIN" field="vin" className="font-mono" placeholder="17-character VIN" />
        <Field label="Odometer (km)" field="odometer" type="number" />
      </div>

      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showMore ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        {showMore ? "Show less" : "Show more details"}
      </button>

      {showMore && (
        <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Field label="Chassis number" field="chassisNumber" />
          <Field label="Trim / series" field="trim" />
          <Field label="Color" field="color" />
          <Field label="Engine" field="engine" />
          <Field label="Fuel type" field="fuelType" placeholder="Gasoline, Diesel, Electric..." />
          <Field label="Transmission" field="transmission" placeholder="Manual, Automatic, CVT..." />
          <Field label="Drivetrain" field="drivetrain" placeholder="FWD, RWD, AWD..." />
          <Field label="Body type" field="bodyType" placeholder="Sedan, SUV, Pickup..." />
          <Field label="License expiry" field="licenseExpiryAt" type="date" />
          <Field label="Next service due" field="nextServiceAt" type="date" />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium" htmlFor="notes-edit">
              Notes
            </label>
            <textarea
              id="notes-edit"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
