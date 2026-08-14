"use client";

import { ShoppingCart } from "@phosphor-icons/react";
import { useState } from "react";
import { RestockDrawer } from "@/components/inventory/restock-drawer";
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

interface LowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  category_name: string | null;
  current_stock: number | null;
  min_stock: number | null;
  unit: string | null;
  cost_price: number | null;
}

interface SupplierOption {
  id: string;
  name: string;
  phone: string | null;
}

export function LowStockSection({
  products,
  suppliers,
}: {
  products: LowStockProduct[];
  suppliers: SupplierOption[];
}) {
  const [restockTarget, setRestockTarget] = useState<LowStockProduct | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRestock = (product: LowStockProduct) => {
    setRestockTarget(product);
    setDrawerOpen(true);
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Бага нөөцтэй бүтээгдэхүүн</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6 pt-2">
            <p className="text-sm text-muted-foreground">
              Бүх бүтээгдэхүүний нөөц хангалттай байна.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Бага нөөцтэй бүтээгдэхүүн</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бүтээгдэхүүн</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead className="text-right">Одоогийн нөөц</TableHead>
                <TableHead className="text-right">Минимум нөөц</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category_name ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {product.current_stock?.toLocaleString() ?? 0}{" "}
                    {product.unit ?? "ширхэг"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {product.min_stock?.toLocaleString() ?? 0}{" "}
                    {product.unit ?? "ширхэг"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">Бага нөөц</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => handleRestock(product)}
                    >
                      <ShoppingCart className="mr-1.5 size-3.5" />
                      Захиалах
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RestockDrawer
        product={
          restockTarget
            ? {
                id: restockTarget.id,
                name: restockTarget.name,
                sku: restockTarget.sku,
                unit: restockTarget.unit ?? "ширхэг",
                current_stock: restockTarget.current_stock,
                min_stock: restockTarget.min_stock,
                cost_price: restockTarget.cost_price,
              }
            : null
        }
        suppliers={suppliers}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
