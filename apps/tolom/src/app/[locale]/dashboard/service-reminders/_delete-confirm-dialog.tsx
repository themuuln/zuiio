"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ServiceScheduleItem } from "@/lib/queries/use-service-reminders";
import { formatVehicleLabel } from "./_utils";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ServiceScheduleItem | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  isPending,
}: DeleteConfirmDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {item
              ? t("serviceReminders.deleteConfirmTitle", {
                  serviceName: item.service_name,
                })
              : t("serviceReminders.deleteTitle")}
          </DialogTitle>
          <DialogDescription>
            {item ? (
              <span className="flex flex-col gap-1">
                <span>
                  {t("serviceReminders.deleteConfirmVehicle", {
                    vehicle: formatVehicleLabel(item.vehicle),
                  })}
                </span>
                <span>{t("serviceReminders.deleteDescription")}</span>
              </span>
            ) : (
              t("serviceReminders.deleteDescription")
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
