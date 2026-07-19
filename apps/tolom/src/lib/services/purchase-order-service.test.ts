import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

import { receiveByBarcode } from "./purchase-order-service";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const ORG_ID = "org-1";
const PO_ID = "po-1";
const PART_ID = "part-1";
const BARCODE = "1234567890";

describe("receiveByBarcode", () => {
  let client: ReturnType<typeof createMockSupabaseClient>;
  let qb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createMockSupabaseClient();
    qb = (client as any).from("__probe__"); // shared query builder
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
      client as any,
      PO_ID,
      ORG_ID,
      BARCODE,
    );

    expect(result.quantity_received).toBe(1);
    // Movement logged for the received unit
    expect(client.from).toHaveBeenCalledWith("inventory_movements");
    // PO flipped to partial, not received
    // The PO-status update is the call whose payload has `status`
    const poUpdate = (qb as any).update.mock.calls.find(
      (c: unknown[]) => c[0] && (c[0] as Record<string, unknown>).status,
    )?.[0] as Record<string, unknown> | undefined;
    expect(poUpdate?.status).toBe("partial");
    expect(revalidateTag).toHaveBeenCalled();
  });

  it("throws ValidationError when no part matches the barcode", async () => {
    qb.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      receiveByBarcode(client as any, PO_ID, ORG_ID, BARCODE),
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
      receiveByBarcode(client as any, PO_ID, ORG_ID, BARCODE),
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
      receiveByBarcode(client as any, PO_ID, ORG_ID, BARCODE),
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
    const poUpdate = (qb as any).update.mock.calls.find(
      (c: unknown[]) => c[0] && (c[0] as Record<string, unknown>).status,
    )?.[0] as Record<string, unknown> | undefined;
    expect(poUpdate?.status).toBe("received");
    expect(poUpdate?.received_at).toBeTruthy();
  });
});
