"use client";
import { Check, ShoppingCart } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import type { SelectedVariant } from "@/components/products/variant-picker";
import { VariantPicker } from "@/components/products/variant-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { addItem, items } = useCart();
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(null);
  const [hasVariants, setHasVariants] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Show "added" feedback briefly
  useEffect(() => {
    if (justAdded) {
      const t = setTimeout(() => setJustAdded(false), 1200);
      return () => clearTimeout(t);
    }
  }, [justAdded]);

  // Use variant-specific price/stock when a variant is selected
  const price = Number(selectedVariant?.sale_price ?? product.sale_price ?? 0);
  const stock = Number(
    selectedVariant?.current_stock ?? product.current_stock ?? 0,
  );
  const unit = product.unit ?? "ш";
  const isOutOfStock = stock <= 0;
  const displayImage = selectedVariant?.image_url ?? product.image_url;

  // Compute current cart quantity for this product
  const cartItem = items.find(
    (i) => i.productId === product.id && !i.variantId,
  );

  // Reset image states when displayImage changes (e.g., variant selected)
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [displayImage]);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

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
    setJustAdded(true);
  };

  const isTile = variant === "tile";

  return (
    <Card
      className={cn(
        "flex flex-col gap-0 overflow-hidden py-0 transition-all",
        isOutOfStock && "opacity-60",
        justAdded && "ring-2 ring-primary/30",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-muted/30",
          isOutOfStock && "bg-muted/10",
          isTile ? "aspect-[4/3]" : "aspect-square",
        )}
      >
        {displayImage && !imageError ? (
          <>
            {/* Skeleton loading placeholder (visible until image loads) */}
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 size-full rounded-none" />
            )}
            <img
              src={displayImage}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300",
                !isTile && "group-hover:scale-105",
                isOutOfStock && "opacity-50",
                imageLoaded ? "opacity-100" : "opacity-0",
              )}
            />
          </>
        ) : (
          <span
            className={cn(
              "font-bold text-muted-foreground/30",
              isTile ? "text-5xl" : "text-3xl",
            )}
            aria-hidden="true"
          >
            {product.name.charAt(0)}
          </span>
        )}

        {/* Out of stock badge */}
        {isOutOfStock && (
          <Badge
            variant="outline"
            className="absolute left-2 top-2 border-destructive/40 text-destructive"
          >
            Дууссан
          </Badge>
        )}

        {/* Cart quantity badge */}
        {!isOutOfStock && cartQuantity > 0 && (
          <Badge className="absolute right-2 top-2 gap-1 bg-primary px-2 py-0.5 text-[11px] text-primary-foreground shadow-sm">
            <ShoppingCart className="size-3" weight="fill" />
            {cartQuantity}
          </Badge>
        )}

        {/* Just-added check overlay */}
        {justAdded && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Check className="size-5" weight="bold" />
            </div>
          </div>
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
            {/* Simplified tile: price + stock + quick add */}
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
            <VariantPicker
              productId={product.id}
              onSelect={setSelectedVariant}
              onHasVariants={setHasVariants}
            />
            <Button
              size="sm"
              className={cn(
                "mt-2 h-[44px] w-full gap-2 text-sm font-semibold transition-all",
                justAdded && "bg-emerald-600 hover:bg-emerald-600",
              )}
              disabled={isOutOfStock || (hasVariants && !selectedVariant)}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
            >
              {justAdded ? (
                <>
                  <Check className="size-4" weight="bold" />
                  Нэмэгдсэн
                </>
              ) : isOutOfStock ? (
                "Дууссан"
              ) : hasVariants && !selectedVariant ? (
                "Вариант сонго"
              ) : (
                <>
                  <ShoppingCart className="size-4" weight="bold" />
                  {cartQuantity > 0 ? `+${cartQuantity + 1}` : "Нэмэх"}
                </>
              )}
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
                    alt={`${product.brand_name} брэндийн лого`}
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
              className={cn(
                "mt-2 h-[44px] w-full gap-2 text-sm font-semibold transition-all",
                justAdded && "bg-emerald-600 hover:bg-emerald-600",
              )}
              disabled={isOutOfStock || (hasVariants && !selectedVariant)}
              onClick={handleAddToCart}
            >
              {justAdded ? (
                <>
                  <Check className="size-4" weight="bold" />
                  Нэмэгдсэн
                </>
              ) : isOutOfStock ? (
                "Дууссан"
              ) : hasVariants && !selectedVariant ? (
                "Вариант сонго"
              ) : (
                <>
                  <ShoppingCart className="size-4" weight="bold" />
                  {cartQuantity > 0 ? `+${cartQuantity + 1}` : "Нэмэх"}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
