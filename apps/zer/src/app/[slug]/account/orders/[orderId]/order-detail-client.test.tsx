import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  let current: StoreSessionState = { status: "signedOut" };
  return {
    getState: () => current,
    setState: (next: StoreSessionState) => {
      current = next;
    },
  };
});

vi.mock("../../use-store-session", () => ({
  useStoreSession: () => ({ state: hoisted.getState() }),
}));

const mockRpc = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

// jsdom in this setup has no localStorage — install the repo-standard mock
// so the reorder cart (StorefrontCartProvider) can persist and be asserted.
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

import { I18nProvider } from "@/lib/i18n";
import type { StoreSessionState } from "../../use-store-session";
import { type OrderDetail, OrderDetailClient } from "./order-detail-client";

const ACCOUNT_STATE: StoreSessionState = {
  status: "account",
  account: {
    id: "user-1",
    email: "buyer@example.com",
    display_name: "Баяр",
    phone: "99112233",
  },
};

// 26000 - 2500 + 3000 - 1000 = 25500
const ORDER: OrderDetail = {
  id: "11111111-2222-4333-8444-555555555555",
  invoice_number: "INV-2026-001",
  status: "completed",
  created_at: "2026-08-01T12:00:00Z",
  total_amount: 25500,
  original_amount: 26000,
  discount_amount: 2500,
  delivery_fee: 3000,
  gift_card_amount: 1000,
  payment_method: "card",
  currency_code: "MNT",
  delivery_type: "delivery",
  delivery_address: "УБ хот, Баянзүрх дүүрэг, 1-р хороо",
  delivery_note: "Хаалганы код 12",
  contact_name: "Баяр",
  contact_phone: "99112233",
  contact_email: "buyer@example.com",
  delivery: {
    status: "delivered",
    external_tracking_id: "TRK-2026-001",
    assigned_to_name: null,
  },
  items: [
    {
      product_id: "p1",
      name: "Бүтээгдэхүүн 1",
      quantity: 2,
      unit_price: 5000,
      total_price: 10000,
    },
    {
      product_id: "p2",
      name: "Цамц",
      quantity: 3,
      unit_price: 7000,
      total_price: 21000,
    },
  ],
};

function renderDetail(order: OrderDetail = ORDER) {
  return render(
    <I18nProvider>
      <OrderDetailClient slug="storefront-e2e-test" order={order} />
    </I18nProvider>,
  );
}

