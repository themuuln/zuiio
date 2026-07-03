"use client";

import { Eye, NotePencil } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type ProductDetailData,
  ProductDetailDrawer,
} from "@/components/products/product-detail-drawer";
import {
  type ProductEditData,
  ProductEditDrawer,
} from "@/components/products/product-edit-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";

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
  image_url: string | null;
  image_urls: string[] | null;
  category_name: string | null;
  is_low: boolean;
};

function toDetailData(product: ProductRow): ProductDetailData {
  return {
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
    image_urls: product.image_urls,
  };
}

function toEditData(product: ProductRow): ProductEditData {
  return {
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
  };
}

function ActionsCell({ row }: { row: { original: ProductRow } }) {
  const product = row.original;
  return (
    <div className="flex items-center gap-1">
      <ProductDetailDrawer product={toDetailData(product)}>
        <Button variant="ghost" size="icon-xs">
          <Eye className="size-3.5" />
        </Button>
      </ProductDetailDrawer>
      <ProductEditDrawer product={toEditData(product)}>
        <Button variant="ghost" size="icon-xs">
          <NotePencil className="size-3.5" />
        </Button>
      </ProductEditDrawer>
    </div>
  );
}

const defaultColumns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: "Нэр",
    cell: ({ row }) => {
      const images = row.original.image_urls?.length
        ? row.original.image_urls
        : row.original.image_url
          ? [row.original.image_url]
          : [];
      const thumbnail = images[0];
      return (
        <div className="flex items-center gap-2">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="size-8 rounded-md object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground/30 font-bold">
              {row.original.name.charAt(0)}
            </div>
          )}
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "category_name",
    header: "Ангилал",
    cell: ({ row }) => row.getValue("category_name") ?? "Ангилаагүй",
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => row.getValue("sku") ?? "-",
  },
  {
    accessorKey: "sale_price",
    header: "Үнэ",
    cell: ({ row }) => formatCurrency(Number(row.getValue("sale_price") ?? 0)),
  },
  {
    id: "current_stock",
    accessorKey: "current_stock",
    header: "Үлдэгдэл",
    cell: ({ row }) =>
      `${row.getValue("current_stock") ?? 0} ${row.original.unit ?? "ширхэг"}`,
  },
  {
    accessorKey: "is_low",
    header: "Төлөв",
    cell: ({ row }) => {
      const isLow = row.getValue("is_low");
      return (
        <Badge variant={isLow ? "destructive" : "secondary"}>
          {isLow ? "Анхаарах" : "Хэвийн"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ActionsCell,
    enableSorting: false,
    enableHiding: false,
  },
];

export function ProductsTable({ data }: { data: ProductRow[] }) {
  return (
    <DataTable
      columns={defaultColumns}
      data={data}
      searchColumn="name"
      searchPlaceholder="Бүтээгдэхүүнээр хайх..."
      pageSize={10}
      totalLabel="бүтээгдэхүүн"
    />
  );
}
