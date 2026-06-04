"use client";

import { useTranslations } from "next-intl";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onCreated?: () => void;
}

export function AppointmentCreateSheet({
  open,
  onOpenChange,
  orgId,
  onCreated,
}: Props) {
  const t = useTranslations("appointments");

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("newAppointment")}
      description={t("createDescription")}
      sheetSize="lg"
    >
      <AppointmentForm
        orgId={orgId}
        onSuccess={() => {
          onCreated?.();
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
