"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";
import { useState } from "react";
import { ErpDataTable } from "@/components/erp/data-table";
import {
  type MovementDetailData,
  MovementDetailDrawer,
} from "@/components/inventory/movement-detail-drawer";
import { Badge } from "@/components/ui/badge";
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

  return (
    <>
      <ErpDataTable
        title="Сүүлийн бүртгэлүүд"
        columns={[
          {
            header: "Огноо",
            accessor: (m: MovementRow) => formatDate(m.created_at),
          },
          {
            header: "Бүтээгдэхүүн",
            accessor: (m: MovementRow) => (
              <span className="font-medium">{m.product_name}</span>
            ),
          },
          {
            header: "Төрөл",
            accessor: (m: MovementRow) => (
              <Badge variant={m.type === "out" ? "destructive" : "secondary"}>
                {MOVEMENT_LABELS[m.type] ?? m.type}
              </Badge>
            ),
          },
          {
            header: "Тоо хэмжээ",
            accessor: (m: MovementRow) =>
              `${m.quantity} ${m.product_unit ?? "ширхэг"}`,
          },
          {
            header: "Өртөг",
            accessor: (m: MovementRow) =>
              formatCurrency(Number(m.unit_cost ?? 0)),
          },
          {
            header: "Лавлагаа",
            accessor: (m: MovementRow) =>
              m.reference ??
              m.notes ?? <span className="text-muted-foreground">-</span>,
          },
        ]}
        data={movements}
        onRowClick={(m) => setSelectedMovement(m)}
        keyExtractor={(m) => m.id}
        emptyState={{
          icon: <ArrowsClockwise className="size-4" />,
          title: "Хөдөлгөөн бүртгэгдээгүй байна",
          description:
            "Шинэ худалдан авалт, борлуулалт эсвэл тооллогын дараах тохируулга энд харагдана.",
        }}
      />
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
