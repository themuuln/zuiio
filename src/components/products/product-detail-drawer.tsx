"use client";

import { Drawer } from "@base-ui/react/drawer";
import {
  Barcode,
  CaretLeft,
  CaretRight,
  Eye,
  Package,
  Tag,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductDetailData = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  category_name: string | null;
  cost_price: number | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  image_url?: string | null;
  image_urls?: string[] | null;
};

export function ProductDetailDrawer({
  product,
  children,
}: {
  product: ProductDetailData;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isLow =
    Number(product.current_stock ?? 0) <= Number(product.min_stock ?? 0);
  const images = product.image_urls?.length
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : [];
  const [imgIndex, setImgIndex] = useState(0);

  return (
    <Drawer.Root swipeDirection="right" open={open} onOpenChange={setOpen}>
      {children ? (
        <Drawer.Trigger className="w-full">{children}</Drawer.Trigger>
      ) : (
        <Drawer.Trigger
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
        >
          <Eye className="size-3.5" />
        </Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Backdrop className="[--backdrop-opacity:0.2] [--bleed:3rem] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="[--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem] fixed inset-0 flex items-stretch justify-end p-(--viewport-padding)">
          <Drawer.Popup className="[--bleed:3rem] supports-[-webkit-touch-callout:none]:[--bleed:0px] h-full w-[calc(28rem+3rem)] max-w-[calc(100vw-3rem+3rem)] -mr-[3rem] border-l border-border bg-white p-6 pr-[calc(1.5rem+3rem)] text-foreground outline-none shadow-lg overflow-y-auto overscroll-contain touch-auto [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[28rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <Drawer.Content className="mx-auto w-full">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold tracking-tight">
                    {product.name}
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    Бүтээгдэхүүний дэлгэрэнгүй мэдээлэл
                  </Drawer.Description>
                </div>
                <Drawer.Close className="flex size-8 items-center justify-center rounded-none border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-foreground">
                  <X className="size-4" />
                </Drawer.Close>
              </div>

              <div className="space-y-6">
                {/* Image gallery */}
                {images.length > 0 && (
                  <div className="group relative aspect-square w-full overflow-hidden rounded-lg bg-muted/30">
                    <img
                      src={images[imgIndex]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setImgIndex(
                              (i) => (i - 1 + images.length) % images.length,
                            )
                          }
                          className="absolute left-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                        >
                          <CaretLeft className="size-4" weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setImgIndex((i) => (i + 1) % images.length)
                          }
                          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                        >
                          <CaretRight className="size-4" weight="bold" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setImgIndex(i)}
                              className={cn(
                                "size-2 rounded-full transition-all",
                                i === imgIndex
                                  ? "bg-white w-5"
                                  : "bg-white/50 hover:bg-white/80",
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <Badge variant={isLow ? "destructive" : "secondary"}>
                    {isLow ? "Анхаарах" : "Хэвийн"}
                  </Badge>
                </div>

                {/* Info rows */}
                <div className="divide-y">
                  <InfoRow
                    icon={<Package className="size-4" />}
                    label="Нэр"
                    value={product.name}
                  />
                  <InfoRow
                    icon={<Tag className="size-4" />}
                    label="SKU"
                    value={product.sku ?? "-"}
                  />
                  <InfoRow
                    icon={<Barcode className="size-4" />}
                    label="Barcode"
                    value={product.barcode ?? "-"}
                  />
                  <InfoRow label="Нэгж" value={product.unit ?? "ширхэг"} />
                  <InfoRow
                    label="Ангилал"
                    value={product.category_name ?? "Ангилаагүй"}
                  />
                  <InfoRow
                    label="Өртөг үнэ"
                    value={formatCurrency(Number(product.cost_price ?? 0))}
                  />
                  <InfoRow
                    label="Зарах үнэ"
                    value={formatCurrency(Number(product.sale_price ?? 0))}
                  />
                  <InfoRow
                    label="Одоогийн үлдэгдэл"
                    value={`${product.current_stock ?? 0} ${product.unit ?? "ширхэг"}`}
                  />
                  <InfoRow
                    label="Доод үлдэгдэл"
                    value={`${product.min_stock ?? 0} ${product.unit ?? "ширхэг"}`}
                  />
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
