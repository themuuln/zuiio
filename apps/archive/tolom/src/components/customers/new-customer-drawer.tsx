"use client";

import { useTranslations } from "next-intl";
import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { CustomerForm } from "./customer-form";

type NewCustomerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customerId: string) => void;
};

export function NewCustomerDrawer({
  open,
  onOpenChange,
  onSuccess,
}: NewCustomerSheetProps) {
  const t = useTranslations("customers");

  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addCustomer")}
      desc={t("createSubtitle")}
      sheetSize="2xl"
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
