import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "zer-storefront-cart";
const mockRpc = vi.hoisted(() => vi.fn());
const mockSubmitStoreOrder = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());

const mockFrom = vi.hoisted(() => vi.fn());

/**
 * Stub for `createClient().from("store_account_addresses")` — the checkout
 * address-book reads go through the untyped client, so the table mock needs
 * the chainable select/eq/order builder plus insert.
 */
function mockAddressTable(rows: unknown[]) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        order: () => ({
          order: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    }),
    insert: (payload: unknown) => mockInsert(payload),
  });
}

function mockSignedInSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: userId } } },
    error: null,
  });
}

function mockGuestSession() {
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: mockRpc,
    auth: { getSession: mockGetSession },
    from: mockFrom,
  }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

vi.mock("@/lib/public-checkout-actions", () => ({
  submitStoreOrder: mockSubmitStoreOrder,
}));

import { StorefrontBaseProvider } from "@/components/storefront/storefront-base-provider";
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
  estimatedDeliveryHours: null,
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

const DELIVERY_WITH_ETA: CartOrg = {
  ...DELIVERY_ONLY,
  estimatedDeliveryHours: 4,
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
  const payload = mockSubmitStoreOrder.mock.calls[
    mockSubmitStoreOrder.mock.calls.length - 1
  ][0] as Record<string, unknown>;
  return payload;
}

/**
 * CartView links are storefront-relative — tests render on the primary
 * host, so the provider base is the org slug prefix (matches the hrefs
 * the assertions expect).
 */
function renderCart(ui: React.ReactElement) {
  return render(
    <StorefrontBaseProvider basePath={`/${ORG.slug}`}>
      {ui}
    </StorefrontBaseProvider>,
  );
}

