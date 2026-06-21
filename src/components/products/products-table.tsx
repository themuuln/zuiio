"use client";

import { NotePencil, Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { deleteProduct } from "@/app/(dashboard)/products/actions";
import {
  type ProductDetailData,
  ProductDetailDrawer,
} from "@/components/products/product-detail-drawer";
import {
  type ProductEditData,
  ProductEditDrawer,
} from "@/components/products/product-edit-drawer";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";
import { useBrands } from "@/lib/query/hooks/use-brands";
import { useProductVariants } from "@/lib/query/hooks/use-product-variants";
import { productKeys } from "@/lib/query/keys";
import { useOptimisticDelete } from "@/lib/query/use-optimistic";

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
  };
}

function ActionsCell({
  row,
  brands,
}: {
  row: { original: ProductRow };
  brands?: { id: string; name: string; logo_url: string | null }[];
}) {
  const product = row.original;

  const deleteMutation = useOptimisticDelete({
    mutationFn: async (formData: FormData) => {
      const result = await deleteProduct(undefined, formData);
      if (result?.error) throw new Error(result.error);
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
      onSuccess: () => toast.success("Бүтээгдэхүүн амжилттай устгагдлаа."),
    });
  };

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <ProductEditDrawer product={toEditData(product)} brands={brands ?? []}>
        <span className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <NotePencil className="size-3.5" />
        </span>
      </ProductEditDrawer>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
        title="Устгах"
      >
        <Trash className="size-3.5" />
      </button>
    </div>
  );
}

export function ProductsTable({
  data,
  organizationId,
}: {
  data: ProductRow[];
  organizationId: string;
}) {
  const { data: brands } = useBrands(organizationId);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null,
  );
  const { data: selectedVariants } = useProductVariants(selectedProduct?.id);

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
                <img
                  src={url}
                  alt={row.original.name}
                  loading="lazy"
                  decoding="async"
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
                <img
                  src={brandLogoUrl}
                  alt={brandName}
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
        cell: ({ row }) =>
          Number(row.getValue("current_stock") ?? 0).toFixed(2),
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
        id: "actions",
        header: "",
        cell: ({ row }) => <ActionsCell row={row} brands={brands ?? []} />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [brands],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="name"
        searchPlaceholder="Нэр эсвэл SKU-аар хайх..."
        pageSize={10}
        totalLabel="бүтээгдэхүүн"
        enableSorting
        enableColumnVisibility
        onRowClick={(row) => setSelectedProduct(row)}
      />
      {selectedProduct && (
        <ProductDetailDrawer
          product={toDetailData(selectedProduct)}
          open={!!selectedProduct}
          onOpenChange={(open) => {
            if (!open) setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
}
