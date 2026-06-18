"use client";

import { Receipt } from "@phosphor-icons/react";
import { useState } from "react";
import { SaleForm } from "@/app/(dashboard)/sales/new/sale-form";
import { buttonVariants } from "@/components/ui/button";
import { DrawerFooter, DrawerCancel, DrawerSubmit } from "@/components/ui/drawer-footer";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

export function SalesCreateDrawer({
  products,
  customers,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onOpenDetail,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenDetail?: (saleId: string) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={setOpen}
      title="Борлуулалт нэмэх"
      description="Бүтээгдэхүүн, тоо хэмжээ, үнийг оруулан борлуулалт үүсгэнэ."
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <Receipt className="size-4" />
          Шинэ борлуулалт
        </button>
      }
      panelWidth="32rem"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit form="sale-form" label="Борлуулалт хадгалах" />
        </DrawerFooter>
      }
    >
      <SaleForm
        formId="sale-form"
        products={products}
        customers={customers}
        onSuccess={() => setOpen(false)}
        onOpenDetail={onOpenDetail}
        onReopenForm={() => setOpen(true)}
      />
    </SlideInDrawer>
  );
}