describe("OrderDetailClient", () => {
  beforeEach(() => {
    hoisted.setState(ACCOUNT_STATE);
    window.localStorage.clear();
    mockRpc.mockReset();
    mockCapture.mockClear();
    mockPush.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it("links back to the order history", () => {
    renderDetail();
    expect(
      screen.getByRole("button", { name: "Захиалгын түүх рүү буцах" }),
    ).toHaveAttribute("href", "/storefront-e2e-test/account/orders");
  });

  it("renders the invoice header, date and status badge", () => {
    renderDetail();
    expect(
      screen.getByRole("heading", { name: "INV-2026-001" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-08-01")).toBeInTheDocument();
    expect(screen.getByText("Гүйцэтгэсэн")).toBeInTheDocument();
  });

  it("renders the full timeline for a completed + delivered order", () => {
    renderDetail();
    expect(screen.getByText("Захиалга үүссэн")).toBeInTheDocument();
    expect(screen.getByText("Баталгаажсан")).toBeInTheDocument();
    expect(screen.getByText("Хүргэлтэнд гарсан")).toBeInTheDocument();
    // Delivered appears in the timeline, the delivery-status badge and the
    // delivery info card.
    expect(screen.getAllByText("Хүргэгдсэн").length).toBeGreaterThanOrEqual(2);
  });

  it("uses the pickup flow labels for pickup orders", () => {
    renderDetail({
      ...ORDER,
      delivery_type: "pickup",
      delivery_address: null,
      delivery_note: null,
      delivery: null,
    });
    expect(screen.getByText("Дэлгүүрээс авах")).toBeInTheDocument();
    expect(screen.getByText("Бэлэн болсон")).toBeInTheDocument();
    expect(screen.queryByText("Хүргэлтэнд гарсан")).not.toBeInTheDocument();
    expect(screen.queryByText("Хүргэгдсэн")).not.toBeInTheDocument();
  });

  it("renders line items with quantity, unit price and line total", () => {
    renderDetail();
    expect(screen.getByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(screen.getByText("×2")).toBeInTheDocument();
    expect(screen.getByText("₮ 5,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
    expect(screen.getByText("Цамц")).toBeInTheDocument();
    expect(screen.getByText("×3")).toBeInTheDocument();
    expect(screen.getByText("₮ 7,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 21,000")).toBeInTheDocument();
  });

  it("renders variant labels when present", () => {
    renderDetail({
      ...ORDER,
      items: [
        {
          ...ORDER.items[0],
          variant_labels: ["Улаан", "L"],
        },
      ],
    });
    expect(screen.getByText("Улаан, L")).toBeInTheDocument();
  });

  it("shows subtotal, discount, delivery fee, gift card and total lines", () => {
    renderDetail();
    expect(screen.getByText("Барааны дүн")).toBeInTheDocument();
    expect(screen.getByText("₮ 26,000")).toBeInTheDocument();
    expect(screen.getByText("Хямдрал")).toBeInTheDocument();
    expect(screen.getByText("−₮ 2,500")).toBeInTheDocument();
    expect(screen.getByText("Хүргэлтийн төлбөр")).toBeInTheDocument();
    expect(screen.getByText("₮ 3,000")).toBeInTheDocument();
    expect(screen.getByText("Бэлгийн карт")).toBeInTheDocument();
    expect(screen.getByText("−₮ 1,000")).toBeInTheDocument();
    expect(screen.getByText("Нийт дүн")).toBeInTheDocument();
    expect(screen.getByText("₮ 25,500")).toBeInTheDocument();
  });

  it("hides the discount, delivery fee and gift card lines when zero", () => {
    renderDetail({
      ...ORDER,
      original_amount: ORDER.total_amount,
      discount_amount: 0,
      delivery_fee: 0,
      gift_card_amount: 0,
    });
    expect(screen.queryByText("Хямдрал")).not.toBeInTheDocument();
    expect(screen.queryByText("Хүргэлтийн төлбөр")).not.toBeInTheDocument();
    expect(screen.queryByText("Бэлгийн карт")).not.toBeInTheDocument();
  });

  it("shows the tracking id when present", () => {
    renderDetail();
    expect(screen.getByText("Ангид: TRK-2026-001")).toBeInTheDocument();
  });

  it("shows the payment method label", () => {
    renderDetail();
    expect(screen.getByText("Төлбөрийн арга")).toBeInTheDocument();
    expect(screen.getByText("Карт")).toBeInTheDocument();
  });

  it("shows contact info", () => {
    renderDetail();
    expect(screen.getByText("Баяр")).toBeInTheDocument();
    expect(screen.getByText("99112233")).toBeInTheDocument();
    expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
  });

  it("shows the login prompt when signed out", () => {
    hoisted.setState({ status: "signedOut" });
    renderDetail();
    expect(
      screen.getByRole("heading", { name: "Захиалгын түүх" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Нэвтрэх" })).toHaveAttribute(
      "href",
      "/storefront-e2e-test/account",
    );
  });

  it("shows a loading spinner while the session is loading", () => {
    hoisted.setState({ status: "loading" });
    renderDetail();
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("shows the cancel button for pending orders and cancels via cancel_my_order", async () => {
    const pendingOrder: OrderDetail = {
      ...ORDER,
      status: "pending",
      delivery: null,
    };
    mockRpc
      .mockResolvedValueOnce({
        data: [{ order_id: pendingOrder.id, status: "cancelled" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: { order: { ...pendingOrder, status: "cancelled" } },
        error: null,
      });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderDetail(pendingOrder);

    fireEvent.click(screen.getByRole("button", { name: "Захиалга цуцлах" }));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith("cancel_my_order", {
        p_slug: "storefront-e2e-test",
        p_order_id: pendingOrder.id,
      });
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Захиалга цуцалсан");
    // Refetched detail shows the cancelled status badge and hides the button.
    expect(await screen.findByText("Цуцалсан")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Захиалга цуцлах" }),
    ).toBeNull();
    confirmSpy.mockRestore();
  });

  it("hides the cancel button for completed orders", () => {
    renderDetail();
    expect(
      screen.queryByRole("button", { name: "Захиалга цуцлах" }),
    ).toBeNull();
  });

  it("surfaces the RPC error message when cancellation fails", async () => {
    const pendingOrder: OrderDetail = {
      ...ORDER,
      status: "pending",
      delivery: null,
    };
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой." },
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderDetail(pendingOrder);

    fireEvent.click(screen.getByRole("button", { name: "Захиалга цуцлах" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой.",
      );
    });
    expect(mockCapture).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("renders timeline steps from status_history with formatted dates", () => {
    renderDetail({
      ...ORDER,
      status: "cancelled",
      created_at: "2026-07-01T12:00:00Z",
      delivery_type: null,
      delivery: null,
      status_history: [
        { status: "pending", at: "2026-08-01T12:00:00Z" },
        { status: "cancelled", at: "2026-08-02T09:30:00Z" },
      ],
    });

    // History entries render as steps with their own dates; cancelled shows too.
    expect(screen.getByText("Хүлээгдэж буй")).toBeInTheDocument();
    expect(screen.getByText("2026-08-01")).toBeInTheDocument();
    expect(screen.getByText("2026-08-02")).toBeInTheDocument();
    // Status badge + timeline step for the cancelled entry.
    expect(screen.getAllByText("Цуцалсан").length).toBeGreaterThanOrEqual(2);
  });

  it("reorder re-adds the order items to the cart and navigates to the cart page", async () => {
    renderDetail({
      ...ORDER,
      items: [
        {
          product_id: "p1",
          name: "Бүтээгдэхүүн 1",
          quantity: 2,
          unit_price: 5000,
          total_price: 10000,
        },
        {
          product_id: "p2",
          name: "Цамц",
          quantity: 3,
          unit_price: 7000,
          total_price: 21000,
          variant_labels: ["Улаан", "L"],
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Дахин захиалах" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/storefront-e2e-test/cart");
    });
    const raw = window.localStorage.getItem("zer-storefront-cart");
    expect(raw).not.toBeNull();
    const { items } = JSON.parse(raw ?? "{}") as { items: unknown[] };
    expect(items).toEqual([
      expect.objectContaining({
        productId: "p1",
        name: "Бүтээгдэхүүн 1",
        unitPrice: 5000,
        quantity: 2,
        unit: "ширхэг",
      }),
      expect.objectContaining({
        productId: "p2",
        name: "Цамц",
        unitPrice: 7000,
        quantity: 3,
        unit: "ширхэг",
        variantLabels: "Улаан, L",
      }),
    ]);
  });
});