describe("CartClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockRpc.mockReset();
    mockSubmitStoreOrder.mockReset();
    mockCapture.mockReset();
    mockGetSession.mockReset();
    mockInsert.mockReset();
    // Default: guest session with an empty address table.
    mockGuestSession();
    mockAddressTable([]);
  });

  it("shows the empty-cart state with a link back to the catalog", () => {
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);
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
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

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
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

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
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

    fireEvent.click(screen.getByLabelText("Цамц сагснаас хасах"));
    expect(screen.queryByText("Цамц")).toBeNull();
    // Only p1 remains: 2 × 5,000
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
  });

  it("submits the order through submitStoreOrder with the buildOrderItems payload", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "11111111-2222-4333-8444-555555555555",
      status: "pending",
      totalAmount: 22500,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();

    await waitFor(() => {
      expect(mockSubmitStoreOrder).toHaveBeenCalledTimes(1);
    });
    const payload = mockSubmitStoreOrder.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(payload.slug).toBe("storefront-e2e-test");
    expect(payload.paymentMethod).toBe("cash");
    expect(payload.contactName).toBe("Тест Хэрэглэгч");
    expect(payload.contactPhone).toBe("99887766");
    expect(payload.currencyCode).toBe("MNT");
    expect(payload.items).toEqual(
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
    expect(typeof payload.idempotencyKey).toBe("string");
    // Both delivery and pickup disabled → no delivery_type, no address params
    expect(payload.deliveryType).toBeNull();
    expect(payload.address).toBeNull();
    expect(payload.addressNote).toBeNull();
    expect(payload.pickupBranchSlug).toBeNull();
  });

  it("submits email, coupon and gift card codes as params", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-coupon",
      status: "pending",
      totalAmount: 18000,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

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
      expect(mockSubmitStoreOrder).toHaveBeenCalledTimes(1);
    });
    const payload = lastPayload();
    expect(payload.contactEmail).toBe("buyer@example.com");
    expect(payload.couponCode).toBe("SAY10");
    expect(payload.giftCardCode).toBe("GC-1234");
  });

  it("shows the order confirmation and clears the cart on success", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-123",
      status: "pending",
      totalAmount: 22500,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

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

  it("keeps the cart and surfaces the RPC error message when the RPC fails", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: false,
      message: "Нөөц хүрэлцэхгүй байна",
    });
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();

    await waitFor(() => {
      expect(screen.getByText("Нөөц хүрэлцэхгүй байна")).toBeInTheDocument();
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
    mockSubmitStoreOrder
      .mockResolvedValueOnce({ ok: false, message: "" })
      .mockResolvedValueOnce({
        ok: true,
        orderId: "ord-retry",
        status: "pending",
        totalAmount: 22500,
        deliveryFee: null,
        discountAmount: null,
        giftCardAmount: null,
        paymentInstructions: null,
      });
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();
    await waitFor(() => {
      expect(screen.getByText(/алдаа гарлаа/)).toBeInTheDocument();
    });
    submitCheckout();

    await waitFor(() => {
      expect(mockSubmitStoreOrder).toHaveBeenCalledTimes(2);
    });
    const firstKey = (
      mockSubmitStoreOrder.mock.calls[0][0] as { idempotencyKey: string }
    ).idempotencyKey;
    const secondKey = (
      mockSubmitStoreOrder.mock.calls[1][0] as { idempotencyKey: string }
    ).idempotencyKey;
    expect(secondKey).toBe(firstKey);
  });

  it("validates the contact fields before calling the RPC", async () => {
    seedCart(TWO_ITEM_CART);
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

    // Empty name
    await fillCheckoutForm("", "99887766");
    submitCheckout();
    expect(screen.getByText("Нэрээ оруулна уу.")).toBeInTheDocument();
    expect(mockSubmitStoreOrder).not.toHaveBeenCalled();

    // Too-short phone (7 digits)
    await fillCheckoutForm("Тест", "9988776");
    submitCheckout();
    expect(
      screen.getByText("Утасны дугаар 8-12 оронтой тоо байх ёстой."),
    ).toBeInTheDocument();
    expect(mockSubmitStoreOrder).not.toHaveBeenCalled();
  });

  it("renders the delivery choice only when the org enables delivery or pickup", () => {
    seedCart(TWO_ITEM_CART);

    // Both disabled → no control at all
    const { unmount } = renderCart(
      <CartClient slug={ORG.slug} organization={ORG} />,
    );
    expect(screen.queryByLabelText("Дэлгүүрээс авах")).toBeNull();
    expect(screen.queryByLabelText("Хүргүүлэх")).toBeNull();
    unmount();

    // Pickup only → pickup option shown, delivery hidden, default is pickup
    renderCart(<CartClient slug={ORG.slug} organization={PICKUP_ONLY} />);
    expect(
      screen.getByRole("radio", { name: "Дэлгүүрээс авах" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Хүргүүлэх" })).toBeNull();
    // Pickup default → no address fields
    expect(screen.queryByLabelText("Хаяг")).toBeNull();
  });

  it("defaults to delivery and requires an address before submitting", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-del",
      status: "pending",
      totalAmount: 27500,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

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
    expect(mockSubmitStoreOrder).not.toHaveBeenCalled();

    // Filling the address submits with delivery params
    fireEvent.change(screen.getByLabelText("Хаяг"), {
      target: { value: "СБД, 1-р хороо, 41-р байр, 12 тоот" },
    });
    fireEvent.change(screen.getByLabelText("Нэмэлт мэдээлэл"), {
      target: { value: "Орц 2" },
    });
    submitCheckout();

    await waitFor(() => {
      expect(mockSubmitStoreOrder).toHaveBeenCalledTimes(1);
    });
    const payload = lastPayload();
    expect(payload.deliveryType).toBe("delivery");
    expect(payload.address).toBe("СБД, 1-р хороо, 41-р байр, 12 тоот");
    expect(payload.addressNote).toBe("Орц 2");
    expect(payload.pickupBranchSlug).toBeNull();
  });

  it("shows the branch picker for pickup when the org has multiple branches", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-pickup",
      status: "pending",
      totalAmount: 22500,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });

    // Multiple branches → branch select shown with name + address labels
    const { unmount } = renderCart(
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
      expect(mockSubmitStoreOrder).toHaveBeenCalledTimes(1);
    });
    expect(lastPayload().pickupBranchSlug).toBe("ub-pickup");
    unmount();

    // Single branch → no picker; pickup without a choice sends null
    // (the success above cleared the cart, so seed it again)
    seedCart(TWO_ITEM_CART);
    renderCart(
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
      expect(mockSubmitStoreOrder).toHaveBeenCalledTimes(2);
    });
    expect(lastPayload().pickupBranchSlug).toBeNull();
  });

  it("lists qpay and bank_transfer as payment methods", async () => {
    seedCart(TWO_ITEM_CART);
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

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
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-breakdown",
      status: "pending",
      totalAmount: 18500,
      deliveryFee: 5000,
      discountAmount: 2000,
      giftCardAmount: 3000,
      paymentInstructions: {
        bank_name: "Хаан банк",
        bank_account: "1234567890",
        account_name: "Shop LLC",
        qpay_qr_url: null,
      },
    });
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

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
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-free",
      status: "pending",
      totalAmount: 22500,
      deliveryFee: 0,
      discountAmount: 0,
      giftCardAmount: 0,
      paymentInstructions: {
        bank_name: null,
        bank_account: null,
        account_name: null,
        qpay_qr_url: "https://cdn.test/qpay.png",
      },
    });
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

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

  it("surfaces a server-side RPC message in the error banner", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: false,
      message: "Купон олдсонгүй",
    });
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Купон олдсонгүй");
      expect(alert).not.toHaveTextContent(
        "Захиалга илгээхэд алдаа гарлаа. Холболтоо шалгаад дахин оролдоно уу.",
      );
    });
    expect(mockCapture).toHaveBeenCalled();
  });

  it("falls back to the generic message when the RPC error has no message", async () => {
    seedCart(TWO_ITEM_CART);
    mockSubmitStoreOrder.mockResolvedValue({ ok: false, message: "" });
    renderCart(<CartClient slug={ORG.slug} organization={ORG} />);

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    submitCheckout();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Захиалга илгээхэд алдаа гарлаа. Холболтоо шалгаад дахин оролдоно уу.",
      );
    });
    expect(mockCapture).toHaveBeenCalled();
  });

  it("shows the saved-address picker for a signed-in buyer and prefills the delivery fields", async () => {
    seedCart(TWO_ITEM_CART);
    mockSignedInSession();
    mockAddressTable([
      {
        id: "addr-1",
        label: "Гэр",
        address: "СБД, 1-р хороо, 41-р байр, 12 тоот",
        address_note: "Орц 2",
        phone: "99112233",
      },
    ]);
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    // The picker appears next to the address fields for delivery.
    const picker = await screen.findByLabelText("Хадгалсан хаяг");
    expect(picker).toBeInTheDocument();

    fireEvent.click(picker);
    const option = await screen.findByText(
      "Гэр — СБД, 1-р хороо, 41-р байр, 12 тоот",
    );
    fireEvent.click(option);

    await waitFor(() => {
      expect((screen.getByLabelText("Хаяг") as HTMLTextAreaElement).value).toBe(
        "СБД, 1-р хороо, 41-р байр, 12 тоот",
      );
    });
    expect(
      (screen.getByLabelText("Нэмэлт мэдээлэл") as HTMLInputElement).value,
    ).toBe("Орц 2");
    expect((screen.getByLabelText("Утас") as HTMLInputElement).value).toBe(
      "99112233",
    );
  });

  it("keeps the address picker and save checkbox hidden for guests", async () => {
    seedCart(TWO_ITEM_CART);
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Хаяг")).toBeInTheDocument();
    });
    expect(screen.queryByLabelText("Хадгалсан хаяг")).toBeNull();
    expect(screen.queryByLabelText("Хаягаа хадгалах")).toBeNull();
  });

  it("saves the entered address to the address book when the checkbox is checked", async () => {
    seedCart(TWO_ITEM_CART);
    mockSignedInSession();
    // Signed in but no saved addresses yet → no picker, checkbox only.
    mockAddressTable([]);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-addr",
      status: "pending",
      totalAmount: 27500,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: "Хаягаа хадгалах" }),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Хаягаа хадгалах" }));

    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    fireEvent.change(screen.getByLabelText("Хаяг"), {
      target: { value: "СБД, 1-р хороо, 41-р байр" },
    });
    fireEvent.change(screen.getByLabelText("Нэмэлт мэдээлэл"), {
      target: { value: "Орц 2" },
    });
    submitCheckout();

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });
    expect(mockInsert).toHaveBeenCalledWith({
      store_account_id: "user-1",
      label: "Хаяг",
      address: "СБД, 1-р хороо, 41-р байр",
      address_note: "Орц 2",
      phone: "99887766",
      is_default: false,
    });
  });

  it("does not insert an address when the save checkbox is unchecked", async () => {
    seedCart(TWO_ITEM_CART);
    mockSignedInSession();
    mockAddressTable([]);
    mockSubmitStoreOrder.mockResolvedValue({
      ok: true,
      orderId: "ord-no-save",
      status: "pending",
      totalAmount: 27500,
      deliveryFee: null,
      discountAmount: null,
      giftCardAmount: null,
      paymentInstructions: null,
    });
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: "Хаягаа хадгалах" }),
      ).toBeInTheDocument();
    });
    await fillCheckoutForm("Тест Хэрэглэгч", "99887766");
    fireEvent.change(screen.getByLabelText("Хаяг"), {
      target: { value: "СБД, 1-р хороо" },
    });
    submitCheckout();

    await waitFor(() => {
      expect(screen.getByText("Захиалга амжилттай үүслээ")).toBeInTheDocument();
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("renders the delivery ETA hint when the org has estimated_delivery_hours", async () => {
    seedCart(TWO_ITEM_CART);
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_WITH_ETA} />);

    expect(
      await screen.findByText("Хүргэлт: ~4 цагийн дотор"),
    ).toBeInTheDocument();
  });

  it("hides the ETA hint when estimated_delivery_hours is absent", async () => {
    seedCart(TWO_ITEM_CART);
    renderCart(<CartClient slug={ORG.slug} organization={DELIVERY_ONLY} />);

    expect(await screen.findByLabelText("Хаяг")).toBeInTheDocument();
    expect(screen.queryByText(/Хүргэлт: ~\d+ цагийн дотор/)).toBeNull();
  });
});
