"use client";

import { VariantPicker } from "@/components/products/variant-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PosProduct } from "@/lib/pos";

export type PosVariantSelection = {
  id: string;
  label: string;
  salePrice: number | null;
  stock: number | null;
};

/**
 * Variant quick-pick for the register. Reuses the product VariantPicker;
 * a full option selection auto-fires onSelect with the matched variant and
 * the orchestrator adds it to the cart and closes this dialog.
 */
export function PosVariantDialog({
  product,
  onClose,
  onSelect,
}: {
  product: PosProduct | null;
  onClose: () => void;
  onSelect: (variant: PosVariantSelection) => void;
}) {
  return (
    <Dialog
      open={product !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{product?.name}</DialogTitle>
        </DialogHeader>
        {product && (
          <VariantPicker
            productId={product.id}
            dialogMode
            onSelect={(variant) => {
              if (variant?.variant_id) {
                onSelect({
                  id: variant.variant_id,
                  label: variant.option_labels,
                  salePrice: variant.sale_price,
                  stock: variant.current_stock,
                });
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
