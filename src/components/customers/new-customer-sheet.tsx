"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { CustomerForm } from "./customer-form";

type NewCustomerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customerId: string) => void;
  /** Z-index layer for stacked overlays. 0 = default (z-50), 1 = z-51, etc. */
  zLayer?: number;
};

export function NewCustomerSheet({
  open,
  onOpenChange,
  onSuccess,
  zLayer = 0,
}: NewCustomerSheetProps) {
  const t = useTranslations("customers");

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addCustomer")}
      description={t("createSubtitle")}
      sheetSize="2xl"
      zLayer={zLayer}
    >
      <CustomerForm
        mode="full"
        onSuccess={(customer) => {
          onSuccess?.(customer.id);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
