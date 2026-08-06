"use client";

import { ReceiptIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { SaleForm } from "@/app/(dashboard)/sales/new/sale-form";
import { buttonVariants } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  barcode: string | null;
  image_url: string | null;
  has_variants: boolean;
};

export function SalesCreateDrawer({
  products,
  hasReceiptPrinter,
  open: externalOpen,
  onOpenChangeAction: externalOnOpenChangeAction,
  onOpenDetailAction,
}: {
  products: ProductOption[];
  /** Org setting: auto-print the receipt after each sale. */
  hasReceiptPrinter: boolean;
  open?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
  onOpenDetailAction?: (saleId: string) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChangeAction ?? setInternalOpen;

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={setOpen}
      title="Борлуулалт нэмэх"
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <ReceiptIcon className="size-4" />
          Шинэ борлуулалт
        </button>
      }
      panelWidth="48rem"
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
        hasReceiptPrinter={hasReceiptPrinter}
        onSuccess={() => setOpen(false)}
        onOpenDetail={onOpenDetailAction}
        onReopenForm={() => setOpen(true)}
      />
    </SlideInDrawer>
  );
}
