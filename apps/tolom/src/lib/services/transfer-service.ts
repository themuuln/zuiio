import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CreateTransferParams,
  PaginatedResponse,
  StockTransfer,
  StockTransferItem,
} from "@/lib/types";

// ── List Transfers ────────────────────────────────────────────

export async function getTransfers(
  db: SupabaseClient,
  orgId: string,
  options?: {
    status?: string | null;
    branchId?: string | null;
    page?: number;
    pageSize?: number;
  },
): Promise<PaginatedResponse<StockTransfer>> {
  const supabase = db;
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("stock_transfers")
    .select(
      `
        *,
        from_branch:branches!stock_transfers_from_branch_id_fkey(name),
        to_branch:branches!stock_transfers_to_branch_id_fkey(name),
        creator:profiles!stock_transfers_created_by_fkey(full_name),
        items:stock_transfer_items(count)
      `,
      { count: "exact" },
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  // Filter by from OR to branch
  if (options?.branchId) {
    query = query.or(
      `from_branch_id.eq.${options.branchId},to_branch_id.eq.${options.branchId}`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const mapped = (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    from_branch_name: (t.from_branch as { name: string } | null)?.name ?? null,
    to_branch_name: (t.to_branch as { name: string } | null)?.name ?? "Unknown",
    created_by_name:
      (t.creator as { full_name: string } | null)?.full_name ?? null,
    item_count: Array.isArray(t.items) ? t.items.length : 0,
    from_branch: undefined,
    to_branch: undefined,
    creator: undefined,
    items: undefined,
  })) as unknown as StockTransfer[];

  return {
    data: mapped,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ── Get Transfer Detail ───────────────────────────────────────

export async function getTransfer(
  db: SupabaseClient,
  transferId: string,
  orgId: string,
): Promise<StockTransfer> {
  const supabase = db;
  const { data, error } = await supabase
    .from("stock_transfers")
    .select(
      `
        *,
        from_branch:branches!stock_transfers_from_branch_id_fkey(name),
        to_branch:branches!stock_transfers_to_branch_id_fkey(name),
        creator:profiles!stock_transfers_created_by_fkey(full_name),
        items:stock_transfer_items(
          *,
          part:parts_catalog(name, part_number, unit)
        )
      `,
    )
    .eq("id", transferId)
    .eq("organization_id", orgId)
    .single();

  if (error || !data) throw new NotFoundError("Transfer not found");

  const items = ((data.items as Record<string, unknown>[]) ?? []).map(
    (item: Record<string, unknown>) => ({
      ...item,
      part_name: (item.part as { name: string } | null)?.name ?? "Unknown",
      part_number:
        (item.part as { part_number: string | null } | null)?.part_number ??
        null,
      unit: (item.part as { unit: string } | null)?.unit ?? "pcs",
      part: undefined,
    }),
  );

  return {
    ...data,
    from_branch_name:
      (data.from_branch as { name: string } | null)?.name ?? null,
    to_branch_name:
      (data.to_branch as { name: string } | null)?.name ?? "Unknown",
    created_by_name:
      (data.creator as { full_name: string } | null)?.full_name ?? null,
    items: items as unknown as StockTransferItem[],
    from_branch: undefined,
    to_branch: undefined,
    creator: undefined,
  } as unknown as StockTransfer;
}

// ── Create Transfer ───────────────────────────────────────────

export async function createTransfer(
  db: SupabaseClient,
  orgId: string,
  params: CreateTransferParams,
  userId: string,
): Promise<StockTransfer> {
  if (!params.to_branch_id)
    throw new ValidationError("Destination branch is required");
  if (!params.items?.length)
    throw new ValidationError("At least one item is required");

  // Validate quantities
  for (const item of params.items) {
    if (!item.part_id)
      throw new ValidationError("Part is required for each item");
    if (!item.quantity || item.quantity <= 0)
      throw new ValidationError("Quantity must be positive");
  }

  const supabase = db;

  const { data: transfer, error: transferError } = await supabase
    .from("stock_transfers")
    .insert({
      organization_id: orgId,
      from_branch_id: params.from_branch_id || null,
      to_branch_id: params.to_branch_id,
      status: "pending",
      notes: params.notes?.trim() || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (transferError || !transfer)
    throw new Error(transferError?.message ?? "Failed to create transfer");

  // Insert items
  const items = params.items.map((item) => ({
    transfer_id: transfer.id,
    part_id: item.part_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("stock_transfer_items")
    .insert(items);

  if (itemsError)
    throw new Error(itemsError.message ?? "Failed to add transfer items");

  revalidateTag(cacheTags.stockTransfers(orgId), "max");

  // Return the full transfer
  return getTransfer(db, transfer.id, orgId);
}

// ── Approve Transfer ──────────────────────────────────────────
// Validates stock, then marks approved. Movements are created on receive.

export async function approveTransfer(
  db: SupabaseClient,
  transferId: string,
  orgId: string,
  userId: string,
): Promise<StockTransfer> {
  const supabase = db;

  const { data: transfer, error: fetchError } = await supabase
    .from("stock_transfers")
    .select("*, items:stock_transfer_items(*)")
    .eq("id", transferId)
    .eq("organization_id", orgId)
    .single();

  if (fetchError || !transfer) throw new NotFoundError("Transfer not found");
  if (transfer.status !== "pending")
    throw new ValidationError("Only pending transfers can be approved");

  // Validate stock availability at source branch (if from_branch is set)
  if (transfer.from_branch_id) {
    const items = transfer.items as Array<{
      part_id: string;
      quantity: number;
    }>;

    for (const item of items) {
      const { data: balance } = await supabase
        .from("inventory_balances")
        .select("quantity_on_hand")
        .eq("organization_id", orgId)
        .eq("branch_id", transfer.from_branch_id)
        .eq("part_id", item.part_id)
        .single();

      const available = balance?.quantity_on_hand ?? 0;
      if (available < item.quantity) {
        throw new ValidationError(
          `Insufficient stock: need ${item.quantity}, have ${available} at source branch`,
        );
      }
    }
  }

  const { error } = await supabase
    .from("stock_transfers")
    .update({
      status: "approved",
      approved_by: userId,
    })
    .eq("id", transferId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "stock_transfers",
    record_id: transferId,
    user_id: userId,
    organization_id: orgId,
    new_data: { status: "approved" },
  });

  revalidateTag(cacheTags.stockTransfers(orgId), "max");
  return getTransfer(db, transferId, orgId);
}

// ── Mark In Transit ───────────────────────────────────────────

export async function markInTransit(
  db: SupabaseClient,
  transferId: string,
  orgId: string,
  userId: string,
): Promise<StockTransfer> {
  const supabase = db;

  const { data: transfer, error: fetchError } = await supabase
    .from("stock_transfers")
    .select("status")
    .eq("id", transferId)
    .eq("organization_id", orgId)
    .single();

  if (fetchError || !transfer) throw new NotFoundError("Transfer not found");
  if (transfer.status !== "approved")
    throw new ValidationError(
      "Only approved transfers can be marked in transit",
    );

  const { error } = await supabase
    .from("stock_transfers")
    .update({ status: "in_transit" })
    .eq("id", transferId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "stock_transfers",
    record_id: transferId,
    user_id: userId,
    organization_id: orgId,
    new_data: { status: "in_transit" },
  });

  revalidateTag(cacheTags.stockTransfers(orgId), "max");
  return getTransfer(db, transferId, orgId);
}

// ── Receive Transfer ──────────────────────────────────────────
// Creates transfer_out movements at source + transfer_in at destination.

export async function receiveTransfer(
  db: SupabaseClient,
  transferId: string,
  orgId: string,
  userId: string,
): Promise<StockTransfer> {
  const supabase = db;

  const { data: transfer, error: fetchError } = await supabase
    .from("stock_transfers")
    .select("*, items:stock_transfer_items(*)")
    .eq("id", transferId)
    .eq("organization_id", orgId)
    .single();

  if (fetchError || !transfer) throw new NotFoundError("Transfer not found");
  if (!["approved", "in_transit"].includes(transfer.status))
    throw new ValidationError(
      "Only approved or in-transit transfers can be received",
    );

  const items = transfer.items as Array<{
    part_id: string;
    quantity: number;
    unit_cost: number | null;
  }>;

  // Create transfer_out movements at source branch
  if (transfer.from_branch_id) {
    for (const item of items) {
      await supabase.from("inventory_movements").insert({
        organization_id: orgId,
        branch_id: transfer.from_branch_id,
        part_id: item.part_id,
        movement_type: "transfer_out",
        quantity: -item.quantity,
        unit_cost: item.unit_cost,
        reference_type: "stock_transfer",
        reference_id: transferId,
        created_by: userId,
      });
    }
  }

  // Create transfer_in movements at destination branch
  for (const item of items) {
    await supabase.from("inventory_movements").insert({
      organization_id: orgId,
      branch_id: transfer.to_branch_id,
      part_id: item.part_id,
      movement_type: "transfer_in",
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      reference_type: "stock_transfer",
      reference_id: transferId,
      created_by: userId,
    });
  }

  // Update transfer status
  const { error } = await supabase
    .from("stock_transfers")
    .update({
      status: "completed",
      received_by: userId,
      completed_at: new Date().toISOString(),
    })
    .eq("id", transferId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "stock_transfers",
    record_id: transferId,
    user_id: userId,
    organization_id: orgId,
    new_data: { status: "completed" },
  });

  revalidateTag(cacheTags.stockTransfers(orgId), "max");
  revalidateTag(cacheTags.inventoryBalances(orgId), "max");
  revalidateTag(cacheTags.inventoryMovements(orgId), "max");
  return getTransfer(db, transferId, orgId);
}

// ── Cancel Transfer ───────────────────────────────────────────

export async function cancelTransfer(
  db: SupabaseClient,
  transferId: string,
  orgId: string,
  userId: string,
): Promise<StockTransfer> {
  const supabase = db;

  const { data: transfer, error: fetchError } = await supabase
    .from("stock_transfers")
    .select("status")
    .eq("id", transferId)
    .eq("organization_id", orgId)
    .single();

  if (fetchError || !transfer) throw new NotFoundError("Transfer not found");
  if (["completed", "cancelled"].includes(transfer.status))
    throw new ValidationError(
      "Cannot cancel a completed or cancelled transfer",
    );

  const { error } = await supabase
    .from("stock_transfers")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", transferId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  await createAuditLog({
    supabase: db,
    action: "update",
    table_name: "stock_transfers",
    record_id: transferId,
    user_id: userId,
    organization_id: orgId,
    new_data: { status: "cancelled" },
  });

  revalidateTag(cacheTags.stockTransfers(orgId), "max");
  return getTransfer(db, transferId, orgId);
}
