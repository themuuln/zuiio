"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
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
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { NumericInput } from "@/components/ui/numeric-input";
import { PlateInput } from "@/components/ui/plate-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { ColorSelect } from "@/components/vehicles/color-select";
import { usePageHeader } from "@/hooks/use-page-header";
import { inputProps } from "@/lib/form-ux";
import { isValidMongolianPlate } from "@/lib/form-validation";
import { vehicleKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { WorkOrderStatus } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

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

interface VehiclePartLine {
  id: string;
  part_name: string | null;
  part_number: string | null;
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
  work_order_parts: VehiclePartLine[];
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
  steering: string | null;
  seats: number | null;
  height: number | null;
  width: number | null;
  length: number | null;
  weight: number | null;
  import_date: string | null;
  country_of_origin: string | null;
  category: string | null;
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
  steering: string;
  seats: string;
  height: string;
  width: string;
  length: string;
  weight: string;
  importDate: string;
  countryOfOrigin: string;
  category: string;
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
  steering: "",
  seats: "",
  height: "",
  width: "",
  length: "",
  weight: "",
  importDate: "",
  countryOfOrigin: "",
  category: "",
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
    steering: v.steering ?? "",
    seats: v.seats ? String(v.seats) : "",
    height: v.height ? String(v.height) : "",
    width: v.width ? String(v.width) : "",
    length: v.length ? String(v.length) : "",
    weight: v.weight ? String(v.weight) : "",
    importDate: v.import_date?.slice(0, 10) ?? "",
    countryOfOrigin: v.country_of_origin ?? "",
    category: v.category ?? "",
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

export function VehicleDetailDrawer({
  open,
  onOpenChange,
  vehicleId,
}: VehicleDetailSheetProps) {
  const t = useTranslations("vehicles") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const commonT = useTranslations("common") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
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

  const editMutation = useOrgMutation({
    endpoint: `/api/organizations/${orgId}/vehicles/${vehicleId}`,
    method: "PATCH",
    queryKey: vehicleKeys.all(orgId ?? ""),
    successMessage: t("vehicleUpdated"),
    bodyFn: (formData: VehicleFormState) => ({
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
      steering: formData.steering.trim() || null,
      seats: formData.seats ? Number(formData.seats) : null,
      height: formData.height ? Number(formData.height) : null,
      width: formData.width ? Number(formData.width) : null,
      length: formData.length ? Number(formData.length) : null,
      weight: formData.weight ? Number(formData.weight) : null,
      importDate: formData.importDate || null,
      countryOfOrigin: formData.countryOfOrigin.trim() || null,
      category: formData.category.trim() || null,
    }),
    onSuccess: (_data, formData: VehicleFormState) => {
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
            steering: formData.steering || old.steering,
            seats: formData.seats ? Number(formData.seats) : old.seats,
            height: formData.height ? Number(formData.height) : old.height,
            width: formData.width ? Number(formData.width) : old.width,
            length: formData.length ? Number(formData.length) : old.length,
            weight: formData.weight ? Number(formData.weight) : old.weight,
            import_date: formData.importDate || old.import_date,
            country_of_origin:
              formData.countryOfOrigin || old.country_of_origin,
            category: formData.category || old.category,
          };
        },
      );
      setEditing(false);
    },
  });

  const deleteMutation = useOrgMutation<unknown, void>({
    endpoint: `/api/organizations/${orgId}/vehicles/${vehicleId}`,
    method: "DELETE",
    queryKey: vehicleKeys.all(orgId ?? ""),
    successMessage: t("deleted"),
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
    <DetailDrawer open={open} onOpenChange={handleOpenChange}>
      <DrawerHeader className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            {isLoadingData ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <Pencil className="size-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <DrawerTitle className="text-base truncate">
              {isLoadingData
                ? t("loading")
                : vehicle
                  ? vehicle.plate_number
                  : t("vehicleNotFound")}
            </DrawerTitle>
            {vehicle && (
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {[vehicle.year, vehicle.make, vehicle.model]
                    .filter(Boolean)
                    .join(" ")}
                </span>
              </div>
            )}
          </div>
          {vehicle && !editing && (
            <div className="flex shrink-0 items-center gap-1">
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
      </DrawerHeader>

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
            {error || t("vehicleNotFound")}
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
        <>
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {/* Owner */}
            {primaryOwner && (
              <div className="px-4 py-3 border-b border-border/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("owner")}
                </span>
                <button
                  type="button"
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
                  type="button"
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
                        [t("steering"), vehicle.steering],
                        [
                          t("seats"),
                          vehicle.seats ? String(vehicle.seats) : null,
                        ],
                        [
                          t("height"),
                          vehicle.height ? `${vehicle.height} mm` : null,
                        ],
                        [
                          t("width"),
                          vehicle.width ? `${vehicle.width} mm` : null,
                        ],
                        [
                          t("length"),
                          vehicle.length ? `${vehicle.length} mm` : null,
                        ],
                        [
                          t("weight"),
                          vehicle.weight ? `${vehicle.weight} kg` : null,
                        ],
                        [
                          t("importDate"),
                          vehicle.import_date
                            ? new Date(vehicle.import_date).toLocaleDateString()
                            : null,
                        ],
                        [t("countryOfOrigin"), vehicle.country_of_origin],
                        [t("category"), vehicle.category],
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
                    <Item
                      key={wo.id}
                      variant="muted"
                      className="justify-between py-2.5"
                    >
                      <ItemContent className="gap-0.5">
                        <ItemTitle>
                          <StatusBadge status={wo.status} />
                          <span className="text-xs text-muted-foreground font-normal">
                            {formatDate(wo.created_at)}
                          </span>
                        </ItemTitle>
                        <ItemDescription>
                          {wo.complaint ||
                            wo.description ||
                            t("generalService")}
                        </ItemDescription>
                        {wo.work_order_parts &&
                          wo.work_order_parts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {wo.work_order_parts.map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-info/10 px-1.5 py-0.5 text-xs text-info border border-info/30"
                                >
                                  🔧 {p.part_name}
                                  {p.quantity > 1 ? ` ×${p.quantity}` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                      </ItemContent>
                      <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">
                        {formatMNT(Number(wo.total))}
                      </span>
                    </Item>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer — fixed bottom, outside scrollable body */}
          {editing && (
            <DetailDrawer.Footer>
              <DetailDrawer.FooterActions>
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
                  size="lg"
                  disabled={editMutation.isPending}
                >
                  {editMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {editMutation.isPending ? t("saving") : commonT("save")}
                </Button>
              </DetailDrawer.FooterActions>
            </DetailDrawer.Footer>
          )}
        </>
      )}
    </DetailDrawer>
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
  step,
}: {
  label: string;
  field: keyof VehicleFormState;
  form: VehicleFormState;
  onFieldChange: (field: keyof VehicleFormState, value: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  uppercase?: boolean;
  step?: number;
}) {
  if (type === "number") {
    return (
      <Field className={className}>
        <FieldLabel htmlFor={`vds-${field}`}>{label}</FieldLabel>
        <NumericInput
          id={`vds-${field}`}
          value={Number(form[field]) || 0}
          onChange={(v) => onFieldChange(field, v ? String(v) : "")}
          placeholder={placeholder}
          step={step ?? 1}
        />
      </Field>
    );
  }
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
  const t = useTranslations("vehicles") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [showMore, setShowMore] = useState(false);

  const setField = (field: keyof VehicleFormState, value: string) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 grid-cols-2">
        <Field className="col-span-2 relative">
          <FieldLabel htmlFor="vds-plateNumber">{t("plate")}</FieldLabel>
          <PlateInput
            id="vds-plateNumber"
            value={form.plateNumber}
            onChange={(v) => onChange((p) => ({ ...p, plateNumber: v }))}
            placeholder={t("platePlaceholderEdit")}
            {...inputProps("plate")}
          />
        </Field>
        <FormField
          label={t("make")}
          field="make"
          form={form}
          onFieldChange={setField}
          placeholder={t("brandPlaceholder")}
        />
        <FormField
          label={t("model")}
          field="model"
          form={form}
          onFieldChange={setField}
          placeholder={t("modelPlaceholder")}
        />
        <FormField
          label={t("year")}
          field="year"
          form={form}
          onFieldChange={setField}
          type="number"
          placeholder="2020"
          step={1}
        />
        <FormField
          label={t("vin")}
          field="vin"
          form={form}
          onFieldChange={setField}
          placeholder={t("vinPlaceholderEdit")}
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
                <SelectValue placeholder={t("selectFuelType")} />
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
                <SelectValue placeholder={t("selectTransmission")} />
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
                <SelectValue placeholder={t("selectDrivetrain")} />
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
                <SelectValue placeholder={t("selectBodyType")} />
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
          <FormField
            label={t("steering")}
            field="steering"
            form={form}
            onFieldChange={setField}
            placeholder={t("steeringPlaceholder")}
          />
          <FormField
            label={t("seats")}
            field="seats"
            form={form}
            onFieldChange={setField}
            type="number"
            placeholder={t("seatsPlaceholderEdit")}
            step={1}
          />
          <FormField
            label={t("height")}
            field="height"
            form={form}
            onFieldChange={setField}
            type="number"
            placeholder={t("heightPlaceholder")}
            step={0.1}
          />
          <FormField
            label={t("width")}
            field="width"
            form={form}
            onFieldChange={setField}
            type="number"
            placeholder={t("widthPlaceholder")}
            step={0.1}
          />
          <FormField
            label={t("length")}
            field="length"
            form={form}
            onFieldChange={setField}
            type="number"
            placeholder={t("lengthPlaceholder")}
            step={0.1}
          />
          <FormField
            label={t("weight")}
            field="weight"
            form={form}
            onFieldChange={setField}
            type="number"
            placeholder={t("weightPlaceholder")}
            step={0.1}
          />
          <FormField
            label={t("importDate")}
            field="importDate"
            form={form}
            onFieldChange={setField}
            type="date"
          />
          <FormField
            label={t("countryOfOrigin")}
            field="countryOfOrigin"
            form={form}
            onFieldChange={setField}
            placeholder={t("countryPlaceholder")}
          />
          <FormField
            label={t("category")}
            field="category"
            form={form}
            onFieldChange={setField}
            placeholder={t("categoryPlaceholder")}
          />
          <Field className="col-span-2">
            <FieldLabel htmlFor="vds-notes">{t("notes")}</FieldLabel>
            <textarea
              id="vds-notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
