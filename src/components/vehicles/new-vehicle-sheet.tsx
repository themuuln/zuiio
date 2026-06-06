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
  /** Z-index layer for stacked overlays. 0 = default (z-50), 1 = z-51, etc. */
  zLayer?: number;
};

export function NewVehicleSheet({
  open,
  onOpenChange,
  onSuccess,
  initialPlateNumber,
  zLayer = 0,
}: NewVehicleSheetProps) {
  const t = useTranslations("vehicles");

  const commonT = useTranslations("common");
  const formId = "new-vehicle-form";

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addVehicle")}
      description={t("createSubtitle")}
      sheetSize="2xl"
      zLayer={zLayer}
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
