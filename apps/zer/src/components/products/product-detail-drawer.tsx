"use client";

import {
  Barcode,
  CaretLeft,
  CaretRight,
  Package,
  Tag,
  Trash,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteProduct } from "@/app/(dashboard)/products/actions";
import { ProductAiActions } from "@/components/products/product-ai-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { InfoRow } from "@/components/ui/info-row";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatCurrency } from "@/lib/format";
import { productKeys } from "@/lib/query/keys";
import { useOptimisticDelete } from "@/lib/query/use-optimistic";
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
  variants?:
    | {
        id: string;
        sku: string | null;
        sale_price: number | null;
        current_stock: number | null;
        option_labels: string;
      }[]
    | null;
};

export function ProductDetailDrawer({
  product,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onEdit,
  onDelete,
  isDeletePending,
}: {
  product: ProductDetailData;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeletePending?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const isLow =
    Number(product.current_stock ?? 0) <= Number(product.min_stock ?? 0);
  const images = product.image_urls?.length
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : [];
  const [imgIndex, setImgIndex] = useState(0);

  const deleteMutation = useOptimisticDelete({
    mutationFn: async (formData: FormData) => {
      const result = await deleteProduct(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
      return result;
    },
    queryKey: productKeys.all,
    getId: (formData) => formData.get("id")?.toString() ?? "",
  });

  const handleDelete = () => {
    if (deleteMutation.isPending) return;
    const confirmed = window.confirm(
      `"${product.name}" бүтээгдэхүүнийг устгахдаа итгэлтэй байна уу?`,
    );
    if (!confirmed) return;
    const formData = new FormData();
    formData.set("id", product.id);
    deleteMutation.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Бүтээгдэхүүн амжилттай устгагдлаа.");
      },
    });
  };

  return (
    <DrawerLayout
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      title={product.name}
      description="Бүтээгдэхүүний дэлгэрэнгүй мэдээлэл"
      direction="bottom"
    >
      <div className="space-y-6">
        {/* Edit/Delete action buttons */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Засах
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeletePending}
                className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium bg-transparent hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Устгах
              </button>
            )}
          </div>
        )}

        {/* Image gallery */}
        {images.length > 0 && (
          <div className="group relative aspect-square w-full overflow-hidden rounded-lg bg-muted/30">
            <OptimizedImage
              src={images[imgIndex]}
              alt={product.name}
              className="h-full w-full object-cover"
              aspectRatio="1/1"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setImgIndex((i) => (i - 1 + images.length) % images.length)
                  }
                  className="absolute left-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                >
                  <CaretLeft className="size-4" weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                >
                  <CaretRight className="size-4" weight="bold" />
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {images.map((url, i) => (
                    <button
                      key={url}
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
          {product.variants && product.variants.length > 0 && (
            <Badge variant="secondary">
              Варианттай · {product.variants.length}
            </Badge>
          )}
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
            value={
              product.variants && product.variants.length > 0
                ? `${product.variants.reduce(
                    (sum, v) => sum + (v.current_stock ?? 0),
                    0,
                  )} ${product.unit ?? "ширхэг"} (${product.variants.length} вариант)`
                : `${product.current_stock ?? 0} ${product.unit ?? "ширхэг"}`
            }
          />
          <InfoRow
            label="Доод үлдэгдэл"
            value={`${product.min_stock ?? 0} ${product.unit ?? "ширхэг"}`}
          />
        </div>

        {/* AI actions */}
        <ProductAiActions
          productId={product.id}
          productName={product.name}
          imageUrl={product.image_url}
          onEnhanceImage={async () => {
            if (!product.image_url) return;
            try {
              const { enhanceProductPhotoAction } = await import("@/app/(dashboard)/ai/enhance/actions");
              const result = await enhanceProductPhotoAction(product.image_url);
              if (result.imageUrl) {
                toast.success("Зураг сайжруулагдлаа!");
              }
            } catch {
              toast.error("Зураг сайжруулахад алдаа гарлаа");
            }
          }}
        />

        {/* Variants section */}
        {product.variants && product.variants.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">
              Вариантууд ({product.variants.length})
            </h4>
            <div className="divide-y rounded-lg border text-sm">
              {product.variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">
                      {v.option_labels}
                    </span>
                    {v.sku && (
                      <span className="text-[11px] text-muted-foreground">
                        SKU: {v.sku}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">
                      {formatCurrency(Number(v.sale_price ?? 0))}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {v.current_stock ?? 0} ширхэг
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete action */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className={buttonVariants({ variant: "destructive", size: "sm" })}
          >
            <Trash className="mr-2 size-4" />
            {deleteMutation.isPending
              ? "Устгаж байна..."
              : "Бүтээгдэхүүн устгах"}
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
}
