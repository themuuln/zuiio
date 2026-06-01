"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { VehicleForm } from "./vehicle-form";

type NewVehicleSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (vehicleId: string) => void;
};

export function NewVehicleSheet({
  open,
  onOpenChange,
  onSuccess,
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
        onSuccess={(vehicle) => {
          onSuccess?.(vehicle.id);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
