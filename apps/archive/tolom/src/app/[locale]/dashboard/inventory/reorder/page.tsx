"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PackagePlus, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ListPageShell } from "@/components/list-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import type { TableFeatures } from "@/components/ui/data-table-features";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@/lib/i18n/navigation";
import { useReorderSuggestions } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";

export default function ReorderPage() {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const { data: suggestions = [], isPending } = useReorderSuggestions(
    orgId,
    branchFilter,
  );

  const sorted = useMemo(
    () => [...suggestions].sort((a, b) => b.shortage - a.shortage),
    [suggestions],
  );

  const columns = useMemo<
    ColumnDef<TableFeatures, (typeof suggestions)[number]>[]
  >(
    () => [
      {
        accessorKey: "part_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("part")} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.original.part_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.part_number ?? "—"} · {row.original.category ?? "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "quantity_on_hand",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("stockLevel")} />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.quantity_on_hand} / {row.original.minimum_quantity}{" "}
            {row.original.unit ?? ""}
          </span>
        ),
      },
      {
        accessorKey: "shortage",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("shortage")} />
        ),
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-destructive tabular-nums">
            -{row.original.shortage}
          </span>
        ),
      },
      {
        accessorKey: "suggested_order_qty",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("suggestedOrderQty")}
          />
        ),
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">
            {row.original.suggested_order_qty}
          </span>
        ),
      },
      {
        accessorKey: "preferred_supplier",
        header: t("preferredSupplier"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.preferred_supplier ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: () => (
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/dashboard/inventory/purchase-orders/new" />}
          >
            <PackagePlus className="size-3" /> {t("createPO")}
          </Button>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <ListPageShell
        title={t("reorderTitle")}
        description={t("reorderSubtitle")}
      >
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={sorted}
              getRowId={(row) => row.part_id}
              pageSize={20}
              loading={isPending}
              insideCard
              defaultSorting={[{ id: "shortage", desc: true }]}
              emptyState={
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingCart />
                    </EmptyMedia>
                    <EmptyTitle>{t("noReorderItems")}</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              }
            />
          </CardContent>
        </Card>
      </ListPageShell>
    </div>
  );
}
