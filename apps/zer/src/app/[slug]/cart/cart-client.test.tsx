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
import { CartClient, type CartOrg, type StorefrontBranch } from "./cart-client";

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
  deliveryEnabled: false,
  pickupEnabled: false,
  deliveryFeeAmount: null,
  freeDeliveryThreshold: null,
};

const PICKUP_ONLY: CartOrg = {
  ...ORG,
  pickupEnabled: true,
};

const DELIVERY_ONLY: CartOrg = {
  ...ORG,
  deliveryEnabled: true,
  deliveryFeeAmount: 5000,
  freeDeliveryThreshold: 100000,
};

const BRANCHES: StorefrontBranch[] = [
  {
    id: "b1",
    slug: "ub-pickup",
    name: "Улаанбаатар",
    address: "Чингэлтэй дүүрэг, 1-р хороо",
    phone: "99112233",
  },
  {
    id: "b2",
    slug: "dh-pickup",
    name: "Дархан",
    address: "Дархан сум",
    phone: null,
  },
];

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

function lastPayload(): Record<string, unknown> {
  const [, payload] = mockRpc.mock.calls[mockRpc.mock.calls.length - 1] as [
    string,
    Record<string, unknown>,
  ];
  return payload;
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
    // Both delivery and pickup disabled → no delivery_type, no address params
    expect(payload.p_delivery_type).toBeNull();
    expect(payload.p_address).toBeNull();
    expect(payload.p_address_note).toBeNull();
    expect(payload.p_pickup_branch_slug).toBeNull();
  });

  it("submits email, coupon and gift card codes as params", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: [
        {
          order_id: "ord-coupon",
          status: "pending",
          total_amount: 18000,
        },
      ],
      error: null,
    });
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    fireEvent.change(screen.getByLabelText("Имэйл"), {
      target: { value: "buyer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Купон код"), {
      target: { value: "SAY10" },
    });
    fireEvent.change(screen.getByLabelText("Бэлгийн картын код"), {
      target: { value: "GC-1234" },
    });
    submitCheckout();

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });
    const payload = lastPayload();
    expect(payload.p_contact_email).toBe("buyer@example.com");
    expect(payload.p_coupon_code).toBe("SAY10");
    expect(payload.p_gift_card_code).toBe("GC-1234");
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
    // Status label + subtotal and total on the confirmation card
    expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
    expect(screen.getByText("Барааны дүн")).toBeInTheDocument();
    expect(screen.getAllByText("₮ 22,500 MNT")).toHaveLength(2);

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

  it("renders the delivery choice only when the org enables delivery or pickup", () => {
    seedCart(TWO_ITEM_CART);

    // Both disabled → no control at all
    const { unmount } = render(
      <CartClient slug={ORG.slug} organization={ORG} />,
    );
    expect(screen.queryByLabelText("Дэлгүүрээс авах")).toBeNull();
    expect(screen.queryByLabelText("Хүргүүлэх")).toBeNull();
    unmount();

    // Pickup only → pickup option shown, delivery hidden, default is pickup
    render(<CartClient slug={ORG.slug} organization={PICKUP_ONLY} />);
    expect(
      screen.getByRole("radio", { name: "Дэлгүүрээс авах" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Хүргүүлэх" })).toBeNull();
    // Pickup default → no address fields
    expect(screen.queryByLabelText("Хаяг")).toBeNull();
  });

  it("defaults to delivery and requires an address before submitting", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: [{ order_id: "ord-del", status: "pending", total_amount: 27500 }],
      error: null,
    });
    render(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    // Delivery-only org → delivery is the default, address visible
    expect(
      screen.getByRole("radio", { name: "Хүргүүлэх" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Хаяг")).toBeInTheDocument();

    // Empty address blocks submission
    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();
    expect(
      screen.getByText("Хүргэлтийн хаягаа оруулна уу."),
    ).toBeInTheDocument();
    expect(mockRpc).not.toHaveBeenCalled();

    // Filling the address submits with delivery params
    fireEvent.change(screen.getByLabelText("Хаяг"), {
      target: { value: "СБД, 1-р хороо, 41-р байр, 12 тоот" },
    });
    fireEvent.change(screen.getByLabelText("Нэмэлт мэдээлэл"), {
      target: { value: "Орц 2" },
    });
    submitCheckout();

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });
    const payload = lastPayload();
    expect(payload.p_delivery_type).toBe("delivery");
    expect(payload.p_address).toBe("СБД, 1-р хороо, 41-р байр, 12 тоот");
    expect(payload.p_address_note).toBe("Орц 2");
    expect(payload.p_pickup_branch_slug).toBeNull();
  });

  it("shows the branch picker for pickup when the org has multiple branches", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: [
        { order_id: "ord-pickup", status: "pending", total_amount: 22500 },
      ],
      error: null,
    });

    // Multiple branches → branch select shown with name + address labels
    const { unmount } = render(
      <CartClient
        slug={ORG.slug}
        organization={PICKUP_ONLY}
        branches={BRANCHES}
      />,
    );
    expect(screen.getByLabelText("Салбар сонгох")).toBeInTheDocument();

    // Select a branch and submit → slug is passed
    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    fireEvent.click(screen.getByLabelText("Салбар сонгох"));
    const option = await screen.findByText(
      "Улаанбаатар — Чингэлтэй дүүрэг, 1-р хороо",
    );
    fireEvent.click(option);
    submitCheckout();
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });
    expect(lastPayload().p_pickup_branch_slug).toBe("ub-pickup");
    unmount();

    // Single branch → no picker; pickup without a choice sends null
    // (the success above cleared the cart, so seed it again)
    seedCart(TWO_ITEM_CART);
    render(
      <CartClient
        slug={ORG.slug}
        organization={PICKUP_ONLY}
        branches={[BRANCHES[0]]}
      />,
    );
    expect(screen.queryByLabelText("Салбар сонгох")).toBeNull();
    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
    expect(lastPayload().p_pickup_branch_slug).toBeNull();
  });

  it("lists qpay and bank_transfer as payment methods", async () => {
    seedCart(TWO_ITEM_CART);
    render(<CartClient slug={ORG.slug} organization={ORG} />);

    // No delivery/pickup here → the payment select is the only combobox.
    fireEvent.click(screen.getByRole("combobox"));
    expect(
      await screen.findByRole("option", { name: "QPay" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Банкны шилжүүлэг" }),
    ).toBeInTheDocument();
  });

  it("shows the full breakdown and payment instructions on success", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: [
        {
          order_id: "ord-breakdown",
          status: "pending",
          total_amount: 18500,
          delivery_fee: 5000,
          discount_amount: 2000,
          gift_card_amount: 3000,
          payment_instructions: {
            bank_name: "Хаан банк",
            bank_account: "1234567890",
            account_name: "Shop LLC",
            qpay_qr_url: null,
          },
        },
      ],
      error: null,
    });
    render(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    fireEvent.change(screen.getByLabelText("Хаяг"), {
      target: { value: "СБД, 1-р хороо" },
    });
    submitCheckout();

    await waitFor(() => {
      expect(screen.getByText("Захиалга амжилттай үүслээ")).toBeInTheDocument();
    });

    // Subtotal captured pre-clear: 2 × 5,000 + 1 × 12,500
    expect(screen.getByText("Барааны дүн")).toBeInTheDocument();
    expect(screen.getByText("₮ 22,500 MNT")).toBeInTheDocument();
    // Discount line
    expect(screen.getByText("Хямдрал")).toBeInTheDocument();
    expect(screen.getByText("−₮ 2,000 MNT")).toBeInTheDocument();
    // Delivery fee line
    expect(screen.getByText("Хүргэлт")).toBeInTheDocument();
    expect(screen.getByText("₮ 5,000 MNT")).toBeInTheDocument();
    // Gift card line
    expect(screen.getByText("Бэлгийн карт")).toBeInTheDocument();
    expect(screen.getByText("−₮ 3,000 MNT")).toBeInTheDocument();
    // Total from the returned row
    expect(screen.getByText("Нийт дүн")).toBeInTheDocument();
    expect(screen.getByText("₮ 18,500 MNT")).toBeInTheDocument();

    // Payment instructions card
    expect(screen.getByText("Төлбөрийн мэдээлэл")).toBeInTheDocument();
    expect(screen.getByText(/Хаан банк/)).toBeInTheDocument();
    expect(screen.getByText(/1234567890/)).toBeInTheDocument();
    expect(screen.getByText(/Shop LLC/)).toBeInTheDocument();
    expect(
      screen.getByText(/Төлбөр хийсний дараа манай ажилтнууд/),
    ).toBeInTheDocument();
  });

  it("shows Үнэгүй delivery and the QPay QR when the fee is zero and a QR url is present", async () => {
    seedCart(TWO_ITEM_CART);
    mockRpc.mockResolvedValue({
      data: [
        {
          order_id: "ord-free",
          status: "pending",
          total_amount: 22500,
          delivery_fee: 0,
          discount_amount: 0,
          gift_card_amount: 0,
          payment_instructions: {
            bank_name: null,
            bank_account: null,
            account_name: null,
            qpay_qr_url: "https://cdn.test/qpay.png",
          },
        },
      ],
      error: null,
    });
    render(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    fireEvent.change(screen.getByLabelText("Хаяг"), {
      target: { value: "СБД, 1-р хороо" },
    });
    submitCheckout();

    await waitFor(() => {
      expect(screen.getByText("Захиалга амжилттай үүслээ")).toBeInTheDocument();
    });
    expect(screen.getByText("Үнэгүй")).toBeInTheDocument();
    expect(screen.getByAltText("QPay QR код")).toHaveAttribute(
      "src",
      "https://cdn.test/qpay.png",
    );
  });
});
