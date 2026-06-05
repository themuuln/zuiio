"use client";

import { useTranslations } from "next-intl";
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

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addVehicle")}
      description={t("createSubtitle")}
      sheetSize="2xl"
      zLayer={zLayer}
    >
      <VehicleForm
        mode="full"
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
