"use client";

import { ResponsiveFormModal } from "@/components/ui/responsive-form-modal";
import { CustomerForm } from "./customer-form";
import type { Customer } from "@/lib/types";

type QuickCreateCustomerSheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the newly created customer after successful creation */
  onCreated?: (customer: Customer) => void;
  orgId: string;
};

export function QuickCreateCustomerSheet({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateCustomerSheetProps) {
  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="New customer"
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
