"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { VehicleForm } from "./vehicle-form";

type NewVehicleSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (vehicleId: string) => void;
  initialPlateNumber?: string;
};

export function NewVehicleSheet({
  open,
  onOpenChange,
  onSuccess,
  initialPlateNumber,
}: NewVehicleSheetProps) {
  const t = useTranslations("vehicles");

  const commonT = useTranslations("common");
  const formId = "new-vehicle-form";

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addVehicle")}
      desc={t("createSubtitle")}
      sheetSize="2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-12 px-8"
          >
            {commonT("cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            className="h-12 px-8 min-w-[160px] text-base font-semibold"
          >
            {t("addVehicle")}
          </Button>
        </div>
      }
    >
      <VehicleForm
        mode="full"
        formId={formId}
        showButtons={false}
        initialData={
          initialPlateNumber ? { plateNumber: initialPlateNumber } : undefined
        }
        onSuccess={(vehicle) => {
          onSuccess?.(vehicle.id);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
