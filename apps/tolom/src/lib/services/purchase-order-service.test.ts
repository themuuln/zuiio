import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

import {
  createPurchaseOrder,
  getPurchaseOrderItems,
  getPurchaseOrders,
  receiveByBarcode,
  receivePurchaseOrder,
  updatePurchaseOrder,
} from "./purchase-order-service";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

/** Query builder returned by the shared mock client — dynamically mocked methods. */
type MockQueryBuilder = MockSupabaseClient["from"] extends (
  ...args: never[]
) => infer QB
  ? QB
  : never;

const ORG_ID = "org-1";
const PO_ID = "po-1";
const PART_ID = "part-1";
const BARCODE = "1234567890";

describe("receiveByBarcode", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;
  let qb: MockQueryBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createMockSupabaseClient();
    qb = (client as unknown as SupabaseClient).from("__probe__"); // shared query builder
  });

  it("receives one unit, logs a movement, and marks the PO partial", async () => {
    // Call order: parts_catalog.maybeSingle, purchase_order_items.single (line),
    // inventory_movements.insert, purchase_order_items.single (update),
    // parts_catalog.update, purchase_order_items.select (all items),
    // purchase_orders.update.
    qb.maybeSingle.mockResolvedValueOnce({
      data: { id: PART_ID, name: "Brake Pad Set" },
      error: null,
    });
    qb.single.mockResolvedValueOnce({
      data: {
        id: "poi-1",
        part_id: PART_ID,
        quantity_ordered: 5,
        quantity_received: 0,
        unit_cost: 10000,
      },
      error: null,
    });
    qb.single.mockResolvedValueOnce({
      data: {
        id: "poi-1",
        part_id: PART_ID,
        quantity_ordered: 5,
        quantity_received: 1,
        unit_cost: 10000,
      },
      error: null,
    });
    // all-items select (no terminal) resolves via qb.then
    client.__qb.resolveWith({
      data: [{ quantity_ordered: 5, quantity_received: 1 }],
      error: null,
    });

    const result = await receiveByBarcode(
      client as unknown as SupabaseClient,
      PO_ID,
      ORG_ID,
      BARCODE,
    );

    expect(result.quantity_received).toBe(1);
    // Movement logged for the received unit
    expect(client.from).toHaveBeenCalledWith("inventory_movements");
    // PO flipped to partial, not received
    // The PO-status update is the call whose payload has `status`
    const poUpdate = qb.update.mock.calls.find(
      (c: unknown[]) => c[0] && (c[0] as Record<string, unknown>).status,
    )?.[0] as Record<string, unknown> | undefined;
    expect(poUpdate?.status).toBe("partial");
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("throws ValidationError when no part matches the barcode", async () => {
    qb.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      receiveByBarcode(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        BARCODE,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    // Should not reach the PO items lookup
    expect(client.from).not.toHaveBeenCalledWith("inventory_movements");
  });

  it("throws ValidationError when the part is not on the PO", async () => {
    qb.maybeSingle.mockResolvedValueOnce({
      data: { id: PART_ID, name: "Brake Pad Set" },
      error: null,
    });
    qb.single.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      receiveByBarcode(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        BARCODE,
      ),
    ).rejects.toThrow(/does not contain part/);
  });

  it("throws ValidationError when the line is already fully received", async () => {
    qb.maybeSingle.mockResolvedValueOnce({
      data: { id: PART_ID, name: "Brake Pad Set" },
      error: null,
    });
    qb.single.mockResolvedValueOnce({
      data: {
        id: "poi-1",
        part_id: PART_ID,
        quantity_ordered: 5,
        quantity_received: 5,
        unit_cost: 10000,
      },
      error: null,
    });

    await expect(
      receiveByBarcode(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        BARCODE,
      ),
    ).rejects.toThrow(/Already fully received/);
  });

  it("marks the PO received when all lines are fully received", async () => {
    qb.maybeSingle.mockResolvedValueOnce({
      data: { id: PART_ID, name: "Brake Pad Set" },
      error: null,
    });
    qb.single.mockResolvedValueOnce({
      data: {
        id: "poi-1",
        part_id: PART_ID,
        quantity_ordered: 5,
        quantity_received: 4,
        unit_cost: 10000,
      },
      error: null,
    });
    qb.single.mockResolvedValueOnce({
      data: {
        id: "poi-1",
        part_id: PART_ID,
        quantity_ordered: 5,
        quantity_received: 5,
        unit_cost: 10000,
      },
      error: null,
    });
    client.__qb.resolveWith({
      data: [{ quantity_ordered: 5, quantity_received: 5 }],
      error: null,
    });
    await receiveByBarcode(client as never, "po-1", "org-1", "12345");
    const poUpdate = qb.update.mock.calls.find(
      (c: unknown[]) => c[0] && (c[0] as Record<string, unknown>).status,
    )?.[0] as Record<string, unknown> | undefined;
    expect(poUpdate?.status).toBe("received");
    expect(poUpdate?.received_at).toBeTruthy();
  });
});

