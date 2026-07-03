"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import type { SelectedVariant } from "@/components/products/variant-picker";
import { VariantPicker } from "@/components/products/variant-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ProductCardProduct = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  image_url: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
};

export function ProductCard({
  product,
  variant = "card",
}: {
  product: ProductCardProduct;
  variant?: "card" | "tile";
}) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(null);
  const [hasVariants, setHasVariants] = useState(false);

  // Use variant-specific price/stock when a variant is selected
  const price = Number(selectedVariant?.sale_price ?? product.sale_price ?? 0);
  const stock = Number(
    selectedVariant?.current_stock ?? product.current_stock ?? 0,
  );
  const unit = product.unit ?? "ш";
  const isOutOfStock = stock <= 0;
  const displayImage = selectedVariant?.image_url ?? product.image_url;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (hasVariants && !selectedVariant) return;

    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: price,
      unit,
      maxStock: stock,
      variantId: selectedVariant?.variant_id,
      variantLabels: selectedVariant?.option_labels,
      variantOptionIds: selectedVariant?.option_ids,
    });
  };

  const isTile = variant === "tile";

  return (
    <Card
      className={cn(
        "flex flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
        isOutOfStock && "opacity-60",
        isOutOfStock && "opacity-60",
      )}
    >
      {/* Image: larger in tile mode */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-muted/30",
          isOutOfStock && "bg-muted/10",
          isTile ? "aspect-[4/3]" : "aspect-square",
        )}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover",
              isOutOfStock && "opacity-50",
            )}
          />
        ) : (
          <span
            className={cn(
              "font-bold text-muted-foreground/30",
              isTile ? "text-5xl" : "text-3xl",
            )}
          >
            {product.name.charAt(0)}
          </span>
        )}
        {isOutOfStock && (
          <Badge
            variant="outline"
            className="absolute left-2 top-2 border-destructive/40 text-destructive"
          >
            Дууссан
          </Badge>
        )}
      </div>

      <CardContent
        className={cn(
          "flex flex-1 flex-col gap-1.5",
          isTile ? "px-3 pb-3 pt-2" : "px-3 py-3",
        )}
      >
        {/* Name */}
        <h3
          className={cn(
            "line-clamp-2 font-medium leading-tight",
            isTile ? "text-sm" : "text-sm",
          )}
        >
          {product.name}
        </h3>

        {isTile ? (
          <>
            {/* Simplified tile: just price + stock */}
            <p className="mt-auto text-lg font-bold text-primary">
              {price.toLocaleString()}₮
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>
                {stock} {unit}
              </span>
              {stock > 0 && stock <= 5 && (
                <span className="text-amber-600">(Дуусах дөхсөн)</span>
              )}
            </div>
            {/* Variant picker still works */}
            <VariantPicker
              productId={product.id}
              onSelect={setSelectedVariant}
              onHasVariants={setHasVariants}
            />
            <Button
              size="sm"
              className="mt-2 h-[44px] w-full gap-2 text-sm"
              disabled={isOutOfStock || (hasVariants && !selectedVariant)}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
            >
              <ShoppingCart className="size-4" weight="bold" />
              {isOutOfStock
                ? "Дууссан"
                : hasVariants && !selectedVariant
                  ? "Вариант сонго"
                  : "Нэмэх"}
            </Button>
          </>
        ) : (
          <>
            {/* Brand */}
            {product.brand_name && (
              <div className="flex items-center gap-1.5">
                {product.brand_logo_url ? (
                  <img
                    src={product.brand_logo_url}
                    alt={product.brand_name}
                    className="size-4 rounded object-contain dark:invert"
                  />
                ) : null}
                <span className="text-[11px] text-muted-foreground">
                  {product.brand_name}
                </span>
              </div>
            )}
            <p className="mt-auto text-base font-semibold text-primary">
              {price.toLocaleString()}₮
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>
                {stock} {unit}
              </span>
              {stock > 0 && stock <= 5 && (
                <span className="text-amber-600">(Дуусах дөхсөн)</span>
              )}
            </div>
            <VariantPicker
              productId={product.id}
              onSelect={setSelectedVariant}
              onHasVariants={setHasVariants}
            />
            <Button
              size="sm"
              className="mt-2 h-[44px] w-full gap-2 text-sm"
              disabled={isOutOfStock || (hasVariants && !selectedVariant)}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="size-4" weight="bold" />
              {isOutOfStock
                ? "Дууссан"
                : hasVariants && !selectedVariant
                  ? "Вариант сонго"
                  : "Нэмэх"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
