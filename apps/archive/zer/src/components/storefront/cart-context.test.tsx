import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type CartItem, getCartItemKey } from "@/lib/shop-cart";
import { StorefrontCartProvider, useStorefrontCart } from "./cart-context";

const STORAGE_KEY = "zer-storefront-cart";

// jsdom in this setup has no localStorage — install the repo-standard mock.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
});

type CartItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

/** Mirrors the StorefrontCartValue contract exposed by the provider. */
type CartApi = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItemInput) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

function makeItem(
  overrides: Partial<CartItem> & { productId: string },
): CartItem {
  return {
    name: `Бүтээгдэхүүн ${overrides.productId}`,
    unitPrice: 1000,
    quantity: 1,
    unit: "ш",
    maxStock: Number.POSITIVE_INFINITY,
    ...overrides,
  };
}

/**
 * Harness that renders the provider's derived state and exposes one button
 * per cart action so tests drive the real provider API and assert on
 * rendered output.
 */
function Harness({
  items,
  count,
  total,
  addItem,
  removeItem,
  updateQuantity,
  clear,
}: CartApi) {
  return (
    <div>
      <p data-testid="count">{count}</p>
      <p data-testid="total">{total}</p>
      <ul>
        {items.map((item) => (
          <li
            key={getCartItemKey(item)}
            data-testid={`item:${getCartItemKey(item)}`}
          >
            {item.name} × {item.quantity} (max {item.maxStock})
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => addItem(makeItem({ productId: "p1", maxStock: 5 }))}
      >
        add-p1
      </button>
      <button
        type="button"
        onClick={() =>
          addItem(makeItem({ productId: "p1", maxStock: 5, quantity: 3 }))
        }
      >
        add-p1-qty3
      </button>
      <button
        type="button"
        onClick={() => addItem(makeItem({ productId: "p2", unitPrice: 2500 }))}
      >
        add-p2
      </button>
      <button type="button" onClick={() => removeItem("p1")}>
        remove-p1
      </button>
      <button type="button" onClick={() => updateQuantity("p1", 2)}>
        set-p1-qty2
      </button>
      <button type="button" onClick={() => updateQuantity("p1", 0)}>
        set-p1-qty0
      </button>
      <button type="button" onClick={() => updateQuantity("p1", 999)}>
        set-p1-qty999
      </button>
      <button type="button" onClick={clear}>
        clear
      </button>
    </div>
  );
}

function CartProbe() {
  const cart = useStorefrontCart();
  return <Harness {...cart} />;
}

function renderProvider() {
  return render(
    <StorefrontCartProvider>
      <CartProbe />
    </StorefrontCartProvider>,
  );
}

/** Read the persisted cart blob the provider wrote to localStorage. */
function storedItems(): Array<Record<string, unknown>> {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !("items" in parsed)) return [];
  const items = parsed.items;
  return Array.isArray(items) ? (items as Array<Record<string, unknown>>) : [];
}

describe("StorefrontCartProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("adds a new item with quantity 1 and recomputes count", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 1");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("addItem with quantity > 1 honors the requested quantity", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1-qty3"));
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 3");
    expect(screen.getByTestId("count")).toHaveTextContent("3");
  });

  it("adding the same item again increments instead of duplicating", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    fireEvent.click(screen.getByText("add-p1"));
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 2");
    expect(screen.getAllByTestId(/^item:/)).toHaveLength(1);
  });

  it("clamps quantity at maxStock when adding repeatedly", () => {
    renderProvider();
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText("add-p1"));
    }
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 5 (max 5)");
  });

  it("clamps a large requested quantity at maxStock", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    fireEvent.click(screen.getByText("add-p1-qty3"));
    // 1 + 3 add-units against maxStock 5 → 4 (below the cap, no clamp)
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 4 (max 5)");

    // Enough repeated adds push past the cap
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText("add-p1-qty3"));
    }
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 5 (max 5)");
  });

  it("updateQuantity caps at maxStock", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    fireEvent.click(screen.getByText("set-p1-qty999"));
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 5 (max 5)");
  });

  it("updateQuantity with 0 or negative removes the item", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    fireEvent.click(screen.getByText("set-p1-qty0"));
    expect(screen.queryByTestId("item:p1")).toBeNull();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("removeItem removes only the matching item", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    fireEvent.click(screen.getByText("add-p2"));
    fireEvent.click(screen.getByText("remove-p1"));
    expect(screen.queryByTestId("item:p1")).toBeNull();
    expect(screen.getByTestId("item:p2")).toHaveTextContent(
      "Бүтээгдэхүүн p2 × 1",
    );
  });

  it("clear empties the cart", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    fireEvent.click(screen.getByText("add-p2"));
    fireEvent.click(screen.getByText("clear"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.queryAllByTestId(/^item:/)).toHaveLength(0);
  });

  it("persists items to localStorage on change", () => {
    renderProvider();
    fireEvent.click(screen.getByText("add-p1"));
    const items = storedItems();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("p1");
    expect(items[0].quantity).toBe(1);
  });

  it("hydrates from localStorage on mount", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: [
          makeItem({ productId: "p1", quantity: 2, maxStock: 5 }),
          makeItem({ productId: "p2", unitPrice: 2500, quantity: 1 }),
        ],
      }),
    );
    renderProvider();
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 2 (max 5)");
    expect(screen.getByTestId("item:p2")).toHaveTextContent("× 1");
  });

  it("restores Infinity maxStock after the JSON round-trip (Infinity → null)", () => {
    // JSON.stringify(Number.POSITIVE_INFINITY) produces null — what the
    // provider writes to localStorage for unbounded public items.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: [
          makeItem({ productId: "p1", maxStock: Number.POSITIVE_INFINITY }),
        ],
      }),
    );
    renderProvider();
    // The hydrated item must stay unbounded: 10 more adds never cap.
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText("add-p1"));
    }
    expect(screen.getByTestId("item:p1")).toHaveTextContent("× 11");
  });

  it("computes finite totals and counts for large quantities", () => {
    // 1000 × p1 @1000₮ + 2 × p2 @2500₮ → total 1,005,000, count 1002.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: [
          makeItem({ productId: "p1", quantity: 1000 }),
          makeItem({ productId: "p2", unitPrice: 2500, quantity: 2 }),
        ],
      }),
    );
    renderProvider();
    expect(screen.getByTestId("total")).toHaveTextContent("1005000");
    expect(screen.getByTestId("count")).toHaveTextContent("1002");
  });

  it("treats corrupt localStorage as an empty cart", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    renderProvider();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
