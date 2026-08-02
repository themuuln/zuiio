import {
  addItemToCart,
  type CartItem,
  cartTotals,
  MAX_ITEM_QUANTITY,
  removeItemFromCart,
  setItemQuantity,
} from "@/lib/cart";
import { createMemoryStorage } from "@/lib/storage";
import { createCartStore } from "@/store/cart-store";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "p1",
    name: "Бүтээгдэхүүн 1",
    unitPrice: 1500,
    unit: null,
    imageUrl: null,
    quantity: 1,
    ...overrides,
  };
}

describe("addItemToCart", () => {
  it("adds a new item", () => {
    const items = addItemToCart([], makeItem());
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });

  it("merges by productId and bumps quantity", () => {
    const items = addItemToCart(
      addItemToCart([], makeItem({ quantity: 2 })),
      makeItem({ quantity: 3 }),
    );
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it("clamps quantity at the max", () => {
    const items = addItemToCart(
      [],
      makeItem({ quantity: MAX_ITEM_QUANTITY + 10 }),
    );
    expect(items[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });

  it("respects maxQuantity when provided", () => {
    const items = addItemToCart([], makeItem({ quantity: 5, maxQuantity: 3 }));
    expect(items[0].quantity).toBe(3);
  });

  it("keeps distinct products separate", () => {
    const items = addItemToCart(
      addItemToCart([], makeItem()),
      makeItem({ productId: "p2", name: "Бүтээгдэхүүн 2" }),
    );
    expect(items).toHaveLength(2);
  });
});

describe("setItemQuantity / removeItemFromCart", () => {
  it("sets an exact quantity", () => {
    const items = setItemQuantity([makeItem({ quantity: 2 })], "p1", 7);
    expect(items[0].quantity).toBe(7);
  });

  it("removes the item when quantity drops to 0", () => {
    const items = setItemQuantity([makeItem()], "p1", 0);
    expect(items).toHaveLength(0);
  });

  it("clamps to maxQuantity", () => {
    const items = setItemQuantity([makeItem({ maxQuantity: 4 })], "p1", 99);
    expect(items[0].quantity).toBe(4);
  });

  it("removeItemFromCart drops only the target product", () => {
    const items = removeItemFromCart(
      [makeItem(), makeItem({ productId: "p2" })],
      "p1",
    );
    expect(items.map((i) => i.productId)).toEqual(["p2"]);
  });
});

describe("cartTotals", () => {
  it("sums item counts and prices", () => {
    const { itemCount, totalAmount } = cartTotals([
      makeItem({ unitPrice: 1500, quantity: 2 }),
      makeItem({ productId: "p2", unitPrice: 700, quantity: 3 }),
    ]);
    expect(itemCount).toBe(5);
    expect(totalAmount).toBe(1500 * 2 + 700 * 3);
  });

  it("returns zeros for an empty cart", () => {
    expect(cartTotals([])).toEqual({ itemCount: 0, totalAmount: 0 });
  });
});

describe("cart store (zustand + persistence)", () => {
  it("add/remove/setQuantity mutate state through the store", () => {
    const store = createCartStore(createMemoryStorage());
    store.getState().addItem(makeItem({ quantity: 2 }));
    store.getState().addItem(makeItem({ productId: "p2" }));
    expect(store.getState().items).toHaveLength(2);

    store.getState().setQuantity("p1", 5);
    expect(
      store.getState().items.find((i) => i.productId === "p1")?.quantity,
    ).toBe(5);

    store.getState().removeItem("p2");
    expect(store.getState().items.map((i) => i.productId)).toEqual(["p1"]);

    store.getState().clear();
    expect(store.getState().items).toHaveLength(0);
  });

  it("persists items and rehydrates a new store instance", async () => {
    const storage = createMemoryStorage();
    const storeA = createCartStore(storage);
    storeA.getState().addItem(makeItem({ quantity: 2 }));
    storeA.getState().addItem(makeItem({ productId: "p2", unitPrice: 900 }));
    await flush();
    await flush();

    const persisted = await storage.getItem("zer-mobile:cart");
    expect(persisted).not.toBeNull();
    const parsed = persisted ? (JSON.parse(persisted) as unknown) : null;
    expect(parsed).toMatchObject({
      state: { items: expect.any(Array) },
    });

    const storeB = createCartStore(storage);
    await flush();
    await flush();
    expect(storeB.getState().items).toHaveLength(2);
    expect(
      storeB.getState().items.find((i) => i.productId === "p1")?.quantity,
    ).toBe(2);
  });

  it("starts empty when nothing was persisted", async () => {
    const store = createCartStore(createMemoryStorage());
    await flush();
    expect(store.getState().items).toEqual([]);
  });
});
