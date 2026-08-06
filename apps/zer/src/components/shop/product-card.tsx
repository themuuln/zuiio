"use client";
import { Check, Minus, Plus, ShoppingCart } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import type { SelectedVariant } from "@/components/products/variant-picker";
import { VariantPicker } from "@/components/products/variant-picker";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DrawerFooter } from "@/components/ui/drawer-footer";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { useOrgSettings } from "@/lib/org-settings-context";
import {
  fetchVariantGroups,
  fetchVariants,
  useVariantGroups,
} from "@/lib/query/hooks/use-product-variants";
import { variantKeys } from "@/lib/query/keys";
import { getCartItemKey } from "@/lib/shop-cart";
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

const LOW_STOCK_THRESHOLD = 5;

function StockChip({ stock, unit }: { stock: number; unit: string }) {
  const low = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        low
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          low ? "bg-destructive" : "bg-primary",
        )}
        aria-hidden="true"
      />
      {stock} {unit}
    </span>
  );
}

/** Shared props passed to both variant body components */
type VariantBodyProps = {
  product: ProductCardProduct;
  price: number;
  stock: number;
  unit: string;
  trackStock: boolean;
  isOutOfStock: boolean;
  inCart: boolean;
  hasVariants: boolean;
  cartQuantity: number;
  atMaxStock: boolean;
  justAdded: boolean;
  addButtonContent: React.ReactNode;
  prefetchVariants: () => void;
  handleDecrement: () => void;
  handleIncrement: () => void;
  handleAddToCart: () => void;
};

