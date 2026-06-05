"use client";

import { useTranslations } from "next-intl";
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

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addVehicle")}
      description={t("createSubtitle")}
      sheetSize="2xl"
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
