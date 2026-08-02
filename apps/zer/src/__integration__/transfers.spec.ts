/**
 * Integration tests for cross-location stock transfers.
 *
 * Covers: stock_transfers + stock_transfer_items CRUD (org-scoped RLS),
 * approve_stock_transfer RPC (from-warehouse decrement, to-warehouse upsert,
 * 'transfer' stock movements, status completion), insufficient-stock
 * rejection, and RLS.
 *
 * NOTE: runs against the local Supabase stack — do NOT run from CI without
 * the stack up (see other specs in this directory).
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestOrg,
  createTestProduct,
  createTestUserWithPermissions,
  createTestWarehouse,
  trackCleanup,
} from "./helpers";

interface TransferRpcResult {
  success?: boolean;
  error?: string;
  movements_created?: number;
}

interface SetupResult {
  orgId: string;
  orgName: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  userId: string;
  client: ReturnType<typeof createAdminClient>;
}

// ── Fixture ───────────────────────────────────────────────────

async function setupTransfer(fromStock = 50): Promise<
  SetupResult & {
    user: Awaited<ReturnType<typeof createTestUserWithPermissions>>;
  }
> {
  const admin = createAdminClient();
  const { orgId, org } = await createTestOrg(admin);
  const { branchId: fromBranchId } = await createTestBranch(admin, orgId);
  const { branchId: toBranchId } = await createTestBranch(admin, orgId);
  const { warehouseId: fromWarehouseId } = await createTestWarehouse(
    admin,
    orgId,
    fromBranchId,
  );
  const { warehouseId: toWarehouseId } = await createTestWarehouse(
    admin,
    orgId,
    toBranchId,
  );
  const { productId } = await createTestProduct(admin, orgId, {
    currentStock: fromStock,
  });

  await admin.from("warehouse_products").insert({
    warehouse_id: fromWarehouseId,
    product_id: productId,
    current_stock: fromStock,
  });
  await admin.from("warehouse_products").insert({
    warehouse_id: toWarehouseId,
    product_id: productId,
    current_stock: 0,
  });

  const user = await createTestUserWithPermissions(admin, orgId, org.name, [
    "inventory.update",
  ]);

  return {
    orgId,
    orgName: org.name,
    fromWarehouseId,
    toWarehouseId,
    productId,
    userId: user.userId,
    client: user.client,
    user,
  };
}

async function createTransfer(
  user: Awaited<ReturnType<typeof createTestUserWithPermissions>>,
  orgId: string,
  fromWarehouseId: string,
  toWarehouseId: string,
  productId: string,
  quantity: number,
) {
  const { data: transfer, error: createError } = await user.client
    .from("stock_transfers")
    .insert({
      organization_id: orgId,
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      notes: "Integration transfer",
    } as never)
    .select("id")
    .single();
  expect(createError).toBeNull();
  const transferId = transfer!.id as string;
  trackCleanup("stock_transfers", transferId);

  const { error: itemError } = await user.client
    .from("stock_transfer_items")
    .insert({
      transfer_id: transferId,
      product_id: productId,
      quantity,
    } as never);
  expect(itemError).toBeNull();

  return transferId;
}

// ── Transfer lifecycle ────────────────────────────────────────

describe("stock transfers", () => {
  it("approves a pending transfer, moves stock, and writes transfer movements", async () => {
    const { orgId, fromWarehouseId, toWarehouseId, productId, user } =
      await setupTransfer(50);

    const transferId = await createTransfer(
      user,
      orgId,
      fromWarehouseId,
      toWarehouseId,
      productId,
      30,
    );

    const { data: rpcResult, error: rpcError } = await user.client.rpc(
      "approve_stock_transfer",
      { p_transfer_id: transferId },
    );
    expect(rpcError).toBeNull();
    const result = rpcResult as unknown as TransferRpcResult;
    expect(result.success).toBe(true);
    expect(result.movements_created).toBe(2);

    const admin = createAdminClient();

    // From-warehouse decremented, to-warehouse incremented.
    const { data: fromRow } = await admin
      .from("warehouse_products")
      .select("current_stock")
      .eq("warehouse_id", fromWarehouseId)
      .eq("product_id", productId)
      .single();
    expect(Number(fromRow!.current_stock)).toBe(20);

    const { data: toRow } = await admin
      .from("warehouse_products")
      .select("current_stock")
      .eq("warehouse_id", toWarehouseId)
      .eq("product_id", productId)
      .single();
    expect(Number(toRow!.current_stock)).toBe(30);

    // Two 'transfer' movements: -qty at the from-warehouse, +qty at the to.
    const { data: movements } = await admin
      .from("stock_movements")
      .select("type, warehouse_id, quantity, branch_id")
      .eq("reference", `TRANSFER-${transferId}`)
      .order("quantity", { ascending: true });
    expect(movements).toHaveLength(2);
    expect(movements!.map((m) => m.type)).toEqual(["transfer", "transfer"]);
    expect(movements!.map((m) => m.warehouse_id as string).sort()).toEqual(
      [fromWarehouseId, toWarehouseId].sort(),
    );
    const fromMovement = movements!.find(
      (m) => m.warehouse_id === fromWarehouseId,
    )!;
    const toMovement = movements!.find(
      (m) => m.warehouse_id === toWarehouseId,
    )!;
    expect(Number(fromMovement.quantity)).toBe(-30);
    expect(Number(toMovement.quantity)).toBe(30);
    expect(fromMovement.branch_id).not.toBeNull();
    expect(toMovement.branch_id).not.toBeNull();

    // Transfer marked completed with a completion timestamp.
    const { data: done } = await admin
      .from("stock_transfers")
      .select("status, completed_at")
      .eq("id", transferId)
      .single();
    expect(done!.status).toBe("completed");
    expect(done!.completed_at).not.toBeNull();
  });

  it("rejects approval when the from-warehouse lacks stock and changes nothing", async () => {
    const { orgId, fromWarehouseId, toWarehouseId, productId, user } =
      await setupTransfer(5);

    const transferId = await createTransfer(
      user,
      orgId,
      fromWarehouseId,
      toWarehouseId,
      productId,
      30,
    );

    const { data: rpcResult } = await user.client.rpc(
      "approve_stock_transfer",
      { p_transfer_id: transferId },
    );
    const result = rpcResult as unknown as TransferRpcResult;
    expect(result.error).toBeDefined();
    expect(result.error).toContain("хүрэлцэхгүй");

    const admin = createAdminClient();

    // Nothing moved; transfer still pending.
    const { data: fromRow } = await admin
      .from("warehouse_products")
      .select("current_stock")
      .eq("warehouse_id", fromWarehouseId)
      .eq("product_id", productId)
      .single();
    expect(Number(fromRow!.current_stock)).toBe(5);

    const { data: statusRow } = await admin
      .from("stock_transfers")
      .select("status")
      .eq("id", transferId)
      .single();
    expect(statusRow!.status).toBe("pending");

    const { data: movements } = await admin
      .from("stock_movements")
      .select("id")
      .eq("reference", `TRANSFER-${transferId}`);
    expect(movements).toHaveLength(0);
  });

  it("cancels a pending transfer without touching stock", async () => {
    const { orgId, fromWarehouseId, toWarehouseId, productId, user } =
      await setupTransfer(50);

    const transferId = await createTransfer(
      user,
      orgId,
      fromWarehouseId,
      toWarehouseId,
      productId,
      10,
    );

    const { error } = await user.client
      .from("stock_transfers")
      .update({ status: "cancelled" } as never)
      .eq("id", transferId)
      .eq("status" as never, "pending");
    expect(error).toBeNull();

    const admin = createAdminClient();
    const { data: statusRow } = await admin
      .from("stock_transfers")
      .select("status")
      .eq("id", transferId)
      .single();
    expect(statusRow!.status).toBe("cancelled");

    const { data: fromRow } = await admin
      .from("warehouse_products")
      .select("current_stock")
      .eq("warehouse_id", fromWarehouseId)
      .eq("product_id", productId)
      .single();
    expect(Number(fromRow!.current_stock)).toBe(50);
  });
});

// ── RLS ───────────────────────────────────────────────────────

describe("stock transfers RLS", () => {
  it("anon cannot create transfers", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("stock_transfers").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      from_warehouse_id: "00000000-0000-0000-0000-000000000000",
      to_warehouse_id: "00000000-0000-0000-0000-000000000000",
    } as never);
    expect(error).not.toBeNull();
  });
});
