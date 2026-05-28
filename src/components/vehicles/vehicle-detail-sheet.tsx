"use client";

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatPlateInput, inputProps } from "@/lib/form-ux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { ColorSelect } from "@/components/vehicles/color-select";
import { StatusBadge } from "@/components/status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePageHeader } from "@/hooks/use-page-header";
import type { WorkOrderStatus } from "@/lib/types";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { vehicleKeys } from "@/lib/queries/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

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

function syncForm(v: VehicleDetailResponse): VehicleFormState {
  return {
    plateNumber: v.plate_number,
    vin: v.vin ?? "",
    chassisNumber: v.chassis_number ?? "",
    make: v.make,
    model: v.model,
    year: v.year ? String(v.year) : "",
    trim: v.trim ?? "",
    color: v.color ?? "",
    engine: v.engine ?? "",
    fuelType: v.fuel_type ?? "",
    transmission: v.transmission ?? "",
    drivetrain: v.drivetrain ?? "",
    bodyType: v.body_type ?? "",
    odometer: v.odometer ? String(v.odometer) : "",
    licenseExpiryAt: v.license_expiry_at?.slice(0, 10) ?? "",
    nextServiceAt: v.next_service_at?.slice(0, 10) ?? "",
    notes: v.notes ?? "",
  };
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

interface VehicleDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string | null;
}

