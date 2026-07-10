"use client";

import { useTranslations } from "next-intl";
import { reportServerError } from "@/lib/sentry-report-server";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
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
    interval_months: 0,
    interval_km: 0,
    notes: "",
    reminder_enabled: true,
  });

  useEffect(() => {
    if (item) {
      setForm({
        service_name: item.service_name,
        interval_months: item.interval_months ?? 0,
        interval_km: item.interval_km ?? 0,
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
        interval_months: form.interval_months > 0 ? form.interval_months : null,
        interval_km: form.interval_km > 0 ? form.interval_km : null,
        notes: form.notes || null,
        reminder_enabled: form.reminder_enabled,
      });

      onOpenChange(false);
      toast.success(t("common.saved"));
    } catch (err) {
    reportServerError("Unexpected error", err);
      toast.error(
        err instanceof Error
          ? err.message
          : t("serviceReminders.failedToUpdate"),
      );
    }
  };

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="lg">
      <DetailDrawer.Header>
        <DetailDrawer.Title>
          {t("serviceReminders.editSchedule")}
        </DetailDrawer.Title>
      </DetailDrawer.Header>
      <DetailDrawer.Body>
        <div className="grid gap-4">
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
              <NumericInput
                id="edit-interval_months"
                value={form.interval_months}
                onChange={(val) =>
                  setForm((p) => ({ ...p, interval_months: val }))
                }
                placeholder="6"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-interval_km">
                {t("serviceReminders.intervalKm")}
              </Label>
              <NumericInput
                id="edit-interval_km"
                value={form.interval_km}
                onChange={(val) => setForm((p) => ({ ...p, interval_km: val }))}
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
      </DetailDrawer.Body>
      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button size="lg" onClick={handleSave} disabled={isPending}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