/** List variant of the product card — horizontal row with inline quantity controls */
function ListVariantBody({
  product,
  price,
  stock,
  unit,
  trackStock,
  isOutOfStock,
  inCart,
  hasVariants,
  cartQuantity,
  atMaxStock,
  justAdded,
  addButtonContent,
  prefetchVariants,
  handleDecrement,
  handleIncrement,
  handleAddToCart,
}: VariantBodyProps) {
  return (
    <>
      {/* Thumbnail */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted/30">
        {product.image_url ? (
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground/30"
            aria-hidden="true"
          >
            {product.name.charAt(0)}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="text-[10px] font-semibold text-destructive">
              Дууссан
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium leading-tight">
          {product.name}
        </h3>
        {product.brand_name && (
          <div className="flex items-center gap-1.5">
            {product.brand_logo_url ? (
              <OptimizedImage
                src={product.brand_logo_url}
                alt={`${product.brand_name} брэндийн лого`}
                width={14}
                height={14}
                className="size-3.5 rounded object-contain"
              />
            ) : null}
            <span className="text-[11px] text-muted-foreground leading-tight">
              {product.brand_name}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <p className="text-base font-bold tabular-nums tracking-tight">
            {price.toLocaleString()}₮
          </p>
          {trackStock && !isOutOfStock && (
            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
              {stock} {unit}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {inCart && !hasVariants ? (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Хасах"
            onClick={(e) => {
              e.stopPropagation();
              handleDecrement();
            }}
            className="flex size-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-primary/10 hover:text-foreground active:scale-95"
          >
            <Minus className="size-3.5" weight="bold" />
          </button>
          <span className="min-w-6 text-center text-sm font-bold tabular-nums">
            {cartQuantity}
          </span>
          <button
            type="button"
            aria-label="Нэмэх"
            disabled={atMaxStock}
            onClick={(e) => {
              e.stopPropagation();
              handleIncrement();
            }}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors active:scale-95",
              atMaxStock
                ? "cursor-not-allowed text-muted-foreground/40"
                : "text-primary hover:bg-primary/10",
            )}
          >
            <Plus className="size-3.5" weight="bold" />
          </button>
        </div>
      ) : (
        <Button
          size="sm"
          className={cn(
            "shrink-0 gap-1.5 text-xs font-semibold",
            justAdded && "bg-primary hover:bg-primary",
            hasVariants &&
              "border border-dashed border-border bg-muted/40 text-foreground disabled:opacity-100",
          )}
          disabled={isOutOfStock}
          onPointerEnter={prefetchVariants}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
        >
          {addButtonContent}
        </Button>
      )}
    </>
  );
}

/** Grid/tile variant of the product card — vertical card with image and action bar */
function GridVariantBody({
  product,
  price,
  stock,
  unit,
  isTile,
  trackStock,
  isOutOfStock,
  inCart,
  hasVariants,
  cartQuantity,
  atMaxStock,
  justAdded,
  addButtonContent,
  prefetchVariants,
  handleDecrement,
  handleIncrement,
  handleAddToCart,
}: VariantBodyProps & { isTile: boolean }) {
  return (
    <>
      {/* Image */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-muted/30",
          isOutOfStock && "bg-muted/10",
          isTile ? "aspect-[4/3]" : "aspect-square",
        )}
      >
        {product.image_url ? (
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              !isTile && "group-hover:scale-105",
              isOutOfStock && "opacity-50",
            )}
          />
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

        {/* Stock indicator */}
        {trackStock && !isOutOfStock && (
          <span className="absolute left-2 top-2 z-10">
            <StockChip stock={stock} unit={unit} />
          </span>
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
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px] animate-in fade-in-0 duration-200">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-in zoom-in-50 duration-300">
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
            {/* Simplified tile: price + stock */}
            <p className="text-lg font-bold tabular-nums tracking-tight">
              {price.toLocaleString()}₮
            </p>
          </>
        ) : (
          <>
            {/* Brand */}
            {product.brand_name && (
              <div className="flex items-center gap-1.5">
                {product.brand_logo_url ? (
                  <OptimizedImage
                    src={product.brand_logo_url}
                    alt={`${product.brand_name} брэндийн лого`}
                    width={16}
                    height={16}
                    className="size-4 rounded object-contain"
                  />
                ) : null}
                <span className="text-[11px] text-muted-foreground">
                  {product.brand_name}
                </span>
              </div>
            )}
            <p className="text-base font-bold tabular-nums tracking-tight">
              {price.toLocaleString()}₮
            </p>
          </>
        )}

        {inCart && !hasVariants ? (
          <div
            className={cn(
              "mt-auto flex h-[44px] items-center justify-between gap-1 rounded-md border border-primary/30 bg-primary/5 px-1.5",
              isOutOfStock && "opacity-50",
            )}
          >
            <button
              type="button"
              aria-label="Хасах"
              onClick={(e) => {
                e.stopPropagation();
                handleDecrement();
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-lg font-bold text-foreground/70 transition-colors hover:bg-primary/10 hover:text-foreground active:scale-95"
            >
              <Minus className="size-4" weight="bold" />
            </button>
            <span className="min-w-6 text-center text-sm font-bold tabular-nums">
              {cartQuantity}
            </span>
            <button
              type="button"
              aria-label="Нэмэх"
              disabled={atMaxStock}
              onClick={(e) => {
                e.stopPropagation();
                handleIncrement();
              }}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md text-lg font-bold transition-colors hover:bg-primary/10 active:scale-95",
                atMaxStock
                  ? "cursor-not-allowed text-muted-foreground/40"
                  : "text-primary",
              )}
            >
              <Plus className="size-4" weight="bold" />
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            className={cn(
              "mt-auto h-[44px] w-full gap-2 text-sm font-semibold transition-all",
              justAdded && "bg-primary hover:bg-primary",
              hasVariants &&
                "border border-dashed border-border bg-muted/40 text-foreground disabled:opacity-100",
            )}
            disabled={isOutOfStock}
            onPointerEnter={prefetchVariants}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
          >
            {addButtonContent}
          </Button>
        )}
      </CardContent>
    </>
  );
}

export const ProductCard = memo(function ProductCard({
  product,
  variant = "card",
  cartQuantity = 0,
}: {
  product: ProductCardProduct;
  variant?: "card" | "tile" | "list";
  cartQuantity?: number;
}) {
  const { addItem, updateQuantity, removeItem } = useCart();
  const price = Number(product.sale_price ?? 0);
  const stock = Number(product.current_stock ?? 0);
  const unit = product.unit ?? "ш";
  const { trackStock } = useOrgSettings();
  const isOutOfStock = trackStock && stock <= 0;
  const inCart = cartQuantity > 0;
  const productCartKey = getCartItemKey({ productId: product.id });
  const maxStock = trackStock ? stock : Number.POSITIVE_INFINITY;
  const atMaxStock = cartQuantity >= maxStock;
  const handleIncrement = () => {
    if (isOutOfStock || atMaxStock) return;
    updateQuantity(productCartKey, cartQuantity + 1);
  };
  const handleDecrement = () => {
    if (cartQuantity <= 1) {
      removeItem(productCartKey);
    } else {
      updateQuantity(productCartKey, cartQuantity - 1);
    }
  };
  const [justAdded, setJustAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);

  // Lazy detection: does this product have variant groups?
  // IntersectionObserver triggers fetch only when card enters viewport
  const detectorRef = useRef<HTMLDivElement>(null);
  const [detectorEnabled, setDetectorEnabled] = useState(false);

  useEffect(() => {
    const el = detectorRef.current;
    if (!el || detectorEnabled) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDetectorEnabled(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [detectorEnabled]);

  const { data: variantGroups } = useVariantGroups(
    detectorEnabled ? product.id : undefined,
  );
  const hasVariants = !!variantGroups && variantGroups.length > 0;
  const queryClient = useQueryClient();
  const prefetchVariants = useCallback(() => {
    if (!hasVariants) return;
    queryClient.prefetchQuery({
      queryKey: variantKeys.byProduct(product.id),
      queryFn: () => fetchVariantGroups(product.id),
      staleTime: 60_000,
    });
    queryClient.prefetchQuery({
      queryKey: [...variantKeys.byProduct(product.id), "variants"],
      queryFn: () => fetchVariants(product.id),
      staleTime: 60_000,
    });
  }, [hasVariants, product.id, queryClient]);
  // Reset state when product changes
  useEffect(() => {
    setVariantDialogOpen(false);
    setJustAdded(false);
    setSelectedVariant(null);
  }, []);

  // Show "added" feedback briefly
  useEffect(() => {
    if (justAdded) {
      const t = setTimeout(() => setJustAdded(false), 1400);
      return () => clearTimeout(t);
    }
  }, [justAdded]);

  const addButtonContent = justAdded ? (
    <>
      <Check className="size-4" weight="bold" />
      Сагсанд нэмлээ
    </>
  ) : isOutOfStock ? (
    "Дууссан"
  ) : hasVariants ? (
    "Вариант сонгох"
  ) : (
    <>
      <ShoppingCart className="size-4" weight="bold" />
      {cartQuantity > 0 ? "Дахин нэмэх" : "Нэмэх"}
    </>
  );

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      setVariantDialogOpen(true);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: price,
      unit,
      maxStock: trackStock ? stock : Number.POSITIVE_INFINITY,
    });
    setJustAdded(true);
  };

  const handleVariantSelected = (variant: SelectedVariant | null) => {
    setSelectedVariant(variant);
  };

  const handleAddToCartFromDrawer = () => {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: Number(selectedVariant.sale_price ?? product.sale_price ?? 0),
      unit,
      maxStock: trackStock
        ? Number(selectedVariant.current_stock ?? product.current_stock ?? 0)
        : Number.POSITIVE_INFINITY,
      variantId: selectedVariant.variant_id,
      variantLabels: selectedVariant.option_labels,
      variantOptionIds: selectedVariant.option_ids,
    });
    setSelectedVariant(null);
    setVariantDialogOpen(false);
    setJustAdded(true);
  };

  const isTile = variant === "tile";
  const isList = variant === "list";
  const previewImage = selectedVariant?.image_url ?? product.image_url;

  return (
    <div data-slot="product-card-wrapper">
      {/* Hidden detector for lazy variant group fetch */}
      <div ref={detectorRef} className="h-0" />

      <Card
        className={cn(
          "overflow-hidden transition-all",
          isOutOfStock && "opacity-60",
          justAdded &&
            "ring-2 ring-primary/40 scale-[1.015] transition-transform",
          isList
            ? "flex flex-row items-center gap-4 px-4 py-3"
            : "group flex flex-col gap-0 py-0",
        )}
      >
        {isList ? (
          <ListVariantBody
            product={product}
            price={price}
            stock={stock}
            unit={unit}
            trackStock={trackStock}
            isOutOfStock={isOutOfStock}
            inCart={inCart}
            hasVariants={hasVariants}
            cartQuantity={cartQuantity}
            atMaxStock={atMaxStock}
            justAdded={justAdded}
            addButtonContent={addButtonContent}
            prefetchVariants={prefetchVariants}
            handleDecrement={handleDecrement}
            handleIncrement={handleIncrement}
            handleAddToCart={handleAddToCart}
          />
        ) : (
          <GridVariantBody
            product={product}
            price={price}
            stock={stock}
            unit={unit}
            isTile={isTile}
            trackStock={trackStock}
            isOutOfStock={isOutOfStock}
            inCart={inCart}
            hasVariants={hasVariants}
            cartQuantity={cartQuantity}
            atMaxStock={atMaxStock}
            justAdded={justAdded}
            addButtonContent={addButtonContent}
            prefetchVariants={prefetchVariants}
            handleDecrement={handleDecrement}
            handleIncrement={handleIncrement}
            handleAddToCart={handleAddToCart}
          />
        )}
      </Card>

      {/* Variant Selection Drawer */}
      <SlideInDrawer
        open={variantDialogOpen}
        onOpenChange={(open) => {
          setVariantDialogOpen(open);
          if (!open) setSelectedVariant(null);
        }}
        title={product.name}
        footer={
          <DrawerFooter>
            <button
              type="button"
              disabled={!selectedVariant}
              onClick={handleAddToCartFromDrawer}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full gap-2",
              )}
            >
              <ShoppingCart className="size-4" weight="bold" />
              {selectedVariant ? (
                <>
                  Сагсанд хийх
                  <span className="font-bold">
                    ·{" "}
                    {Number(
                      selectedVariant.sale_price ?? product.sale_price ?? 0,
                    ).toLocaleString()}
                    ₮
                  </span>
                </>
              ) : (
                "Хувилбар сонгоно уу"
              )}
            </button>
          </DrawerFooter>
        }
      >
        <div className="space-y-5">
          {/* Product preview */}
          <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
            {previewImage ? (
              <OptimizedImage
                src={previewImage}
                alt={product.name}
                className="size-14 shrink-0 rounded-md object-cover"
                width={56}
                height={56}
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted text-lg font-bold text-muted-foreground/30">
                {product.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-lg font-bold text-primary">
                {selectedVariant
                  ? Number(
                      selectedVariant.sale_price ?? product.sale_price ?? 0,
                    ).toLocaleString()
                  : price.toLocaleString()}
                ₮
              </p>
            </div>
          </div>

          <VariantPicker
            productId={product.id}
            onSelect={handleVariantSelected}
            dialogMode
          />
        </div>
      </SlideInDrawer>
    </div>
  );
});
