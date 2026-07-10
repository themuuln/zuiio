"use client";

import { useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { ReceiptDrawer } from "@/components/shop/receipt-drawer";
import { buttonVariants } from "@/components/ui/button";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { useOrgSettings } from "@/lib/org-settings-context";
import { cn } from "@/lib/utils";

/**
 * Checkout as a slide-in drawer so the cashier never leaves the catalog.
 * After a successful sale, renders the receipt in a second drawer when
 * hasReceiptDrawer is enabled.
 */
export function CheckoutDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { items } = useCart();
  const { organizationId } = useOrgSettings();
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const [receiptSaleId, setReceiptSaleId] = useState<string | null>(null);

  // Footer state driven by CheckoutForm
  const [formState, setFormState] = useState({
    isFormValid: false,
    isPending: false,
    totalAmount: 0,
  });

  return (
    <>
      <SlideInDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Төлбөр тооцоо"
        description={totalQty > 0 ? `${totalQty} ширхэг` : undefined}
        panelWidth="30rem"
        footer={
          <button
            type="submit"
            form="checkout-form"
            disabled={!formState.isFormValid || formState.isPending}
            aria-busy={formState.isPending}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-14 w-full text-sm font-semibold shadow-lg",
            )}
          >
            {formState.isPending
              ? "Үүсгэж байна..."
              : `Борлуулалт үүсгэх (${formState.totalAmount.toLocaleString()}₮)`}
          </button>
        }
      >
        <CheckoutForm
          onClose={() => onOpenChange(false)}
          onReceiptOpen={(saleId) => setReceiptSaleId(saleId)}
          onStateChange={setFormState}
        />
      </SlideInDrawer>

      {receiptSaleId && (
        <ReceiptDrawer
          saleId={receiptSaleId}
          orgId={organizationId}
          open={true}
          onOpenChange={() => setReceiptSaleId(null)}
        />
      )}
    </>
  );
}
