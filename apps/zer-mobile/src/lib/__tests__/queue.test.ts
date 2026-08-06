import {
  addPendingOrder,
  clearPendingOrders,
  listPendingOrders,
  makeLocalReference,
  type PendingOrder,
} from "@/lib/queue";
import { createMemoryStorage } from "@/lib/storage";

function makeOrder(overrides: Partial<PendingOrder> = {}): PendingOrder {
  return {
    id: "ORD-1",
    reference: "ORD-1",
    slug: "my-shop",
    storeName: "Миний Дэлгүүр",
    totalAmount: 3700,
    itemCount: 3,
    customerName: "Бат",
    customerPhone: "99112233",
    createdAt: "2026-08-03T10:00:00.000Z",
    ...overrides,
  };
}

describe("pending order queue", () => {
  it("appends orders and lists them newest-last", async () => {
    const storage = createMemoryStorage();
    await addPendingOrder(storage, makeOrder({ reference: "ORD-A" }));
    await addPendingOrder(storage, makeOrder({ reference: "ORD-B" }));
    const list = await listPendingOrders(storage);
    expect(list.map((o) => o.reference)).toEqual(["ORD-A", "ORD-B"]);
  });

  it("returns [] when nothing is stored", async () => {
    expect(await listPendingOrders(createMemoryStorage())).toEqual([]);
  });

  it("tolerates corrupt JSON", async () => {
    const storage = createMemoryStorage({
      "zer-mobile:pending-orders": "not-json{",
    });
    expect(await listPendingOrders(storage)).toEqual([]);
  });

  it("returns [] for a non-array payload", async () => {
    const storage = createMemoryStorage({
      "zer-mobile:pending-orders": '{"x":1}',
    });
    expect(await listPendingOrders(storage)).toEqual([]);
  });

  it("clears the queue", async () => {
    const storage = createMemoryStorage();
    await addPendingOrder(storage, makeOrder());
    await clearPendingOrders(storage);
    expect(await listPendingOrders(storage)).toEqual([]);
  });

  it("generates unique prefixed local references", () => {
    const a = makeLocalReference();
    const b = makeLocalReference();
    expect(a).toMatch(/^ORD-[A-Z0-9]+$/);
    expect(a).not.toBe(b);
  });
});
