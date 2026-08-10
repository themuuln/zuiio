import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "zer-storefront-cart";
const mockRpc = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

import { buildOrderItems } from "@/lib/storefront-order";
import { CartClient, type CartOrg } from "./cart-client";

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

const ORG: CartOrg = {
  name: "Storefront E2E Shop",
  slug: "storefront-e2e-test",
  currency: "MNT",
};

type StoredItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  maxStock: number;
  variantId?: string;
  variantLabels?: string;
};

function seedCart(items: StoredItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
}

const TWO_ITEM_CART: StoredItem[] = [
  {
    productId: "p1",
    name: "Бүтээгдэхүүн 1",
    unitPrice: 5000,
    quantity: 2,
    unit: "ширхэг",
    maxStock: Number.POSITIVE_INFINITY,
  },
  {
    productId: "p2",
    name: "Цамц",
    unitPrice: 12500,
    quantity: 1,
    unit: "ширхэг",
    maxStock: Number.POSITIVE_INFINITY,
    variantId: "v1",
    variantLabels: "M / Цагаан",
  },
];

async function fillCheckoutForm(name: string, phone: string) {
  fireEvent.change(screen.getByLabelText("Нэр"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Утас"), {
    target: { value: phone },
  });
}

function submitCheckout() {
  fireEvent.click(screen.getByRole("button", { name: "Худалдан авалт" }));
}

describe("CartClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockRpc.mockReset();
    mockCapture.mockReset();
  });

  it("shows the empty-cart state with a link back to the catalog", () => {
    render(<CartClient slug={ORG.slug} organization={ORG} />);
    expect(screen.getByText("Сагс хоосон байна")).toBeInTheDocument();
    // Button asChild renders an anchor exposed with role="button"
    expect(
      screen.getByRole("button", { name: "Бүтээгдэхүүн үзэх" }),
    ).toHaveAttribute("href", "/storefront-e2e-test/products");
    // No checkout form in the empty state
    expect(screen.queryByRole("button", { name: "Худалдан авалт" })).toBeNull();
  });

  it("renders cart items with per-line and total amounts", () => {
    seedCart(TWO_ITEM_CART);
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    expect(screen.getByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(screen.getByText("Цамц")).toBeInTheDocument();
    expect(screen.getByText("M / Цагаан")).toBeInTheDocument();
    // Line totals: 2 × ₮5,000 = ₮10,000 and 1 × ₮12,500 = ₮12,500
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 12,500")).toBeInTheDocument();
    // Grand total (currency rendered in the same node)
    expect(screen.getByText("₮ 22,500 MNT")).toBeInTheDocument();
  });

  it("updates quantities and totals via the stepper", () => {
    seedCart(TWO_ITEM_CART);
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    // + on Бүтээгдэхүүн 1: qty 2 → 3, line 15,000, total 27,500
    fireEvent.click(screen.getAllByLabelText("Тоо хэмжээ нэмэх")[0]);
    expect(screen.getByText("₮ 15,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 27,500 MNT")).toBeInTheDocument();

    // − back down: qty 3 → 2
    fireEvent.click(screen.getAllByLabelText("Тоо хэмжээ хасах")[0]);
    expect(screen.getByText("₮ 22,500 MNT")).toBeInTheDocument();
  });

  it("removes an item from the cart via the trash button", () => {
    seedCart(TWO_ITEM_CART);
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    fireEvent.click(screen.getByLabelText("Цамц сагснаас хасах"));
    expect(screen.queryByText("Цамц")).toBeNull();
    // Only p1 remains: 2 × 5,000
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
  });

  it("submits the order to submit_shop_order with the buildOrderItems payload", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: [
        {
          order_id: "11111111-2222-4333-8444-555555555555",
          status: "pending",
          total_amount: 22500,
        },
      ],
      error: null,
    });
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });
    const [rpcName, payload] = mockRpc.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(rpcName).toBe("submit_shop_order");
    expect(payload.p_org_slug).toBe("storefront-e2e-test");
    expect(payload.p_payment_method).toBe("cash");
    expect(payload.p_contact_name).toBe("Тест Хэрэглэгч");
    expect(payload.p_contact_phone).toBe("99887766");
    expect(payload.p_currency_code).toBe("MNT");
    expect(payload.p_items).toEqual(
      buildOrderItems([
        {
          productId: "p1",
          name: "Бүтээгдэхүүн 1",
          unitPrice: 5000,
          quantity: 2,
          unit: "ширхэг",
          maxStock: Number.POSITIVE_INFINITY,
        },
        {
          productId: "p2",
          name: "Цамц",
          unitPrice: 12500,
          quantity: 1,
          unit: "ширхэг",
          maxStock: Number.POSITIVE_INFINITY,
          variantId: "v1",
          variantLabels: "M / Цагаан",
        },
      ]),
    );
    expect(typeof payload.p_idempotency_key).toBe("string");
  });

  it("shows the order confirmation and clears the cart on success", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: [{ order_id: "ord-123", status: "pending", total_amount: 22500 }],
      error: null,
    });
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();

    await waitFor(() => {
      expect(screen.getByText("Захиалга амжилттай үүслээ")).toBeInTheDocument();
    });
    expect(screen.getByText(/Захиалгын дугаар: ord-123/)).toBeInTheDocument();
    // Status label + total on the confirmation card
    expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
    expect(screen.getByText("₮ 22,500 MNT")).toBeInTheDocument();

    // Cart was cleared in localStorage
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "{}")).toEqual({ items: [] });
  });

  it("keeps the cart and shows a Mongolian error when the RPC fails", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Нөөц хүрэлцэхгүй байна" },
    });
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();

    await waitFor(() => {
      expect(
        screen.getByText(
          "Захиалга илгээхэд алдаа гарлаа. Холболтоо шалгаад дахин оролдоно уу.",
        ),
      ).toBeInTheDocument();
    });
    expect(mockCapture).toHaveBeenCalled();
    // Cart is intact — items still render and can be resubmitted
    expect(screen.getByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Худалдан авалт" }),
    ).toBeEnabled();
  });

  it("reuses the same idempotency key when retrying after an error", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: "timeout" } })
      .mockResolvedValueOnce({
        data: [
          { order_id: "ord-retry", status: "pending", total_amount: 22500 },
        ],
        error: null,
      });
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();
    await waitFor(() => {
      expect(screen.getByText(/алдаа гарлаа/)).toBeInTheDocument();
    });
    submitCheckout();

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
    const firstKey = (mockRpc.mock.calls[0][1] as { p_idempotency_key: string })
      .p_idempotency_key;
    const secondKey = (
      mockRpc.mock.calls[1][1] as { p_idempotency_key: string }
    ).p_idempotency_key;
    expect(secondKey).toBe(firstKey);
  });

  it("validates the contact fields before calling the RPC", async () => {
    seedCart(TWO_ITEM_CART);
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    // Empty name
    await fillCheckoutForm("", "99887766");
    submitCheckout();
    expect(screen.getByText("Нэрээ оруулна уу.")).toBeInTheDocument();
    expect(mockRpc).not.toHaveBeenCalled();

    // Too-short phone (7 digits)
    await fillCheckoutForm("Тест", "9988776");
    submitCheckout();
    expect(
      screen.getByText("Утасны дугаар 8-12 оронтой тоо байх ёстой."),
    ).toBeInTheDocument();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