describe("getPurchaseOrders", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;
  let qb: MockQueryBuilder;

  beforeEach(() => {
    client = createMockSupabaseClient();
    qb = (client as unknown as SupabaseClient).from("__probe__"); // shared query builder
  });

  it("returns paginated purchase orders with supplier info", async () => {
    client.__qb.resolveWith({
      data: [
        { id: "po-1", order_number: "PO-100", supplier: { name: "Acme" } },
      ],
      error: null,
      count: 1,
    });

    const result = await getPurchaseOrders(
      client as unknown as SupabaseClient,
      ORG_ID,
    );

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.totalPages).toBe(1);
    // Supplier join requested with an exact count
    expect(qb.select).toHaveBeenCalledWith("*, supplier:suppliers(name)", {
      count: "exact",
    });
    // Org scoping + soft-delete filter + ordering + range
    expect(qb.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(qb.is).toHaveBeenCalledWith("deleted_at", null);
    expect(qb.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(qb.range).toHaveBeenCalledWith(0, 49);
  });

  it("returns an empty page when there are no purchase orders", async () => {
    client.__qb.resolveWith({ data: [], error: null, count: 0 });

    const result = await getPurchaseOrders(
      client as unknown as SupabaseClient,
      ORG_ID,
    );

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("clamps page and pageSize to the supported range", async () => {
    client.__qb.resolveWith({ data: [], error: null, count: 0 });

    await getPurchaseOrders(
      client as unknown as SupabaseClient,
      ORG_ID,
      0,
      1000,
    );

    expect(qb.range).toHaveBeenCalledWith(0, 99); // page 1, pageSize 100
  });

  it("applies the branch filter when a branch id is provided", async () => {
    client.__qb.resolveWith({ data: [], error: null, count: 0 });

    await getPurchaseOrders(
      client as unknown as SupabaseClient,
      ORG_ID,
      1,
      50,
      "branch-1",
    );

    expect(qb.eq).toHaveBeenCalledWith("branch_id", "branch-1");
  });

  it("skips the branch filter for 'all'", async () => {
    client.__qb.resolveWith({ data: [], error: null, count: 0 });

    await getPurchaseOrders(
      client as unknown as SupabaseClient,
      ORG_ID,
      1,
      50,
      "all",
    );

    expect(qb.eq).not.toHaveBeenCalledWith("branch_id", "all");
  });

  it("throws when the supplier lookup fails", async () => {
    client.__qb.resolveWith({
      data: null,
      error: { message: "suppliers table unreachable" },
      count: null,
    });

    await expect(
      getPurchaseOrders(client as unknown as SupabaseClient, ORG_ID),
    ).rejects.toThrow("suppliers table unreachable");
  });
});

describe("getPurchaseOrderItems", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;
  let qb: MockQueryBuilder;

  beforeEach(() => {
    client = createMockSupabaseClient();
    qb = (client as unknown as SupabaseClient).from("__probe__");
  });

  it("maps the joined part name onto each item", async () => {
    client.__qb.resolveWith({
      data: [{ id: "poi-1", part: { name: "Brake Pad Set" } }],
      error: null,
    });

    const items = await getPurchaseOrderItems(
      client as unknown as SupabaseClient,
      PO_ID,
    );

    expect(items[0].part_name).toBe("Brake Pad Set");
    expect(qb.eq).toHaveBeenCalledWith("purchase_order_id", PO_ID);
  });

  it("falls back to Unknown when the part relation is missing", async () => {
    client.__qb.resolveWith({
      data: [{ id: "poi-1", part: null }],
      error: null,
    });

    const items = await getPurchaseOrderItems(
      client as unknown as SupabaseClient,
      PO_ID,
    );

    expect(items[0].part_name).toBe("Unknown");
  });

  it("returns an empty list when there are no items", async () => {
    client.__qb.resolveWith({ data: [], error: null });

    await expect(
      getPurchaseOrderItems(client as unknown as SupabaseClient, PO_ID),
    ).resolves.toEqual([]);
  });

  it("throws when the items query fails", async () => {
    client.__qb.resolveWith({ data: null, error: { message: "items down" } });

    await expect(
      getPurchaseOrderItems(client as unknown as SupabaseClient, PO_ID),
    ).rejects.toThrow("items down");
  });
});

describe("createPurchaseOrder", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;
  let qb: MockQueryBuilder;

  const params = {
    order_number: "  PO-100  ",
    supplier_id: "sup-1",
    branchId: "branch-1",
    notes: "  urgent  ",
    items: [
      { part_id: PART_ID, quantity_ordered: 2, unit_cost: 10000, notes: null },
      { part_id: "part-2", quantity_ordered: 1, unit_cost: 5000, notes: null },
    ],
  };

  beforeEach(() => {
    client = createMockSupabaseClient();
    qb = (client as unknown as SupabaseClient).from("__probe__");
  });

  it("rejects when no items are provided", async () => {
    await expect(
      createPurchaseOrder(
        client as unknown as SupabaseClient,
        ORG_ID,
        { order_number: "PO-1", items: [] } as never,
        "user-1",
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects when the order number is missing", async () => {
    await expect(
      createPurchaseOrder(
        client as unknown as SupabaseClient,
        ORG_ID,
        {
          items: [{ part_id: PART_ID, quantity_ordered: 1, unit_cost: 1 }],
        } as never,
        "user-1",
      ),
    ).rejects.toThrow(/Order number is required/);
  });

  it("creates the purchase order with a computed total and its items", async () => {
    qb.single.mockResolvedValueOnce({ data: { id: "po-1" }, error: null });

    const po = await createPurchaseOrder(
      client as unknown as SupabaseClient,
      ORG_ID,
      params,
      "user-1",
    );

    expect(po.id).toBe("po-1");
    // PO insert: org-scoped, trimmed fields, computed total
    const poInsert = (qb.insert.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(poInsert).toMatchObject({
      organization_id: ORG_ID,
      branch_id: "branch-1",
      supplier_id: "sup-1",
      order_number: "PO-100",
      status: "draft",
      notes: "urgent",
      total_amount: 25000,
      created_by: "user-1",
      updated_by: "user-1",
    });
    // Items insert: each line zero-received and linked to the PO
    const itemsInsert = (qb.insert.mock.calls[1] as unknown[])[0] as Array<
      Record<string, unknown>
    >;
    expect(itemsInsert).toHaveLength(2);
    expect(itemsInsert[0]).toMatchObject({
      organization_id: ORG_ID,
      purchase_order_id: "po-1",
      part_id: PART_ID,
      quantity_ordered: 2,
      quantity_received: 0,
      unit_cost: 10000,
      created_by: "user-1",
      updated_by: "user-1",
    });
    expect(revalidateTag).toHaveBeenCalledWith("purchase-orders:org-1", "max");
  });

  it("resolves the main branch when no branch id is provided", async () => {
    qb.maybeSingle.mockResolvedValueOnce({
      data: { id: "main-branch" },
      error: null,
    });
    qb.single.mockResolvedValueOnce({ data: { id: "po-1" }, error: null });

    await createPurchaseOrder(
      client as unknown as SupabaseClient,
      ORG_ID,
      { order_number: "PO-101", items: params.items } as never,
      "user-1",
    );

    const poInsert = (qb.insert.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(poInsert.branch_id).toBe("main-branch");
  });

  it("throws when the PO insert fails", async () => {
    qb.single.mockResolvedValueOnce({
      data: null,
      error: { message: "insert failed" },
    });

    await expect(
      createPurchaseOrder(
        client as unknown as SupabaseClient,
        ORG_ID,
        params,
        "user-1",
      ),
    ).rejects.toThrow("insert failed");
  });

  it("throws when the items insert fails", async () => {
    qb.single.mockResolvedValueOnce({ data: { id: "po-1" }, error: null });
    client.__qb.resolveOnce({ data: null, error: { message: "items failed" } });

    await expect(
      createPurchaseOrder(
        client as unknown as SupabaseClient,
        ORG_ID,
        params,
        "user-1",
      ),
    ).rejects.toThrow("items failed");
  });
});

describe("updatePurchaseOrder", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;
  let qb: MockQueryBuilder;

  const existingPO = {
    id: PO_ID,
    organization_id: ORG_ID,
    order_number: "PO-100",
    status: "draft",
  };
  const updatedPO = { ...existingPO, notes: "Updated", status: "ordered" };

  beforeEach(() => {
    client = createMockSupabaseClient();
    qb = (client as unknown as SupabaseClient).from("__probe__");
  });

  it("updates an existing PO within the org scope", async () => {
    qb.single.mockResolvedValueOnce({ data: existingPO, error: null });
    qb.single.mockResolvedValueOnce({ data: updatedPO, error: null });

    const result = await updatePurchaseOrder(
      client as unknown as SupabaseClient,
      PO_ID,
      ORG_ID,
      { notes: "Updated" },
      "user-1",
    );

    expect(result).toEqual(updatedPO);
    const updatePayload = (qb.update.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(updatePayload).toMatchObject({
      notes: "Updated",
      updated_by: "user-1",
    });
    // Org scoping on both the fetch and the update
    expect(qb.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(revalidateTag).toHaveBeenCalledWith("purchase-orders:org-1", "max");
  });

  it("throws NotFoundError when the PO does not exist", async () => {
    qb.single.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      updatePurchaseOrder(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        { notes: "x" },
        "user-1",
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ValidationError when there are no fields to update", async () => {
    qb.single.mockResolvedValueOnce({ data: existingPO, error: null });

    await expect(
      updatePurchaseOrder(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        {} as never,
        "user-1",
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws NotFoundError when not authenticated", async () => {
    client.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      updatePurchaseOrder(client as unknown as SupabaseClient, PO_ID, ORG_ID, {
        notes: "x",
      }),
    ).rejects.toThrow("Not authenticated");
  });

  it("resolves the user id from the session when not passed", async () => {
    qb.single.mockResolvedValueOnce({ data: existingPO, error: null });
    qb.single.mockResolvedValueOnce({ data: updatedPO, error: null });

    await updatePurchaseOrder(
      client as unknown as SupabaseClient,
      PO_ID,
      ORG_ID,
      {
        notes: "Session",
      },
    );

    const updatePayload = (qb.update.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(updatePayload.updated_by).toBe("test-user-id");
  });
});

describe("receivePurchaseOrder", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;
  let qb: MockQueryBuilder;

  const existingPO = {
    id: PO_ID,
    organization_id: ORG_ID,
    order_number: "PO-100",
    status: "partial",
    total_amount: 100,
  };
  const receivedPO = {
    ...existingPO,
    status: "received",
    received_at: "2026-08-10T00:00:00Z",
  };

  beforeEach(() => {
    client = createMockSupabaseClient();
    qb = (client as unknown as SupabaseClient).from("__probe__");
  });

  it("marks the PO received when every line is already fully received", async () => {
    client.__qb.resolveWith({
      data: [
        {
          id: "poi-1",
          part_id: PART_ID,
          quantity_ordered: 5,
          quantity_received: 5,
          unit_cost: 10000,
        },
      ],
      error: null,
    });
    qb.single.mockResolvedValueOnce({ data: existingPO, error: null });
    qb.single.mockResolvedValueOnce({ data: receivedPO, error: null });

    const result = await receivePurchaseOrder(
      client as unknown as SupabaseClient,
      PO_ID,
      ORG_ID,
      "user-1",
    );

    expect(result.status).toBe("received");
    // No remaining quantity → no movements or line updates
    expect(client.from).not.toHaveBeenCalledWith("inventory_movements");
    const poUpdate = (qb.update.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(poUpdate).toMatchObject({
      status: "received",
      updated_by: "user-1",
    });
    expect(poUpdate.received_at).toBeTruthy();
    expect(revalidateTag).toHaveBeenCalledWith("purchase-orders:org-1", "max");
    expect(revalidateTag).toHaveBeenCalledWith(
      "inventory-balances:org-1",
      "max",
    );
  });

  it("creates movements and updates lines for partially received quantities, then marks the PO received", async () => {
    client.__qb.resolveWith({
      data: [
        {
          id: "poi-1",
          part_id: PART_ID,
          quantity_ordered: 5,
          quantity_received: 2,
          unit_cost: 10000,
        },
      ],
      error: null,
    });
    qb.single.mockResolvedValueOnce({ data: existingPO, error: null });
    qb.single.mockResolvedValueOnce({
      data: { ...receivedPO, status: "received" },
      error: null,
    });

    const result = await receivePurchaseOrder(
      client as unknown as SupabaseClient,
      PO_ID,
      ORG_ID,
      "user-1",
    );

    expect(result.status).toBe("received");
    // One movement for the remaining quantity (5 - 2)
    const movement = (qb.insert.mock.calls[0] as unknown[])[0];
    expect(movement).toEqual([
      {
        organization_id: ORG_ID,
        part_id: PART_ID,
        movement_type: "purchase",
        quantity: 3,
        unit_cost: 10000,
        reference_type: "purchase_order",
        reference_id: PO_ID,
        created_by: "user-1",
      },
    ]);
    // Line updated to the ordered quantity and last purchase price refreshed
    expect(qb.update).toHaveBeenCalledWith(
      expect.objectContaining({ quantity_received: 5, updated_by: "user-1" }),
    );
    expect(qb.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_purchase_price: 10000 }),
    );
    // PO flipped to received once every line is fully received, org-scoped
    const poUpdate = qb.update.mock.calls.find(
      (c) => c[0] && (c[0] as Record<string, unknown>).status !== undefined,
    )?.[0] as Record<string, unknown>;
    expect(poUpdate.status).toBe("received");
    expect(qb.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
  });

  it("throws ValidationError when the PO has no line items", async () => {
    client.__qb.resolveWith({ data: [], error: null });

    await expect(
      receivePurchaseOrder(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        "user-1",
      ),
    ).rejects.toThrow("No items to receive");
  });

  it("throws when creating the inventory movements fails", async () => {
    client.__qb.resolveOnce({
      data: [
        {
          id: "poi-1",
          part_id: PART_ID,
          quantity_ordered: 5,
          quantity_received: 2,
          unit_cost: 10000,
        },
      ],
      error: null,
    });
    client.__qb.resolveOnce({
      data: null,
      error: { message: "movement failed" },
    });

    await expect(
      receivePurchaseOrder(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        "user-1",
      ),
    ).rejects.toThrow("movement failed");
  });

  it("throws NotFoundError when the PO update comes back empty", async () => {
    client.__qb.resolveWith({
      data: [
        {
          id: "poi-1",
          part_id: PART_ID,
          quantity_ordered: 5,
          quantity_received: 5,
          unit_cost: 10000,
        },
      ],
      error: null,
    });
    qb.single.mockResolvedValueOnce({ data: existingPO, error: null });
    qb.single.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      receivePurchaseOrder(
        client as unknown as SupabaseClient,
        PO_ID,
        ORG_ID,
        "user-1",
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
