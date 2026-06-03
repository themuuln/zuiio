"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { SupplierForm } from "./supplier-form";

interface NewSupplierSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSupplierSheet({
  open,
  onOpenChange,
}: NewSupplierSheetProps) {
  const t = useTranslations("inventory");

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("newSupplier")}
      description={t("newSupplierDescription")}
      sheetSize="2xl"
    >
      <SupplierForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
