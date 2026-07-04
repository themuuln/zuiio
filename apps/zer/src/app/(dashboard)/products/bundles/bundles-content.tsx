"use client";

import { Trash } from "@phosphor-icons/react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Бүх багцууд</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Барааны тоо</TableHead>
                <TableHead>Өртөг</TableHead>
                <TableHead>Борлуулалтын үнэ</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((bundle) => {
                const itemCount = bundle.product_bundle_items.length;
                return (
                  <TableRow
                    key={bundle.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedBundle(bundle)}
                  >
                    <TableCell className="font-medium">
                      {bundle.name}
                      {bundle.description && (
                        <p className="text-xs text-muted-foreground">
                          {bundle.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {bundle.sku ?? "-"}
                    </TableCell>
                    <TableCell>{itemCount} бараа</TableCell>
                    <TableCell>
                      {bundle.cost_price
                        ? formatCurrency(bundle.cost_price)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {bundle.sale_price
                        ? formatCurrency(bundle.sale_price)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={bundle.is_active ? "default" : "secondary"}
                      >
                        {bundle.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper only for stopPropagation */}
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper only for stopPropagation; actual interactive element inside */}
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <BundleEditDrawer
                          bundle={toEditData(bundle)}
                          products={products}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleDelete(bundle.id, bundle.name)}
                          title="Устгах"
                        >
                          <Trash className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedBundle && (
        <BundleDetailDrawer
          bundle={toDetailData(selectedBundle)}
          open={!!selectedBundle}
          onOpenChange={(open) => {
            if (!open) setSelectedBundle(null);
          }}
        />
      )}
    </>
  );
}
