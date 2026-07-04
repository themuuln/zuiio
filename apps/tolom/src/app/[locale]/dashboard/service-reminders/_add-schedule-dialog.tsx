"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate_number: string;
}

interface AddScheduleDialogProps {
  vehicles: Vehicle[];
  isPending: boolean;
  onAdd: (data: {
    vehicle_id?: string;
    service_catalog_id?: string;
    service_name: string;
    interval_months?: number | null;
    interval_km?: number | null;
    last_service_date?: string | null;
    last_service_odometer?: number | null;
    next_due_date?: string | null;
    next_due_km?: number | null;
    notes?: string;
  }) => Promise<void>;
}

export function AddScheduleDialog({
  vehicles,
  isPending,
  onAdd,
}: AddScheduleDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: "",
    service_catalog_id: "",
    service_name: "",
    interval_months: 0,
    interval_km: 0,
    last_service_date: "",
    last_service_odometer: "",
    next_due_date: "",
    notes: "",
  });

  const handleAdd = async () => {
    if (!form.service_name.trim()) {
      toast.error(t("serviceReminders.serviceNameRequired"));
      return;
    }

    if (!form.vehicle_id) {
      toast.error(t("serviceReminders.searchVehicle"));
      return;
    }
    if (form.interval_months <= 0 && form.interval_km <= 0) {
      toast.error(t("serviceReminders.intervalRequired"));
      return;
    }

    try {
      await onAdd({
        vehicle_id: form.vehicle_id || undefined,
        service_catalog_id: form.service_catalog_id || undefined,
        service_name: form.service_name.trim(),
        interval_months: form.interval_months > 0 ? form.interval_months : null,
        interval_km: form.interval_km > 0 ? form.interval_km : null,
        last_service_date: form.last_service_date || undefined,
        last_service_odometer: form.last_service_odometer
          ? Number.parseInt(form.last_service_odometer, 10)
          : undefined,
        next_due_date: form.next_due_date || undefined,
        next_due_km: null,
        notes: form.notes || undefined,
      });

      setOpen(false);
      setForm({
        vehicle_id: "",
        service_catalog_id: "",
        service_name: "",
        interval_months: 0,
        interval_km: 0,
        last_service_date: "",
        last_service_odometer: "",
        next_due_date: "",
        notes: "",
      });
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("serviceReminders.failedToCreate"),
      );
    }
  };

  const formatDatePickerValue = (dateStr: string) =>
    dateStr ? new Date(dateStr) : undefined;

  const handleDateChange =
    (field: "last_service_date" | "next_due_date") => (d: Date | undefined) => {
      if (d) {
        const year = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, "0");
        const dayStr = String(d.getDate()).padStart(2, "0");
        setForm((p) => ({ ...p, [field]: `${year}-${monthStr}-${dayStr}` }));
      } else {
        setForm((p) => ({ ...p, [field]: "" }));
      }
    };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        {t("serviceReminders.addSchedule")}
      </Button>
      <DetailDrawer open={open} onOpenChange={setOpen} size="lg">
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {t("serviceReminders.addNewSchedule")}
          </DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicle_id">
                {t("serviceReminders.vehicle")}
              </Label>
              <Combobox
                items={vehicles}
                value={vehicles.find((v) => v.id === form.vehicle_id) ?? null}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, vehicle_id: v?.id ?? "" }));
                }}
                isItemEqualToValue={(a, b) => a?.id === b?.id}
                itemToStringLabel={(v) =>
                  v ? `${v.make} ${v.model} (${v.plate_number})` : ""
                }
              >
                <ComboboxInput
                  placeholder={t("serviceReminders.searchVehicle")}
                  showTrigger
                  showClear={!!form.vehicle_id}
                  className="h-9 text-xs"
                />
                <ComboboxContent>
                  <ComboboxList>
                    {(v) => (
                      <ComboboxItem key={v.id} value={v} className="text-xs">
                        <span>
                          {v.make} {v.model}
                        </span>
                        <span className="ml-2 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {v.plate_number}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxEmpty className="text-xs">
                    {t("serviceReminders.noVehicles")}
                  </ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service_name">
                {t("serviceReminders.serviceName")}
              </Label>
              <Input
                id="service_name"
                value={form.service_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, service_name: e.target.value }))
                }
                placeholder={t("serviceReminders.serviceNamePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interval_months">
                  {t("serviceReminders.intervalMonths")}
                </Label>
                <NumericInput
                  id="interval_months"
                  value={form.interval_months}
                  onChange={(val) =>
                    setForm((p) => ({ ...p, interval_months: val }))
                  }
                  placeholder="6"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interval_km">
                  {t("serviceReminders.intervalKm")}
                </Label>
                <NumericInput
                  id="interval_km"
                  value={form.interval_km}
                  onChange={(val) =>
                    setForm((p) => ({ ...p, interval_km: val }))
                  }
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="last_service_date">
                  {t("serviceReminders.lastServiceDate")}
                </Label>
                <DatePicker
                  value={formatDatePickerValue(form.last_service_date)}
                  onChange={handleDateChange("last_service_date")}
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="next_due_date">
                  {t("serviceReminders.nextDueDate")}
                </Label>
                <DatePicker
                  value={formatDatePickerValue(form.next_due_date)}
                  onChange={handleDateChange("next_due_date")}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder={t("serviceReminders.optionalNotes")}
              />
            </div>
          </div>
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={isPending}>
            {isPending
              ? t("serviceReminders.saving")
              : t("serviceReminders.saveSchedule")}
          </Button>
        </DetailDrawer.Footer>
      </DetailDrawer>
    </>
  );
}
