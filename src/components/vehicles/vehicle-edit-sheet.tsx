"use client";

import { ChevronDown, ChevronRight, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPlateInput, inputProps } from "@/lib/form-ux";
import {
  isValidMongolianPlate,
  transliterateMongolianPlate,
} from "@/lib/form-validation";
import { ColorSelect } from "@/components/vehicles/color-select";
import { vehicleKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/typography";

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

function syncFormFromVehicle(v: VehicleDetailResponse): VehicleFormState {
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

interface VehicleEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string | null;
}

export function VehicleEditSheet({
  open,
  onOpenChange,
  vehicleId,
}: VehicleEditSheetProps) {
  const t = useTranslations("vehicles");
  const commonT = useTranslations("common");
  const queryClient = useQueryClient();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;

  const { data: vehicle, isLoading: loading } = useQuery({
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

  const [form, setForm] = useState<VehicleFormState>(emptyForm);

  useEffect(() => {
    if (vehicle) {
      setForm(syncFormFromVehicle(vehicle));
    }
  }, [vehicle]);

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
      if (!vehicleId) return;
      await queryClient.cancelQueries({
        queryKey: vehicleKeys.detail(orgId ?? "", vehicleId),
      });
      const previous = queryClient.getQueryData<VehicleDetailResponse>(
        vehicleKeys.detail(orgId ?? "", vehicleId),
      );
      queryClient.setQueryData<VehicleDetailResponse>(
        vehicleKeys.detail(orgId ?? "", vehicleId),
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
      if (vehicleId && context?.previous) {
        queryClient.setQueryData(
          vehicleKeys.detail(orgId ?? "", vehicleId),
          context.previous,
        );
      }
      toast.error(t("failedToSave"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all(orgId ?? "") });
      onOpenChange(false);
      toast.success(t("vehicleUpdated"));
    },
  });

  const handleSave = useCallback(() => {
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
  }, [orgId, vehicleId, form, editMutation, t]);

  const setField = useCallback(
    (field: keyof VehicleFormState, value: string) => {
      const processed =
        field === "plateNumber"
          ? formatPlateInput(transliterateMongolianPlate(value))
          : value;
      setForm((prev) => ({ ...prev, [field]: processed }));
    },
    [],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            {vehicle ? vehicle.plate_number : t("editVehicle")}
          </SheetTitle>
          <SheetDescription>
            {vehicle
              ? [vehicle.year, vehicle.make, vehicle.model]
                  .filter(Boolean)
                  .join(" ")
              : ""}
          </SheetDescription>
        </SheetHeader>

        {loading || !vehicle ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-1/2" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <VehicleEditForm form={form} setField={setField} />
            </ScrollArea>
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={editMutation.isPending}
              >
                <X className="size-4" />
                {commonT("cancel")}
              </Button>
              <Button onClick={handleSave} disabled={editMutation.isPending}>
                <Save className="size-4" />
                {editMutation.isPending ? t("saving") : commonT("save")}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function VehicleEditForm({
  form,
  setField,
}: {
  form: VehicleFormState;
  setField: (field: keyof VehicleFormState, value: string) => void;
}) {
  const t = useTranslations("vehicles");
  const [showMore, setShowMore] = useState(false);

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
              htmlFor="color-sheet"
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
              htmlFor="fuel-sheet"
            >
              {t("fuelType")}
            </label>
            <Select
              id="fuel-sheet"
              value={form.fuelType || null}
              onValueChange={(val) => setField("fuelType", val ?? "")}
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
              htmlFor="trans-sheet"
            >
              {t("transmission")}
            </label>
            <Select
              id="trans-sheet"
              value={form.transmission || null}
              onValueChange={(val) => setField("transmission", val ?? "")}
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
              htmlFor="drive-sheet"
            >
              {t("drivetrain")}
            </label>
            <Select
              id="drive-sheet"
              value={form.drivetrain || null}
              onValueChange={(val) => setField("drivetrain", val ?? "")}
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
              htmlFor="body-sheet"
            >
              {t("bodyType")}
            </label>
            <Select
              id="body-sheet"
              value={form.bodyType || null}
              onValueChange={(val) => setField("bodyType", val ?? "")}
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
              htmlFor="notes-sheet"
            >
              {t("notes")}
            </label>
            <textarea
              id="notes-sheet"
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
