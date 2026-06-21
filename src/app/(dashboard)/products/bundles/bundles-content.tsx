"use client";

import { Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
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
import { deleteBundle } from "./actions";
import type { BundleRow } from "./page";

export function BundlesContent({ bundles }: { bundles: BundleRow[] }) {
  const [list, setList] = useState(bundles);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" багцыг устгах уу?`)) return;

    const result = await deleteBundle(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setList((prev) => prev.filter((b) => b.id !== id));
      toast.success("Багц устгагдлаа.");
    }
  };

  return (
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
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((bundle) => {
              const itemCount = bundle.product_bundle_items.length;
              return (
                <TableRow key={bundle.id}>
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
                    <Badge variant={bundle.is_active ? "default" : "secondary"}>
                      {bundle.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDelete(bundle.id, bundle.name)}
                    >
                      <Trash className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