export function VehicleDetailSheet({
  open,
  onOpenChange,
  vehicleId,
}: VehicleDetailSheetProps) {
  const t = useTranslations("vehicles");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const queryClient = useQueryClient();
  const { setDetailCustomerId } = usePageHeader();

  const {
    data: vehicle,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as VehicleDetailResponse;
    },
    enabled: !!orgId && !!vehicleId && open,
    staleTime: 30_000,
  });

  const error = queryError ? queryError.message : null;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<VehicleFormState>(emptyForm);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (vehicle && open) {
      setForm(syncForm(vehicle));
      setEditing(false);
      setShowMore(false);
    }
  }, [vehicle, open]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setEditing(false);
        setShowMore(false);
      }
      onOpenChange(value);
    },
    [onOpenChange],
  );

  const editMutation = useMutation({
    mutationFn: async (formData: VehicleFormState) => {
      const res = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plateNumber: formData.plateNumber.trim(),
            vin: formData.vin.trim() || null,
            chassisNumber: formData.chassisNumber.trim() || null,
            make: formData.make.trim(),
            model: formData.model.trim(),
            year: formData.year ? Number(formData.year) : null,
            trim: formData.trim.trim() || null,
            color: formData.color.trim() || null,
            engine: formData.engine.trim() || null,
            fuelType: formData.fuelType.trim() || null,
            transmission: formData.transmission.trim() || null,
            drivetrain: formData.drivetrain.trim() || null,
            bodyType: formData.bodyType.trim() || null,
            odometer: formData.odometer ? Number(formData.odometer) : null,
            licenseExpiryAt: formData.licenseExpiryAt || null,
            nextServiceAt: formData.nextServiceAt || null,
            notes: formData.notes.trim() || null,
          }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({
        queryKey: vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
      });
      const previous = queryClient.getQueryData<VehicleDetailResponse>(
        vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
      );
      queryClient.setQueryData<VehicleDetailResponse>(
        vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            plate_number: formData.plateNumber || old.plate_number,
            vin: formData.vin || old.vin,
            make: formData.make || old.make,
            model: formData.model || old.model,
            year: formData.year ? Number(formData.year) : old.year,
            color: formData.color || old.color,
            odometer: formData.odometer
              ? Number(formData.odometer)
              : old.odometer,
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
          context.previous,
        );
      }
      toast.error(t("failedToSave"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all(orgId ?? "") });
      setEditing(false);
      toast.success(t("vehicleUpdated"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSettled: () => {
      toast.success(t("deleted"));
      handleOpenChange(false);
    },
  });

  const handleSave = () => {
    if (!vehicleId) return;
    if (form.plateNumber.trim() && !isValidMongolianPlate(form.plateNumber)) {
      toast.error(
        t("plateInvalid", {
          fallback: "Must be 4 digits + 3 letters (e.g. 4444УНА)",
        }),
      );
      return;
    }
    editMutation.mutate(form);
  };

  const primaryOwner =
    vehicle?.owners?.find((o) => o.is_primary) ?? vehicle?.owners?.[0] ?? null;

  const isLoadingData = loading || (open && !vehicle && !error);
  const notFound = open && !loading && !vehicle && !error;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              {isLoadingData ? (
                <Loader2 className="size-5 animate-spin text-primary" />
              ) : (
                <Pencil className="size-5 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate">
                {isLoadingData
                  ? "Loading…"
                  : vehicle
                    ? vehicle.plate_number
                    : t("vehicleNotFound")}
              </SheetTitle>
              {vehicle && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {[vehicle.year, vehicle.make, vehicle.model]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </div>
              )}
            </div>
            {/* Actions in header */}
            {vehicle && !editing && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setForm(syncForm(vehicle));
                    setEditing(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive"
                      />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteConfirm")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        variant="destructive"
                      >
                        {commonT("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Loading */}
        {isLoadingData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error / Not found */}
        {(error || notFound) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <Typography.Muted className="text-sm">
              {error || "Vehicle not found"}
            </Typography.Muted>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>
          </div>
        )}

        {/* Content */}
        {!isLoadingData && !error && !notFound && vehicle && (
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {/* Owner */}
            {primaryOwner && (
              <div className="px-4 py-3 border-b border-border/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("owner")}
                </span>
                <button
                  className="mt-1.5 w-full flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 hover:bg-muted/70 transition-colors text-left"
                  onClick={() => {
                    handleOpenChange(false);
                    setDetailCustomerId(primaryOwner.customer_id);
                  }}
                >
                  <div>
                    <div className="text-sm font-medium">
                      {primaryOwner.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {primaryOwner.phone || t("noPhoneNumber")}
                    </div>
                  </div>
                  <Phone className="size-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Vehicle Info — Read-only */}
            {!editing && (
              <div className="px-4 py-3 border-b border-border/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("vehicleInformation")}
                </span>
                <div className="mt-2 grid gap-2 grid-cols-2">
                  {(
                    [
                      [t("plate"), vehicle.plate_number],
                      [t("make"), vehicle.make],
                      [t("model"), vehicle.model],
                      [t("year"), vehicle.year ? String(vehicle.year) : null],
                      [t("vin"), vehicle.vin],
                      [
                        t("odometer"),
                        vehicle.odometer
                          ? `${vehicle.odometer.toLocaleString()} km`
                          : null,
                      ],
                    ] as [string, string | null][]
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <div className="text-xs text-muted-foreground">
                        {label}
                      </div>
                      <div className="text-sm font-medium">{value || "—"}</div>
                    </div>
                  ))}
                </div>
                {/* Show more */}
                <button
                  className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                  {showMore ? t("showLess") : t("showMore")}
                </button>
                {showMore && (
                  <div className="mt-2 grid gap-2 grid-cols-2 animate-in fade-in duration-200">
                    {(
                      [
                        [t("chassisNumber"), vehicle.chassis_number],
                        [t("trim"), vehicle.trim],
                        [t("color"), vehicle.color],
                        [t("engine"), vehicle.engine],
                        [t("fuelType"), vehicle.fuel_type],
                        [t("transmission"), vehicle.transmission],
                        [t("drivetrain"), vehicle.drivetrain],
                        [t("bodyType"), vehicle.body_type],
                      ] as [string, string | null][]
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <div className="text-xs text-muted-foreground">
                          {label}
                        </div>
                        <div className="text-sm font-medium">
                          {value || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {vehicle.notes && (
                  <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
                    <div className="text-xs text-muted-foreground">
                      {t("notes")}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {vehicle.notes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit mode */}
            {editing && (
              <form
                id="vehicle-detail-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="px-4 py-3 border-b border-border/50"
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("vehicleInformation")}
                </span>
                <div className="mt-2">
                  <VehicleEditForm form={form} onChange={setForm} />
                </div>
              </form>
            )}

            {/* Service History */}
            <div className="px-4 py-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("serviceHistory")} ({vehicle.service_history.length})
              </span>
              {vehicle.service_history.length === 0 ? (
                <Typography.Muted className="mt-2 text-sm text-muted-foreground">
                  {t("noServiceHistory")}
                </Typography.Muted>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  {vehicle.service_history.map((wo) => (
                    <div
                      key={wo.id}
                      className="rounded-lg bg-muted/50 px-3 py-2.5 flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={wo.status} />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(wo.created_at)}
                          </span>
                        </div>
                        <div className="text-sm font-medium truncate">
                          {wo.complaint ||
                            wo.description ||
                            t("generalService")}
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">
                        {formatMNT(Number(wo.total))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — edit mode */}
            {editing && (
              <div className="shrink-0 border-t border-border p-4">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (vehicle) setForm(syncForm(vehicle));
                      setEditing(false);
                    }}
                  >
                    {commonT("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    form="vehicle-detail-form"
                    className="flex-1 gap-2"
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {editMutation.isPending ? t("saving") : commonT("save")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ── Edit Form (reused sub-component) ── */

function FormField({
  label,
  field,
  form,
  onFieldChange,
  type = "text",
  className = "",
  placeholder,
  uppercase,
}: {
  label: string;
  field: keyof VehicleFormState;
  form: VehicleFormState;
  onFieldChange: (field: keyof VehicleFormState, value: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  uppercase?: boolean;
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={`vds-${field}`}>{label}</FieldLabel>
      <Input
        id={`vds-${field}`}
        type={type}
        value={form[field]}
        onChange={(e) =>
          onFieldChange(
            field,
            uppercase ? e.target.value.toUpperCase() : e.target.value,
          )
        }
        placeholder={placeholder}
        {...inputProps(field)}
      />
    </Field>
  );
}

function VehicleEditForm({
  form,
  onChange,
}: {
  form: VehicleFormState;
  onChange: (updater: (prev: VehicleFormState) => VehicleFormState) => void;
}) {
  const t = useTranslations("vehicles");
  const [showMore, setShowMore] = useState(false);

  const setField = (field: keyof VehicleFormState, value: string) => {
    const processed =
      field === "plateNumber"
        ? formatPlateInput(transliterateMongolianPlate(value))
        : value;
    onChange((prev) => ({ ...prev, [field]: processed }));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 grid-cols-2">
        <FormField
          label={t("plate")}
          field="plateNumber"
          form={form}
          onFieldChange={setField}
          className="col-span-2"
          uppercase
          placeholder="ABC123"
        />
        <FormField
          label={t("make")}
          field="make"
          form={form}
          onFieldChange={setField}
          placeholder="Toyota"
        />
        <FormField
          label={t("model")}
          field="model"
          form={form}
          onFieldChange={setField}
          placeholder="Prius"
        />
        <FormField
          label={t("year")}
          field="year"
          form={form}
          onFieldChange={setField}
          type="number"
          placeholder="2020"
        />
        <FormField
          label={t("vin")}
          field="vin"
          form={form}
          onFieldChange={setField}
          placeholder="17-char VIN"
        />
      </div>

      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground self-start"
        onClick={() => setShowMore(!showMore)}
      >
        {showMore ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        {showMore ? t("showLess") : t("showMore")}
      </button>

      {showMore && (
        <div className="grid gap-3 grid-cols-2 animate-in fade-in duration-200">
          <FormField
            label={t("chassisNumber")}
            field="chassisNumber"
            form={form}
            onFieldChange={setField}
          />
          <FormField
            label={t("trim")}
            field="trim"
            form={form}
            onFieldChange={setField}
          />
          <div>
            <FieldLabel>{t("color")}</FieldLabel>
            <ColorSelect
              value={form.color}
              onChange={(color) => setField("color", color)}
              className="w-full mt-1"
            />
          </div>
          <FormField
            label={t("engine")}
            field="engine"
            form={form}
            onFieldChange={setField}
          />
          <div>
            <FieldLabel>{t("fuelType")}</FieldLabel>
            <Select
              value={form.fuelType || null}
              onValueChange={(val) => setField("fuelType", val ?? "")}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select" />
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
            <FieldLabel>{t("transmission")}</FieldLabel>
            <Select
              value={form.transmission || null}
              onValueChange={(val) => setField("transmission", val ?? "")}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select" />
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
            <FieldLabel>{t("drivetrain")}</FieldLabel>
            <Select
              value={form.drivetrain || null}
              onValueChange={(val) => setField("drivetrain", val ?? "")}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select" />
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
            <FieldLabel>{t("bodyType")}</FieldLabel>
            <Select
              value={form.bodyType || null}
              onValueChange={(val) => setField("bodyType", val ?? "")}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUV">SUV</SelectItem>
                <SelectItem value="Sedan">Sedan</SelectItem>
                <SelectItem value="Hatchback">Hatchback</SelectItem>
                <SelectItem value="Coupe">Coupe</SelectItem>
                <SelectItem value="Wagon">Wagon</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormField
            label={t("licenseExpiry")}
            field="licenseExpiryAt"
            form={form}
            onFieldChange={setField}
            type="date"
          />
          <FormField
            label={t("nextService")}
            field="nextServiceAt"
            form={form}
            onFieldChange={setField}
            type="date"
          />
          <Field className="col-span-2">
            <FieldLabel htmlFor="vds-notes">{t("notes")}</FieldLabel>
            <textarea
              id="vds-notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
