"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
interface EditScheduleDialogProps {
  item: {
    id: string;
    service_name: string;
    interval_months: number | null;
    interval_km: number | null;
    notes: string | null;
    reminder_enabled: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id: string;
    service_name: string;
    interval_months: number | null;
    interval_km: number | null;
    notes: string | null;
    reminder_enabled: boolean;
  }) => Promise<void>;
  isPending: boolean;
}

export function EditScheduleDialog({
  item,
  open,
  onOpenChange,
  onSave,
  isPending,
}: EditScheduleDialogProps) {
  const t = useTranslations();
  const [form, setForm] = useState({
    service_name: "",
    interval_months: "",
    interval_km: "",
    notes: "",
    reminder_enabled: true,
  });

  useEffect(() => {
    if (item) {
      setForm({
        service_name: item.service_name,
        interval_months: item.interval_months?.toString() ?? "",
        interval_km: item.interval_km?.toString() ?? "",
        notes: item.notes ?? "",
        reminder_enabled: item.reminder_enabled,
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item || !form.service_name.trim()) {
      toast.error(t("serviceReminders.serviceNameRequired"));
      return;
    }

    try {
      await onSave({
        id: item.id,
        service_name: form.service_name.trim(),
        interval_months: form.interval_months
          ? Number.parseInt(form.interval_months, 10)
          : null,
        interval_km: form.interval_km
          ? Number.parseInt(form.interval_km, 10)
          : null,
        notes: form.notes || null,
        reminder_enabled: form.reminder_enabled,
      });

      onOpenChange(false);
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("serviceReminders.failedToUpdate"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("serviceReminders.editSchedule")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-service_name">
              {t("serviceReminders.serviceName")}
            </Label>
            <Input
              id="edit-service_name"
              value={form.service_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, service_name: e.target.value }))
              }
              placeholder={t("serviceReminders.serviceNamePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-interval_months">
                {t("serviceReminders.intervalMonths")}
              </Label>
              <Input
                id="edit-interval_months"
                type="number"
                value={form.interval_months}
                onChange={(e) =>
                  setForm((p) => ({ ...p, interval_months: e.target.value }))
                }
                placeholder="6"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-interval_km">
                {t("serviceReminders.intervalKm")}
              </Label>
              <Input
                id="edit-interval_km"
                type="number"
                value={form.interval_km}
                onChange={(e) =>
                  setForm((p) => ({ ...p, interval_km: e.target.value }))
                }
                placeholder="5000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-notes">{t("common.notes")}</Label>
            <Input
              id="edit-notes"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder={t("serviceReminders.optionalNotes")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm font-medium">
                {t("serviceReminders.reminderEnabled")}
              </Label>
            </div>
            <Switch
              checked={form.reminder_enabled}
              onCheckedChange={(checked) =>
                setForm((p) => ({ ...p, reminder_enabled: checked }))
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
