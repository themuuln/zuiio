"use client";

import {
  ArrowLeft,
  ArrowRight,
  StackSimple,
} from "@phosphor-icons/react/dist/ssr";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteProduct,
  toggleProductPublication,
} from "@/app/(dashboard)/products/actions";
import {
  type ProductDetailData,
  ProductDetailDrawer,
} from "@/components/products/product-detail-drawer";
import {
  type ProductEditData,
  ProductEditDrawer,
} from "@/components/products/product-edit-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { TableActionsCell } from "@/components/ui/table-actions-cell";
import { useDeleteWithConfirm } from "@/hooks/use-delete-with-confirm";
import { formatCurrency } from "@/lib/format";
import { useBrands } from "@/lib/query/hooks/use-brands";
import { useProductVariants } from "@/lib/query/hooks/use-product-variants";
import { productKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  sale_price: number | null;
  cost_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  category_id: string | null;
  category_name: string | null;
  brand_id: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  image_url: string | null;
  has_variants: boolean | null;
  is_public: boolean | null;
};

function toEditData(product: ProductRow): ProductEditData {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    unit: product.unit,
    category_name: product.category_name,
    brand_id: product.brand_id,
    brand_name: product.brand_name,
    brand_logo_url: product.brand_logo_url,
    cost_price: product.cost_price,
    sale_price: product.sale_price,
    current_stock: product.current_stock,
    min_stock: product.min_stock,
    is_public: product.is_public,
  };
}

function ActionsCell({
  row,
  onEdit,
  onDelete,
  deletePending,
}: {
  row: { original: ProductRow };
  onEdit: (product: ProductRow) => void;
  onDelete: (id: string, name: string) => void;
  deletePending: boolean;
}) {
  const product = row.original;

  return (
    <TableActionsCell
      onEdit={() => onEdit(product)}
      onDelete={() => onDelete(product.id, product.name)}
      isDeletePending={deletePending}
    />
  );
}

