import { createRouteHandler, ok } from "@/lib/api-response";

export const GET = createRouteHandler(async ({ request, orgId, supabase }) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;
  const safetyBuffer = Number(searchParams.get("buffer")) || 0;

  // 1. Fetch balances + thresholds, join on part_id, filter where quantity <= minimum
  const { data: balances, error: balErr } = await supabase
    .from("inventory_balances")
    .select(
      `
      part_id,
      part_name,
      part_number,
      category,
      unit,
      quantity_on_hand,
      branch_id
    `,
    )
    .eq("organization_id", orgId);

  if (balErr) throw balErr;

  const { data: thresholds, error: thErr } = await supabase
    .from("stock_thresholds")
    .select("part_id, minimum_quantity, branch_id")
    .eq("organization_id", orgId);

  if (thErr) throw thErr;

  // Build threshold lookup (branch-specific or org-wide)
  const thresholdMap = new Map<string, number>();
  for (const th of thresholds ?? []) {
    const key =
      branchId && th.branch_id ? `${th.part_id}:${th.branch_id}` : th.part_id;
    // Prefer branch-specific threshold, fall back to org-wide (branch_id null)
    if (!thresholdMap.has(key) || th.branch_id === null) {
      thresholdMap.set(key, th.minimum_quantity);
    }
  }

  // Filter to parts needing reorder
  const needReorder: Array<{
    part_id: string;
    part_name: string;
    part_number: string | null;
    category: string | null;
    unit: string | null;
    quantity_on_hand: number;
    minimum_quantity: number;
    shortage: number;
    suggested_order_qty: number;
  }> = [];

  for (const b of balances ?? []) {
    const key =
      branchId && b.branch_id ? `${b.part_id}:${b.branch_id}` : b.part_id;
    const min = thresholdMap.get(key);
    if (min === undefined) continue;

    const qoh = b.quantity_on_hand ?? 0;
    if (qoh <= min) {
      const shortage = min - qoh;
      needReorder.push({
        part_id: b.part_id,
        part_name: b.part_name,
        part_number: b.part_number,
        category: b.category,
        unit: b.unit,
        quantity_on_hand: qoh,
        minimum_quantity: min,
        shortage,
        suggested_order_qty: shortage + safetyBuffer,
      });
    }
  }

  // 2. Fetch preferred supplier for each part that needs reorder
  const partIds = needReorder.map((r) => r.part_id);
  const supplierMap = new Map<string, { name: string }>();

  if (partIds.length > 0) {
    const { data: spData } = await supabase
      .from("supplier_parts")
      .select("part_id, suppliers!inner(id, name)")
      .eq("organization_id", orgId)
      .eq("is_preferred", true)
      .in("part_id", partIds);

    for (const sp of spData ?? []) {
      const supplier = sp.suppliers as unknown as { name: string } | null;
      if (supplier) {
        supplierMap.set(sp.part_id, { name: supplier.name });
      }
    }

    // If no preferred supplier found, fetch any supplier for the part
    const partsWithoutPreferred = partIds.filter((id) => !supplierMap.has(id));
    if (partsWithoutPreferred.length > 0) {
      const { data: anySpData } = await supabase
        .from("supplier_parts")
        .select("part_id, suppliers!inner(id, name)")
        .eq("organization_id", orgId)
        .in("part_id", partsWithoutPreferred)
        .limit(1);

      for (const sp of anySpData ?? []) {
        const supplier = sp.suppliers as unknown as { name: string } | null;
        if (supplier && !supplierMap.has(sp.part_id)) {
          supplierMap.set(sp.part_id, { name: supplier.name });
        }
      }
    }
  }

  // Merge supplier info
  const results = needReorder.map((item) => ({
    ...item,
    preferred_supplier: supplierMap.get(item.part_id)?.name ?? null,
  }));

  return ok(results);
});
