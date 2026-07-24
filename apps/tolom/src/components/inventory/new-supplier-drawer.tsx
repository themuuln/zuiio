"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { SupplierForm } from "./supplier-form";

interface NewSupplierSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSupplierDrawer({
  open,
  onOpenChange,
}: NewSupplierSheetProps) {
  const t = useTranslations("inventory");

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("newSupplier")}
      desc={t("newSupplierDescription")}
      sheetSize="2xl"
    >
      <SupplierForm />
    </ResponsiveFormModal>
  );
}