export function ProductsTable({
  data,
  organizationId,
  loading,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
}: {
  data: ProductRow[];
  organizationId: string;
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}) {
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null,
  );
  const { data: selectedVariants } = useProductVariants(selectedProduct?.id);
  const { data: brands } = useBrands(organizationId ?? "");
  const [isPending, startTransition] = useTransition();

  const handleTogglePublication = useCallback(
    (productId: string, currentIsPublic: boolean) => {
      startTransition(async () => {
        const result = await toggleProductPublication(
          productId,
          !currentIsPublic,
        );
        if (result && "error" in result) {
          toast.error(result.error);
        } else {
          toast.success(
            currentIsPublic ? "Нийтлэлээс хэвлэлээ." : "Каталогт нийтлэгдлээ.",
          );
        }
      });
    },
    [],
  );

  const toDetailData = (product: ProductRow): ProductDetailData => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    unit: product.unit,
    category_name: product.category_name,
    cost_price: product.cost_price,
    sale_price: product.sale_price,
    current_stock: product.current_stock,
    min_stock: product.min_stock,
    image_url: product.image_url,
    variants:
      selectedVariants?.map((v) => ({
        id: v.id,
        sku: v.sku,
        sale_price: v.sale_price,
        current_stock: v.current_stock,
        option_labels: v.option_labels,
      })) ?? null,
  });

  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);

  const { handleDelete, isPending: deletePending } = useDeleteWithConfirm({
    mutationFn: async (id: string) => {
      const formData = new FormData();
      formData.set("id", id);
      const result = await deleteProduct(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
      return undefined;
    },
    queryKey: productKeys.all(),
    entityName: "Бүтээгдэхүүн",
  });

  const columns: ColumnDef<ProductRow>[] = useMemo(
    () => [
      {
        accessorKey: "image_url",
        header: "Зураг",
        cell: ({ row }) => {
          const url = row.original.image_url;
          return (
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
              {url ? (
                <OptimizedImage
                  src={url}
                  alt={row.original.name}
                  width={36}
                  height={36}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground/40">
                  {row.original.name.charAt(0)}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Нэр",
        filterFn: (row, _columnId, filterValue: string) => {
          const name = String(row.getValue("name") ?? "").toLowerCase();
          const sku = String(row.getValue("sku") ?? "").toLowerCase();
          const search = filterValue.toLowerCase();
          return name.includes(search) || sku.includes(search);
        },
        cell: ({ row }) => {
          return <span className="font-medium">{row.getValue("name")}</span>;
        },
      },
      {
        accessorKey: "brand_name",
        header: "Брэнд",
        cell: ({ row }) => {
          const brandLogoUrl = row.original.brand_logo_url;
          const brandName = row.original.brand_name;
          if (!brandName)
            return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex items-center gap-2">
              {brandLogoUrl ? (
                <OptimizedImage
                  src={brandLogoUrl}
                  alt={brandName}
                  width={20}
                  height={20}
                  className="size-5 rounded object-contain dark:invert"
                />
              ) : null}
              <span>{brandName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => row.getValue("sku") ?? "-",
      },
      {
        accessorKey: "unit",
        header: "Нэгж",
        cell: ({ row }) => row.getValue("unit") ?? "-",
      },
      {
        accessorKey: "sale_price",
        header: "Зарах үнэ",
        cell: ({ row }) =>
          formatCurrency(Number(row.getValue("sale_price") ?? 0)),
      },
      {
        accessorKey: "current_stock",
        header: "Одоогийн үлдэгдэл",
        cell: ({ row }) => {
          if (row.original.has_variants) {
            return <span className="text-muted-foreground">Вариант</span>;
          }
          return Number(row.getValue("current_stock") ?? 0).toFixed(2);
        },
      },
      {
        accessorKey: "min_stock",
        header: "Доод үлдэгдэл",
        cell: ({ row }) => Number(row.getValue("min_stock") ?? 0).toFixed(2),
      },
      {
        accessorKey: "category_name",
        header: "Ангилал",
        cell: ({ row }) => row.getValue("category_name") ?? "-",
      },
      {
        id: "has_variants",
        header: "Вариант",
        cell: ({ row }) => {
          if (!row.original.has_variants) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <Badge variant="secondary" className="gap-1">
              <StackSimple className="size-3" />
              Варианттай
            </Badge>
          );
        },
        enableSorting: false,
      },
      {
        id: "is_public",
        header: "Нийтлэл",
        cell: ({ row }) => {
          const isPublic = row.original.is_public ?? false;
          return (
            <Checkbox
              checked={isPublic}
              disabled={isPending}
              onCheckedChange={() =>
                handleTogglePublication(row.original.id, isPublic)
              }
              aria-label={isPublic ? "Нийтлэлээс хасах" : "Каталогт нийтлэх"}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },

      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionsCell
            row={row}
            onEdit={setEditProduct}
            onDelete={handleDelete}
            deletePending={deletePending}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, deletePending, isPending, handleTogglePublication],
  );

  const searchParams = useSearchParams();

  /** Build a page href that preserves existing search params */
  function buildPageHref(page: number): string {
    const sp = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      sp.delete("page");
    } else {
      sp.set("page", String(page));
    }
    const qs = sp.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) pages.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchColumn="name"
        searchPlaceholder="Нэр эсвэл SKU-аар хайх..."
        pageSize={10}
        totalLabel="бүтээгдэхүүн"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedProduct(row)}
        manualPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />

      {/* ── Server-side pagination nav ── */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-1">
          {currentPage > 1 && (
            <Link
              href={buildPageHref(currentPage - 1)}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "gap-1",
              )}
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Өмнөх</span>
            </Link>
          )}

          <div className="hidden items-center gap-1 sm:flex">
            {getPageNumbers().map((page) =>
              page === "ellipsis" ? (
                <span
                  key="ellipsis"
                  className="flex size-7 items-center justify-center text-xs text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <Link
                  key={page}
                  href={buildPageHref(page)}
                  className={cn(
                    buttonVariants({
                      variant: page === currentPage ? "default" : "outline",
                      size: "xs",
                    }),
                    "min-w-7",
                  )}
                >
                  {page}
                </Link>
              ),
            )}
          </div>

          <span className="text-xs text-muted-foreground sm:hidden">
            {currentPage}/{totalPages}
          </span>

          {currentPage < totalPages && (
            <Link
              href={buildPageHref(currentPage + 1)}
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "gap-1",
              )}
            >
              <span className="hidden sm:inline">Дараах</span>
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}

      <ProductDetailDrawer
        product={
          selectedProduct
            ? toDetailData(selectedProduct)
            : ({} as ProductDetailData)
        }
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
        onEdit={() => selectedProduct && setEditProduct(selectedProduct)}
        onDelete={() =>
          selectedProduct &&
          handleDelete(selectedProduct.id, selectedProduct.name)
        }
        isDeletePending={deletePending}
      />
      <ProductEditDrawer
        product={
          editProduct ? toEditData(editProduct) : ({} as ProductEditData)
        }
        brands={brands ?? []}
        open={!!editProduct}
        onOpenChange={(open) => {
          if (!open) setEditProduct(null);
        }}
      />
    </>
  );
}
