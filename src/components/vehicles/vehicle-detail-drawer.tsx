"use client";

import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Pencil,
  Phone,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { ColorSelect } from "@/components/vehicles/color-select";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { vehicleKeys } from "@/lib/queries/keys";
import { formatMNT } from "@/lib/utils";
import { formatPlateInput, inputProps } from "@/lib/form-ux";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import type { WorkOrderStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface VehicleOwner {
  customer_id: string;
  name: string;
  phone: string | null;
  is_primary: boolean;
}

interface ServiceLine {
  id: string;
  service_name: string | null;
  name: string | null;
  quantity: number;
  final_price: number;
}

interface ServiceHistoryItem {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  complaint: string | null;
  total: number;
  created_at: string;
  work_order_services: ServiceLine[];
}

interface VehicleDetail {
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
  owners: VehicleOwner[];
  service_history: ServiceHistoryItem[];
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function DetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <Typography.Muted className="mb-1 text-xs text-muted-foreground">
        {label}
      </Typography.Muted>
      <Typography.Text className="text-sm font-medium">
        {value || "—"}
      </Typography.Text>
    </div>
  );
}

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
    <div className={className}>
      <label className="mb-1 block text-sm font-medium" htmlFor={`drawer-${field}`}>
        {label}
      </label>
      <Input
        id={`drawer-${field}`}
        type={type}
        value={form[field]}
        onChange={(e) =>
          onFieldChange(
            field,
            uppercase ? e.target.value.toUpperCase() : e.target.value,
          )
        }
        className="h-11"
        placeholder={placeholder}
        {...inputProps(field)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface VehicleDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function VehicleDetailDrawer({
  open,
  onOpenChange,
  vehicleId,
}: VehicleDetailDrawerProps) {
  const t = useTranslations("vehicles");
  const commonT = useTranslations("common");
  const queryClient = useQueryClient();
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<VehicleFormState>(emptyForm);
  const [showMore, setShowMore] = useState(false);
  const [editShowMore, setEditShowMore] = useState(false);

  const {
    data: vehicle,
    isLoading,
    error,
  } = useQuery({
    queryKey: vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as VehicleDetail;
    },
    enabled: !!orgId && !!vehicleId && open,
    staleTime: 30_000,
  });

  /* ── Form sync ── */
  const syncForm = useCallback((v: VehicleDetail) => {
    setForm({
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
    });
  }, []);

  /* ── Edit mutation ── */
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
      const previous = queryClient.getQueryData<VehicleDetail>(
        vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
      );
      queryClient.setQueryData<VehicleDetail>(
        vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            plate_number: formData.plateNumber || old.plate_number,
            vin: formData.vin || old.vin,
            chassis_number: formData.chassisNumber || old.chassis_number,
            make: formData.make || old.make,
            model: formData.model || old.model,
            year: formData.year ? Number(formData.year) : old.year,
            trim: formData.trim || old.trim,
            color: formData.color || old.color,
            engine: formData.engine || old.engine,
            fuel_type: formData.fuelType || old.fuel_type,
            transmission: formData.transmission || old.transmission,
            drivetrain: formData.drivetrain || old.drivetrain,
            body_type: formData.bodyType || old.body_type,
            odometer: formData.odometer
              ? Number(formData.odometer)
              : old.odometer,
            license_expiry_at: formData.licenseExpiryAt || old.license_expiry_at,
            next_service_at: formData.nextServiceAt || old.next_service_at,
            notes: formData.notes || old.notes,
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(
          vehicleKeys.detail(orgId ?? "", vehicleId ?? ""),
          ctx.previous,
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

  /* ── Delete mutation ── */
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
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: vehicleKeys.all(orgId ?? ""),
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all(orgId ?? "") });
      toast.error(t("failedToSave"));
    },
    onSettled: () => {
      toast.success(t("deleted"));
      onOpenChange(false);
    },
  });

  /* ── Actions ── */
  const handleSave = () => {
    if (!orgId || !vehicleId) return;
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

  const handleDelete = () => {
    if (!orgId || !vehicleId) return;
    deleteMutation.mutate();
  };

  const setField = (field: keyof VehicleFormState, value: string) => {
    const processed =
      field === "plateNumber"
        ? formatPlateInput(transliterateMongolianPlate(value))
        : value;
    setForm((prev) => ({ ...prev, [field]: processed }));
  };

  /* ── Reset state on close ── */
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEditing(false);
      setShowMore(false);
      setEditShowMore(false);
    }
    onOpenChange(nextOpen);
  };

  const primaryOwner =
    vehicle?.owners.find((o) => o.is_primary) ?? vehicle?.owners[0] ?? null;

  /* ── Read-only field lists ── */
  const primaryFields: [string, string | null][] = vehicle
    ? [
        [t("plate"), vehicle.plate_number],
        [t("make"), vehicle.make],
        [t("model"), vehicle.model],
        [t("year"), vehicle.year ? String(vehicle.year) : null],
        [t("vin"), vehicle.vin],
        [
          t("odometer"),
          vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : null,
        ],
      ]
    : [];

  const detailFields: [string, string | null][] = vehicle
    ? [
        [t("chassisNumber"), vehicle.chassis_number],
        [t("trim"), vehicle.trim],
        [t("color"), vehicle.color],
        [t("engine"), vehicle.engine],
        [t("fuelType"), vehicle.fuel_type],
        [t("transmission"), vehicle.transmission],
        [t("drivetrain"), vehicle.drivetrain],
        [t("bodyType"), vehicle.body_type],
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl"
        showCloseButton
      >
        {/* ── Header ── */}
        <SheetHeader className="px-4 pt-4">
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : vehicle ? (
            <>
              <SheetTitle className="flex items-center gap-2">
                <span className="font-mono text-lg tracking-wide">
                  {vehicle.plate_number}
                </span>
              </SheetTitle>
              <SheetDescription>
                {[vehicle.year, vehicle.make, vehicle.model]
                  .filter(Boolean)
                  .join(" ")}
              </SheetDescription>
            </>
          ) : (
            <SheetTitle>{t("title")}</SheetTitle>
          )}
        </SheetHeader>

        {/* ── Body ── */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-4">
            {isLoading && (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <Typography.Text className="text-sm text-destructive">
                    {(error as Error).message}
                  </Typography.Text>
                </CardContent>
              </Card>
            )}

            {vehicle && !editing && (
              <>
                {/* ── Action bar ── */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      syncForm(vehicle);
                      setEditing(true);
                    }}
                  >
                    <Pencil className="size-4" />
                    {commonT("edit")}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        />
                      }
                    >
                      <Trash2 className="size-4" />
                      {commonT("delete")}
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
                          onClick={handleDelete}
                          variant="destructive"
                        >
                          {commonT("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* ── Vehicle Info (read-only) ── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("vehicleInformation")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {primaryFields.map(([label, value]) => (
                          <DetailField key={label} label={label} value={value} />
                        ))}
                      </div>
                      {detailFields.filter(([, v]) => v).length > 0 && (
                        <Button
                          onClick={() => setShowMore(!showMore)}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                        >
                          {showMore ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                          {showMore
                            ? t("showLess")
                            : t("showMoreDetails", {
                                count: detailFields.filter(([, v]) => v).length,
                              })}
                        </Button>
                      )}
                      {showMore && (
                        <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          {detailFields.map(([label, value]) => (
                            <DetailField
                              key={label}
                              label={label}
                              value={value}
                            />
                          ))}
                        </div>
                      )}
                      {vehicle.notes && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <Typography.Muted className="mb-1 text-xs text-muted-foreground">
                            {t("notes")}
                          </Typography.Muted>
                          <Typography.Text className="whitespace-pre-wrap text-sm">
                            {vehicle.notes}
                          </Typography.Text>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ── Owner ── */}
                {primaryOwner && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("owner")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-3">
                        <div>
                          <Typography.Text className="text-sm font-medium">
                            {primaryOwner.name}
                          </Typography.Text>
                          <Typography.Muted className="text-xs text-muted-foreground">
                            {primaryOwner.phone || t("noPhoneNumber")}
                          </Typography.Muted>
                        </div>
                        {primaryOwner.phone && (
                          <a
                            href={`tel:${primaryOwner.phone}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="size-4" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Service Dates ── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("serviceDates")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailField
                        label={t("lastVisit")}
                        value={vehicle.last_visit_at}
                      />
                      <DetailField
                        label={t("nextService")}
                        value={vehicle.next_service_at}
                      />
                      <DetailField
                        label={t("licenseExpiry")}
                        value={vehicle.license_expiry_at}
                      />
                      <DetailField
                        label={t("created")}
                        value={vehicle.created_at}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ── Service History ── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("serviceHistory")} ({vehicle.service_history.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehicle.service_history.length === 0 ? (
                      <Typography.Muted className="py-6 text-center text-sm text-muted-foreground">
                        {t("noServiceHistory")}
                      </Typography.Muted>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {vehicle.service_history.map((wo) => (
                          <div
                            key={wo.id}
                            className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-3">
                                <StatusBadge status={wo.status} />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(wo.created_at)}
                                </span>
                              </div>
                              <Typography.Text className="text-sm font-medium">
                                {wo.complaint ||
                                  wo.description ||
                                  t("generalService")}
                              </Typography.Text>
                              {wo.work_order_services.length > 0 && (
                                <Typography.Muted className="text-xs text-muted-foreground">
                                  {wo.work_order_services
                                    .flatMap((s) => {
                                      const name = s.service_name || s.name;
                                      return name ? [name] : [];
                                    })
                                    .join(", ")}
                                </Typography.Muted>
                              )}
                            </div>
                            <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                              {formatMNT(Number(wo.total))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── Edit mode ── */}
            {vehicle && editing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("vehicleInformation")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        label={t("plate")}
                        field="plateNumber"
                        form={form}
                        onFieldChange={setField}
                        className="sm:col-span-2"
                        uppercase
                        placeholder="ABC123"
                      />
                      <FormField
                        label={t("make")}
                        field="make"
                        form={form}
                        onFieldChange={setField}
                        placeholder="e.g. Toyota"
                      />
                      <FormField
                        label={t("model")}
                        field="model"
                        form={form}
                        onFieldChange={setField}
                        placeholder="e.g. Prius"
                      />
                      <FormField
                        label={t("year")}
                        field="year"
                        form={form}
                        onFieldChange={setField}
                        type="number"
                        placeholder="e.g. 2020"
                      />
                      <FormField
                        label={t("vin")}
                        field="vin"
                        form={form}
                        onFieldChange={setField}
                        className="font-mono"
                        placeholder="17-character VIN"
                      />
                      <FormField
                        label={t("odometer")}
                        field="odometer"
                        form={form}
                        onFieldChange={setField}
                        type="number"
                        placeholder="e.g. 120000"
                      />
                    </div>

                    <Button
                      onClick={() => setEditShowMore(!editShowMore)}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      {editShowMore ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                      {editShowMore ? t("showLess") : t("showMore")}
                    </Button>

                    {editShowMore && (
                      <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <FormField
                          label={t("chassisNumber")}
                          field="chassisNumber"
                          form={form}
                          onFieldChange={setField}
                          placeholder="e.g. NCP20-0123456"
                        />
                        <FormField
                          label={t("trim")}
                          field="trim"
                          form={form}
                          onFieldChange={setField}
                          placeholder="e.g. G Touring"
                        />
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            {t("color")}
                          </label>
                          <ColorSelect
                            value={form.color}
                            onChange={(color) => setField("color", color)}
                            className="w-full"
                          />
                        </div>
                        <FormField
                          label={t("engine")}
                          field="engine"
                          form={form}
                          onFieldChange={setField}
                          placeholder="e.g. 2ZR-FE, 1NZ-FE"
                        />
                        <div>
                          <label className="mb-1 block text-sm font-medium">
                            {t("fuelType")}
                          </label>
                          <Select
                            value={form.fuelType || null}
                            onValueChange={(val) =>
                              setField("fuelType", val ?? "")
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
                          <label className="mb-1 block text-sm font-medium">
                            {t("transmission")}
                          </label>
                          <Select
                            value={form.transmission || null}
                            onValueChange={(val) =>
                              setField("transmission", val ?? "")
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
                          <label className="mb-1 block text-sm font-medium">
                            {t("drivetrain")}
                          </label>
                          <Select
                            value={form.drivetrain || null}
                            onValueChange={(val) =>
                              setField("drivetrain", val ?? "")
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
                          <label className="mb-1 block text-sm font-medium">
                            {t("bodyType")}
                          </label>
                          <Select
                            value={form.bodyType || null}
                            onValueChange={(val) =>
                              setField("bodyType", val ?? "")
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
                              <SelectItem value="Convertible">
                                Convertible
                              </SelectItem>
                              <SelectItem value="Wagon">Wagon</SelectItem>
                              <SelectItem value="Van">Van</SelectItem>
                              <SelectItem value="Truck">Truck</SelectItem>
                              <SelectItem value="Bus">Bus</SelectItem>
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
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-medium">
                            {t("notes")}
                          </label>
                          <textarea
                            value={form.notes}
                            onChange={(e) => setField("notes", e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        {vehicle && (
          <div className="sticky bottom-0 border-t bg-background p-4">
            {editing ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="min-h-[48px] flex-1"
                  onClick={() => {
                    syncForm(vehicle);
                    setEditing(false);
                  }}
                >
                  <X className="size-4" />
                  {commonT("cancel")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={editMutation.isPending}
                  className="min-h-[48px] flex-1"
                >
                  <Save className="size-4" />
                  {editMutation.isPending
                    ? t("saving")
                    : commonT("save")}
                </Button>
              </div>
            ) : (
              <Button
                render={<a href={`/dashboard/vehicles/${vehicle.id}`} />}
                variant="outline"
                className="w-full gap-2"
              >
                <ExternalLink className="size-4" />
                {t("viewFullDetails", { fallback: "View full details" })}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
