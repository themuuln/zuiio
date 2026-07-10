"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ErpDataTable } from "@/components/erp/data-table";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useOrgSettings } from "@/lib/org-settings-context";
import { withDbCapture } from "@zuiio/capture";
import { formatDate } from "@/lib/format";

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
  const isLoading = query.isLoading || query.isFetching;

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
      <ErpDataTable<AdjustmentBatchRow>
        title="Тохируулгын түүх"
        columns={[
          {
            header: "Огноо",
            accessor: (row) => formatDate(row.created_at),
          },
          { header: "Барааны тоо", accessor: "item_count" },
          {
            header: "Нийт тохируулга",
            accessor: (row) =>
              (row.total_quantity > 0 ? "+" : "") +
              row.total_quantity.toLocaleString(),
          },
          {
            header: "Тайлбар",
            accessor: (row) => row.notes ?? "-",
          },
          {
            header: "Бүртгэсэн",
            accessor: (row) => row.created_by_name ?? "-",
          },
        ]}
        data={data}
        loading={isLoading}
        keyExtractor={(row) => row.batch_id}
        emptyState={{
          title: "Тохируулга бүртгэгдээгүй",
          description: "Тохируулгын түүх хоосон байна.",
        }}
      />
    </PageShell>
  );
}
