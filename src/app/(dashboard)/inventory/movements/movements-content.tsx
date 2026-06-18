"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";
import { useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import {
  type MovementDetailData,
  MovementDetailDrawer,
} from "@/components/inventory/movement-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Орлого",
  out: "Зарлага",
  adjustment: "Тохируулга",
};

export type MovementRow = {
  id: string;
  type: string;
  quantity: number;
  unit_cost: number | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  product_name: string;
  product_unit: string | null;
  product_sku: string | null;
};

export function MovementsContent({ movements }: { movements: MovementRow[] }) {
  const [selectedMovement, setSelectedMovement] = useState<MovementRow | null>(
    null,
  );

  function toDetailData(m: MovementRow): MovementDetailData {
    return {
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      unit_cost: m.unit_cost,
      reference: m.reference,
      notes: m.notes,
      created_at: m.created_at,
      product_name: m.product_name,
      product_unit: m.product_unit,
      product_sku: m.product_sku,
    };
  }

  if (!movements.length) {
    return (
      <ErpEmptyState
        icon={<ArrowsClockwise className="size-4" />}
        title="Хөдөлгөөн бүртгэгдээгүй байна"
        description="Шинэ худалдан авалт, борлуулалт эсвэл тооллогын дараах тохируулга энд харагдана."
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Сүүлийн бүртгэлүүд</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Огноо</TableHead>
                <TableHead>Бүтээгдэхүүн</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Тоо хэмжээ</TableHead>
                <TableHead>Өртөг</TableHead>
                <TableHead>Лавлагаа</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow
                  key={movement.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedMovement(movement)}
                >
                  <TableCell>{formatDate(movement.created_at)}</TableCell>
                  <TableCell className="font-medium">
                    {movement.product_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        movement.type === "out" ? "destructive" : "secondary"
                      }
                    >
                      {MOVEMENT_LABELS[movement.type] ?? movement.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {movement.quantity} {movement.product_unit ?? "ширхэг"}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(Number(movement.unit_cost ?? 0))}
                  </TableCell>
                  <TableCell>
                    {movement.reference ?? movement.notes ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedMovement && (
        <MovementDetailDrawer
          movement={toDetailData(selectedMovement)}
          open={!!selectedMovement}
          onOpenChange={(open) => {
            if (!open) setSelectedMovement(null);
          }}
        />
      )}
    </>
  );
}
