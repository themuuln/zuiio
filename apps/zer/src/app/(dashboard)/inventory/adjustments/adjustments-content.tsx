"use client";

import { Plus } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { withDbCapture } from "@zuiio/capture";
import Link from "next/link";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { dateColumn, textColumn } from "@/lib/table-columns";

export type AdjustmentBatchRow = {
  batch_id: string;
  created_at: string;
  item_count: number;
  total_quantity: number;
  notes: string | null;
  created_by_name: string | null;
};

export function AdjustmentsContent() {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["adjustments", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: movements } = await withDbCapture(
        "page:adjustments",
        supabase
          .from("stock_movements")
          .select(
            "reference, created_at, quantity, notes, created_by, profiles!stock_movements_created_by_fkey(full_name)",
          )
          .eq("organization_id", organizationId)
          .eq("type", "adjustment")
          .not("reference", "is", null)
          .order("created_at", { ascending: false }),
      );

      const batchMap = new Map<
        string,
        {
          created_at: string;
          items: { quantity: number }[];
          notes: string | null;
          created_by_name: string | null;
        }
      >();

      for (const m of movements ?? []) {
        const ref = m.reference ?? "";
        if (!batchMap.has(ref)) {
          batchMap.set(ref, {
            created_at: m.created_at ?? new Date().toISOString(),
            items: [],
            notes: m.notes,
            created_by_name:
              (m.profiles as { full_name: string } | null)?.full_name ?? null,
          });
        }
        batchMap.get(ref)?.items.push({ quantity: m.quantity });
      }

      const batches: AdjustmentBatchRow[] = [];
      for (const [reference, data] of batchMap) {
        batches.push({
          batch_id: reference.replace("batch:", ""),
          created_at: data.created_at,
          item_count: data.items.length,
          total_quantity: data.items.reduce((s, i) => s + i.quantity, 0),
          notes: data.notes,
          created_by_name: data.created_by_name,
        });
      }

      return batches;
    },
    enabled: !!organizationId,
  });

  const data = query.data ?? [];
  const isPending = query.isPending;
  const columns: ColumnDef<AdjustmentBatchRow>[] = [
    dateColumn("created_at", "Огноо"),
    textColumn("item_count", "Барааны тоо"),
    {
      accessorKey: "total_quantity",
      header: "Нийт тохируулга",
      cell: ({ row }) => {
        const v = row.getValue<number>("total_quantity");
        return (v > 0 ? "+" : "") + v.toLocaleString();
      },
    },
    textColumn("notes", "Тайлбар"),
    textColumn("created_by_name", "Бүртгэсэн"),
  ];

  if (data.length === 0 && !isPending) {
    return (
      <PageShell
        title="Барааны тохируулга"
        description="Бөөнөөр барааны үлдэгдэл тохируулах, тохируулгын түүх"
        actions={
          <Button asChild size="sm">
            <Link href="/inventory/adjustments/new">
              <Plus data-icon="inline-start" />
              Шинэ тохируулга
            </Link>
          </Button>
        }
      >
        <ErpEmptyState
          title="Тохируулга бүртгэгдээгүй"
          description="Тохируулгын түүх хоосон байна."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Барааны тохируулга"
      description="Бөөнөөр барааны үлдэгдэл тохируулах, тохируулгын түүх"
      actions={
        <Button asChild size="sm">
          <Link href="/inventory/adjustments/new">
            <Plus data-icon="inline-start" />
            Шинэ тохируулга
          </Link>
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={data}
        loading={isPending}
        searchColumn="created_by_name"
        searchPlaceholder="Хайх..."
        pageSize={10}
        totalLabel="тохируулга"
        enableSorting
        enableColumnVisibility
      />
    </PageShell>
  );
}
