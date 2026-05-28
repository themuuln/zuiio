"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Pencil,
  Phone,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPlateInput, inputProps } from "@/lib/form-ux";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { ColorSelect } from "@/components/vehicles/color-select";
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
import type { WorkOrderStatus } from "@/lib/types";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { vehicleKeys } from "@/lib/queries/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMNT } from "@/lib/utils";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { ContactCard } from "@/components/sidebar-tabs/contact-card";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
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

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function VehicleDetailPage() {
  const t = useTranslations("vehicles");
  const commonT = useTranslations("common");
  const params = useParams();
  const { push } = useRouter();
  const vehicleId = params.id as string;

  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const {
    data: vehicle,
    isLoading: loading,
    error: queryError,
    refetch,
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
    enabled: !!orgId && !!vehicleId,
    staleTime: 30_000,
  });

  const error = queryError ? queryError.message : null;

  const serviceHistoryColumns: ExportColumn<VehicleServiceHistoryItem>[] = [
    { key: "status", label: "Status" },
    { key: "created_at", label: "Date", format: "date" as const },
    { key: "complaint", label: "Complaint" },
    { key: "description", label: "Description" },
    { key: "total", label: "Total", format: "currency" as const },
  ];

  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
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

  const editMutation = useMutation({
    mutationFn: async (formData: VehicleFormState) => {
      const response = await fetch(
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
      const json = await response.json();
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
            license_expiry_at:
              formData.licenseExpiryAt || old.license_expiry_at,
            next_service_at: formData.nextServiceAt || old.next_service_at,
            notes: formData.notes || old.notes,
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
      const response = await fetch(
        `/api/organizations/${orgId}/vehicles/${vehicleId}`,
        { method: "DELETE" },
      );
      const json = await response.json();
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
      push("/dashboard/vehicles");
    },
  });

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

  if (orgQuery.isLoading || loading) {
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
          {commonT("back")}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Typography.Muted className="text-muted-foreground">
              {error}
            </Typography.Muted>
            <Button onClick={() => refetch()} variant="outline">
              {t("retry")}
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

  const { registerTab } = useRightSidebar();

  useEffect(() => {
    if (!vehicle) return;
    const owner =
      vehicle.owners.find((o) => o.is_primary) ?? vehicle.owners[0] ?? null;
    if (owner) {
      registerTab(
        "owner",
        "Owner",
        <ContactCard
          title="Owner Info"
          items={[
            { label: "Name", value: owner.name, copyable: true },
            { label: "Phone", value: owner.phone, icon: Phone, copyable: true },
          ]}
        />,
      );
    }
    const history = [...vehicle.service_history]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 3)
      .map((wo) => ({
        id: wo.id,
        primary: String(wo.status),
        secondary: formatMNT(Number(wo.total)),
        timestamp: formatDate(wo.created_at),
        href: `/dashboard/work-orders/${wo.id}`,
      }));
    if (history.length > 0) {
      registerTab(
        "history",
        "History",
        <RecentList
          title="Service History"
          items={history}
          emptyMessage="No service history"
        />,
      );
    }
  }, [vehicle, registerTab]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          render={<Link href="/dashboard/vehicles" />}
          variant="ghost"
          size="icon-xs"
          aria-label={commonT("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {vehicle.plate_number}
          </Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            {[vehicle.year, vehicle.make, vehicle.model]
              .filter(Boolean)
              .join(" ")}
          </Typography.Muted>
        </div>
        {!editing ? (
          <>
            <Button
              variant="outline"
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
          </>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={editMutation.isPending}>
              <Save className="size-4" />
              {editMutation.isPending ? t("saving") : commonT("save")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                syncForm(vehicle);
                setEditing(false);
              }}
            >
              <X className="size-4" />
              {commonT("cancel")}
            </Button>
          </div>
        )}
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

      {primaryOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("owner")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() =>
                push(`/dashboard/customers/${primaryOwner.customer_id}`)
              }
              variant="ghost"
              className="w-full justify-between rounded-lg bg-muted/50 px-3 py-3"
            >
              <div>
                <Typography.Text className="text-sm font-medium">
                  {primaryOwner.name}
                </Typography.Text>
                <Typography.Muted className="text-xs text-muted-foreground">
                  {primaryOwner.phone || t("noPhoneNumber")}
                </Typography.Muted>
              </div>
              <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("vehicleInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <VehicleEditForm form={form} onChange={setForm} />
          ) : (
            <VehicleReadView vehicle={vehicle} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("serviceDates")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <Typography.Muted className="mb-1 text-xs text-muted-foreground">
                {t("lastVisit")}
              </Typography.Muted>
              <Typography.Text className="text-sm font-medium">
                {formatDate(vehicle.last_visit_at)}
              </Typography.Text>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <Typography.Muted className="mb-1 text-xs text-muted-foreground">
                {t("nextService")}
              </Typography.Muted>
              <Typography.Text className="text-sm font-medium">
                {formatDate(vehicle.next_service_at)}
              </Typography.Text>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <Typography.Muted className="mb-1 text-xs text-muted-foreground">
                {t("licenseExpiry")}
              </Typography.Muted>
              <Typography.Text className="text-sm font-medium">
                {formatDate(vehicle.license_expiry_at)}
              </Typography.Text>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <Typography.Muted className="mb-1 text-xs text-muted-foreground">
                {t("created")}
              </Typography.Muted>
              <Typography.Text className="text-sm font-medium">
                {formatDate(vehicle.created_at)}
              </Typography.Text>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
              <Typography.Muted className="mb-1 text-xs text-muted-foreground">
                {t("notes")}
              </Typography.Muted>
              <Typography.Text className="whitespace-pre-wrap text-sm font-medium">
                {vehicle.notes || "—"}
              </Typography.Text>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t("serviceHistory")} ({vehicle.service_history.length})
          </CardTitle>
          <ExportButton
            data={vehicle.service_history}
            columns={serviceHistoryColumns}
            filename={`vehicle-${vehicle.id.slice(0, 8)}-history.xlsx`}
            sheetName="Service History"
          />
        </CardHeader>
        <CardContent>
          {vehicle.service_history.length === 0 ? (
            <Typography.Muted className="py-6 text-center text-sm text-muted-foreground">
              {t("noServiceHistory")}
            </Typography.Muted>
          ) : (
            <div className="flex flex-col gap-3">
              {vehicle.service_history.map((workOrder) => (
                <Button
                  key={workOrder.id}
                  onClick={() => push(`/dashboard/work-orders/${workOrder.id}`)}
                  variant="ghost"
                  className="w-full justify-start rounded-lg bg-muted/50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4 w-full">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={workOrder.status} />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(workOrder.created_at)}
                        </span>
                      </div>
                      <Typography.Text className="text-sm font-medium">
                        {workOrder.complaint ||
                          workOrder.description ||
                          t("generalService")}
                      </Typography.Text>
                      {workOrder.work_order_services.length > 0 && (
                        <Typography.Muted className="text-xs text-muted-foreground">
                          {workOrder.work_order_services
                            .flatMap((service) => {
                              const name = service.service_name || service.name;
                              return name ? [name] : [];
                            })
                            .join(", ")}
                        </Typography.Muted>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMNT(Number(workOrder.total))}
                      </span>
                      <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VehicleReadView({ vehicle }: { vehicle: VehicleDetailResponse }) {
  const t = useTranslations("vehicles");
  const [showMore, setShowMore] = useState(false);

  const primaryFields = [
    [t("plate"), vehicle.plate_number],
    [t("make"), vehicle.make],
    [t("model"), vehicle.model],
    [t("year"), vehicle.year ? String(vehicle.year) : null],
    [t("vin"), vehicle.vin],
    [
      t("odometer"),
      vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : null,
    ],
  ];

  const detailFields = [
    [t("chassisNumber"), vehicle.chassis_number],
    [t("trim"), vehicle.trim],
    [t("color"), vehicle.color],
    [t("engine"), vehicle.engine],
    [t("fuelType"), vehicle.fuel_type],
    [t("transmission"), vehicle.transmission],
    [t("drivetrain"), vehicle.drivetrain],
    [t("bodyType"), vehicle.body_type],
    [
      t("lastVisit"),
      vehicle.last_visit_at
        ? new Date(vehicle.last_visit_at).toLocaleDateString()
        : null,
    ],
    [
      t("licenseExpiry"),
      vehicle.license_expiry_at
        ? new Date(vehicle.license_expiry_at).toLocaleDateString()
        : null,
    ],
    [
      t("nextService"),
      vehicle.next_service_at
        ? new Date(vehicle.next_service_at).toLocaleDateString()
        : null,
    ],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {primaryFields.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-muted/50 p-3">
            <Typography.Muted className="mb-1 text-xs text-muted-foreground">
              {label}
            </Typography.Muted>
            <Typography.Text className="text-sm font-medium">
              {value || "—"}
            </Typography.Text>
          </div>
        ))}
      </div>

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

      {showMore && (
        <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {detailFields.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/50 p-3">
              <Typography.Muted className="mb-1 text-xs text-muted-foreground">
                {label}
              </Typography.Muted>
              <Typography.Text className="text-sm font-medium">
                {value || "—"}
              </Typography.Text>
            </div>
          ))}
        </div>
      )}

      {vehicle.notes && (
        <div className="rounded-lg bg-muted/50 p-3">
          <Typography.Muted className="mb-1 text-xs text-muted-foreground">
            {t("notes")}
          </Typography.Muted>
          <Typography.Text className="text-sm">{vehicle.notes}</Typography.Text>
        </div>
      )}
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
      <label className="mb-1 block text-sm font-medium" htmlFor={field}>
        {label}
      </label>
      <Input
        id={field}
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
        {showMore ? t("showLess") : t("showMore")}
      </Button>

      {showMore && (
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
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="color-edit"
            >
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
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="vehicle-fuel-edit"
            >
              {t("fuelType")}
            </label>
            <NativeSelect
              id="vehicle-fuel-edit"
              value={form.fuelType}
              onChange={(e) => setField("fuelType", e.target.value)}
              className="w-full"
              size="default"
            >
              <NativeSelectOption value="">Select fuel type</NativeSelectOption>
              <NativeSelectOption value="Gasoline">Gasoline</NativeSelectOption>
              <NativeSelectOption value="Diesel">Diesel</NativeSelectOption>
              <NativeSelectOption value="Electric">Electric</NativeSelectOption>
              <NativeSelectOption value="Hybrid">Hybrid</NativeSelectOption>
              <NativeSelectOption value="LPG">LPG</NativeSelectOption>
            </NativeSelect>
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="vehicle-transmission-edit"
            >
              {t("transmission")}
            </label>
            <NativeSelect
              id="vehicle-transmission-edit"
              value={form.transmission}
              onChange={(e) => setField("transmission", e.target.value)}
              className="w-full"
              size="default"
            >
              <NativeSelectOption value="">
                Select transmission
              </NativeSelectOption>
              <NativeSelectOption value="Automatic">
                Automatic
              </NativeSelectOption>
              <NativeSelectOption value="Manual">Manual</NativeSelectOption>
              <NativeSelectOption value="CVT">CVT</NativeSelectOption>
              <NativeSelectOption value="DCT">DCT</NativeSelectOption>
            </NativeSelect>
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="vehicle-drivetrain-edit"
            >
              {t("drivetrain")}
            </label>
            <NativeSelect
              id="vehicle-drivetrain-edit"
              value={form.drivetrain}
              onChange={(e) => setField("drivetrain", e.target.value)}
              className="w-full"
              size="default"
            >
              <NativeSelectOption value="">
                Select drivetrain
              </NativeSelectOption>
              <NativeSelectOption value="AWD">AWD</NativeSelectOption>
              <NativeSelectOption value="4WD">4WD</NativeSelectOption>
              <NativeSelectOption value="FWD">FWD</NativeSelectOption>
              <NativeSelectOption value="RWD">RWD</NativeSelectOption>
            </NativeSelect>
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="vehicle-body-edit"
            >
              {t("bodyType")}
            </label>
            <NativeSelect
              id="vehicle-body-edit"
              value={form.bodyType}
              onChange={(e) => setField("bodyType", e.target.value)}
              className="w-full"
              size="default"
            >
              <NativeSelectOption value="">Select body type</NativeSelectOption>
              <NativeSelectOption value="SUV">SUV</NativeSelectOption>
              <NativeSelectOption value="Sedan">Sedan</NativeSelectOption>
              <NativeSelectOption value="Hatchback">
                Hatchback
              </NativeSelectOption>
              <NativeSelectOption value="Coupe">Coupe</NativeSelectOption>
              <NativeSelectOption value="Convertible">
                Convertible
              </NativeSelectOption>
              <NativeSelectOption value="Wagon">Wagon</NativeSelectOption>
              <NativeSelectOption value="Van">Van</NativeSelectOption>
              <NativeSelectOption value="Truck">Truck</NativeSelectOption>
              <NativeSelectOption value="Bus">Bus</NativeSelectOption>
            </NativeSelect>
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
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="notes-edit"
            >
              {t("notes")}
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
