import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import {
  type AdjustmentBatchRow,
  AdjustmentsContent,
} from "./adjustments-content";



export default async function AdjustmentsPage() {
  const { supabase, organizationId } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_inventory")))
    redirect("/");

  // Get all adjustment stock movements (grouped by reference which contains batch:xxx)
  const { data: movements } = await supabase
    .from("stock_movements")
    .select(
      "reference, created_at, quantity, notes, created_by, profiles!stock_movements_created_by_fkey(full_name)",
    )
    .eq("organization_id", organizationId)
    .eq("type", "adjustment")
    .not("reference", "is", null)
    .order("created_at", { ascending: false });

  // Group by reference (which is batch:{batchId})
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
    const ref = m.reference!;
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
      <AdjustmentsContent batches={batches} />
    </PageShell>
  );
}
