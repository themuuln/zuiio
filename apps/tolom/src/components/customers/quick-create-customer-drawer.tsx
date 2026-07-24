"use client";

import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import type { Customer } from "@/lib/types";
import { CustomerForm } from "./customer-form";

type QuickCreateCustomerSheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the newly created customer after successful creation */
  onCreated?: (customer: Customer) => void;
  orgId: string;
};

export function QuickCreateCustomerDrawer({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateCustomerSheetProps) {
  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="New customer"
      sheetSize="2xl"
    >
      <CustomerForm
        mode="quick"
        onSuccess={(customer) => {
          onCreated?.(customer);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
