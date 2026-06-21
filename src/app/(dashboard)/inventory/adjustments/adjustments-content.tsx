"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export interface AdjustmentBatchRow {
  batch_id: string;
  created_at: string;
  item_count: number;
  total_quantity: number;
  notes: string | null;
  created_by_name: string | null;
}

export function AdjustmentsContent({
  batches,
}: {
  batches: AdjustmentBatchRow[];
}) {
  if (batches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тохируулгын түүх</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 pb-6 pt-2">
            <p className="text-sm text-muted-foreground">
              Тохируулга бүртгэгдээгүй байна.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохируулгын түүх</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Огноо</TableHead>
              <TableHead>Барааны тоо</TableHead>
              <TableHead>Нийт тохируулга</TableHead>
              <TableHead>Тайлбар</TableHead>
              <TableHead>Бүртгэсэн</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.batch_id}>
                <TableCell>{formatDate(batch.created_at)}</TableCell>
                <TableCell>{batch.item_count}</TableCell>
                <TableCell>
                  {batch.total_quantity > 0 ? "+" : ""}
                  {batch.total_quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {batch.notes ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {batch.created_by_name ?? "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
