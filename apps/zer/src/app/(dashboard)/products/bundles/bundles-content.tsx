"use client";

import { Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  type BundleDetailData,
  BundleDetailDrawer,
} from "@/components/products/bundle-detail-drawer";
import {
  type BundleEditData,
  BundleEditDrawer,
} from "@/components/products/bundle-edit-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";
import { bundleKeys } from "@/lib/query/keys";
import { deleteBundle } from "./actions";
import type { BundleRow, SimpleProductOption } from "./types";

function toDetailData(bundle: BundleRow): BundleDetailData {
  return {
    id: bundle.id,
    name: bundle.name,
    sku: bundle.sku,
    sale_price: bundle.sale_price,
    cost_price: bundle.cost_price,
    description: bundle.description,
    is_active: bundle.is_active,
    created_at: bundle.created_at,
    items: bundle.product_bundle_items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      products: item.products,
    })),
  };
}

function toEditData(bundle: BundleRow): BundleEditData {
  return {
    id: bundle.id,
    name: bundle.name,
    sku: bundle.sku,
    sale_price: bundle.sale_price,
    description: bundle.description,
    items: bundle.product_bundle_items.map((item) => ({
      product_id: item.product_id ?? "",
      quantity: item.quantity,
    })),
  };
}

export function BundlesContent({
  bundles,
  products = [],
}: {
  bundles: BundleRow[];
  products?: SimpleProductOption[];
}) {
  const [list, setList] = useState(bundles);
  const [selectedBundle, setSelectedBundle] = useState<BundleRow | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBundle(id);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_data, id) => {
      setList((prev) => prev.filter((b) => b.id !== id));
      queryClient.invalidateQueries({ queryKey: bundleKeys.all() });
      toast.success("Багц устгагдлаа.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (deleteMutation.isPending) return;
    if (!confirm(`"${name}" багцыг устгах уу?`)) return;
    deleteMutation.mutate(id);
  };

  const columns: ColumnDef<BundleRow>[] = [
    {
      accessorKey: "name",
      header: "Нэр",
      cell: ({ row }) => {
        const bundle = row.original;
        return (
          <div className="font-medium">
            {bundle.name}
            {bundle.description && (
              <p className="text-xs text-muted-foreground">
                {bundle.description}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.sku ?? "-"}
        </span>
      ),
    },
    {
      id: "itemCount",
      header: "Барааны тоо",
      accessorFn: (row) => row.product_bundle_items.length,
      cell: ({ row }) => `${row.original.product_bundle_items.length} бараа`,
    },
    {
      accessorKey: "cost_price",
      header: "Өртөг",
      cell: ({ row }) =>
        row.original.cost_price
          ? formatCurrency(row.original.cost_price)
          : "-",
    },
    {
      accessorKey: "sale_price",
      header: "Борлуулалтын үнэ",
      cell: ({ row }) =>
        row.original.sale_price
          ? formatCurrency(row.original.sale_price)
          : "-",
    },
    {
      accessorKey: "is_active",
      header: "Төлөв",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const bundle = row.original;
        return (
          <div className="flex items-center gap-1">
            <BundleEditDrawer
              bundle={toEditData(bundle)}
              products={products}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(bundle.id, bundle.name);
              }}
              title="Устгах"
            >
              <Trash className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (list.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Багц байхгүй байна
          </p>
          <p className="text-sm text-muted-foreground">
            Шинэ багц нэмнэ үү.
          </p>
        </div>
        <BundleDetailDrawer
          bundle={
            selectedBundle
              ? toDetailData(selectedBundle)
              : ({} as BundleDetailData)
          }
          open={!!selectedBundle}
          onOpenChange={(open) => {
            if (!open) setSelectedBundle(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={list}
        searchColumn="name"
        searchPlaceholder="Багц хайх..."
        totalLabel="багц"
        enableSorting
        enableColumnVisibility
        onRowClick={(bundle) => setSelectedBundle(bundle)}
      />
      <BundleDetailDrawer
        bundle={
          selectedBundle
            ? toDetailData(selectedBundle)
            : ({} as BundleDetailData)
        }
        open={!!selectedBundle}
        onOpenChange={(open) => {
          if (!open) setSelectedBundle(null);
        }}
      />
    </>
  );
}
