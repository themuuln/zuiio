"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { PurchaseOrderForm } from "./purchase-order-form";

interface NewPurchaseOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPurchaseOrderSheet({
  open,
  onOpenChange,
}: NewPurchaseOrderSheetProps) {
  const t = useTranslations("inventory");

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("newPurchaseOrder")}
      desc="Захиалга үүсгэх"
      sheetSize="2xl"
    >
      <PurchaseOrderForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
