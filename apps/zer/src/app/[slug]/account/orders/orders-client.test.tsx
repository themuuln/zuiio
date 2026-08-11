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

vi.mock("../use-store-session", () => ({
  useStoreSession: () => ({ state: hoisted.getState() }),
}));

const mockRpc = vi.hoisted(() => vi.fn());
const mockCapture = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import { I18nProvider } from "@/lib/i18n";
import type { StoreSessionState } from "../use-store-session";
import { type MyOrder, OrdersClient } from "./orders-client";

const ACCOUNT_STATE: StoreSessionState = {
  status: "account",
  account: {
    id: "user-1",
    email: "buyer@example.com",
    display_name: "Баяр",
    phone: "99112233",
  },
};

const ORDER: MyOrder = {
  id: "11111111-2222-4333-8444-555555555555",
  invoice_number: "INV-2026-001",
  total_amount: 22500,
  status: "completed",
  created_at: "2026-08-01T12:00:00Z",
  delivery_type: null,
  delivery_status: null,
  external_tracking_id: null,
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
      quantity: 1,
      unit_price: 12500,
      total_price: 12500,
    },
  ],
};

function renderOrders() {
  return render(
    <I18nProvider>
      <OrdersClient slug="storefront-e2e-test" />
    </I18nProvider>,
  );
}

describe("OrdersClient", () => {
  beforeEach(() => {
    hoisted.setState({ status: "signedOut" });
    mockRpc.mockReset();
    mockCapture.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it("shows the cancel button for pending orders and cancels via cancel_my_order", async () => {
    hoisted.setState(ACCOUNT_STATE);
    const pendingOrder: MyOrder = { ...ORDER, status: "pending" };
    mockRpc
      .mockResolvedValueOnce({ data: [pendingOrder], error: null })
      .mockResolvedValueOnce({
        data: [{ order_id: pendingOrder.id, status: "cancelled" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ ...pendingOrder, status: "cancelled" }],
        error: null,
      });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderOrders();

    expect(await screen.findByText("INV-2026-001")).toBeInTheDocument();
    const cancelButton = screen.getByRole("button", {
      name: "Захиалга цуцлах",
    });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith("cancel_my_order", {
        p_slug: "storefront-e2e-test",
        p_order_id: pendingOrder.id,
      });
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Захиалга цуцалсан");
    // The list refetches and now shows the cancelled status + no cancel button.
    expect(await screen.findByText("Цуцалсан")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Захиалга цуцлах" }),
    ).toBeNull();
    confirmSpy.mockRestore();
  });

  it("does not cancel when the confirm dialog is declined", async () => {
    hoisted.setState(ACCOUNT_STATE);
    const pendingOrder: MyOrder = { ...ORDER, status: "pending" };
    mockRpc.mockResolvedValue({ data: [pendingOrder], error: null });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderOrders();

    expect(await screen.findByText("INV-2026-001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Захиалга цуцлах" }));

    expect(mockRpc).not.toHaveBeenCalledWith(
      "cancel_my_order",
      expect.anything(),
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("surfaces the RPC error message when cancellation fails", async () => {
    hoisted.setState(ACCOUNT_STATE);
    const pendingOrder: MyOrder = { ...ORDER, status: "pending" };
    mockRpc
      .mockResolvedValueOnce({ data: [pendingOrder], error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой." },
      });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderOrders();

    expect(await screen.findByText("INV-2026-001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Захиалга цуцлах" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой.",
      );
    });
    expect(mockCapture).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("hides the cancel button for completed orders", async () => {
    hoisted.setState(ACCOUNT_STATE);
    mockRpc.mockResolvedValue({ data: [ORDER], error: null });
    renderOrders();

    expect(await screen.findByText("INV-2026-001")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Захиалга цуцлах" }),
    ).toBeNull();
  });

  it("hides the cancel button for guests", () => {
    renderOrders();
    expect(
      screen.queryByRole("button", { name: "Захиалга цуцлах" }),
    ).toBeNull();
  });

  it("shows the sign-in prompt with a link to the account page when signed out", () => {
    renderOrders();
    expect(
      screen.getByRole("heading", { name: "Захиалгын түүх" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Захиалгын түүхээ харахын тулд нэвтэрнэ үү."),
    ).toBeInTheDocument();
    // Button asChild renders an anchor exposed with role="button"
    expect(screen.getByRole("button", { name: "Нэвтрэх" })).toHaveAttribute(
      "href",
      "/storefront-e2e-test/account",
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("shows the empty-orders state for a buyer with no orders", async () => {
    hoisted.setState(ACCOUNT_STATE);
    mockRpc.mockResolvedValue({ data: [], error: null });
    renderOrders();

    expect(
      await screen.findByText("Захиалга байхгүй байна."),
    ).toBeInTheDocument();
    expect(mockRpc).toHaveBeenCalledWith("get_my_orders");
  });

  it("renders order rows with invoice, status, total and line items", async () => {
    hoisted.setState(ACCOUNT_STATE);
    mockRpc.mockResolvedValue({ data: [ORDER], error: null });
    renderOrders();

    expect(await screen.findByText("INV-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Гүйцэтгэсэн")).toBeInTheDocument(); // completed
    expect(screen.getByText("₮ 22,500")).toBeInTheDocument();
    expect(screen.getByText("2026-08-01")).toBeInTheDocument();
    // Line items with quantity multiplier and line totals
    expect(screen.getByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(screen.getByText("×2")).toBeInTheDocument();
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();
    expect(screen.getByText("Цамц")).toBeInTheDocument();
    expect(screen.getByText("×1")).toBeInTheDocument();
    expect(screen.getByText("₮ 12,500")).toBeInTheDocument();
  });

  it("shows the delivery status badge and a details link for delivery orders", async () => {
    hoisted.setState(ACCOUNT_STATE);
    mockRpc.mockResolvedValue({
      data: [
        {
          ...ORDER,
          delivery_type: "delivery",
          delivery_status: "in_transit",
          external_tracking_id: "TRK-2026-001",
        },
      ],
      error: null,
    });
    renderOrders();

    expect(await screen.findByText("INV-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Хүргэлтэнд")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Дэлгэрэнгүй" })).toHaveAttribute(
      "href",
      "/storefront-e2e-test/account/orders/11111111-2222-4333-8444-555555555555",
    );
  });

  it("falls back to the order id prefix when there is no invoice number", async () => {
    hoisted.setState(ACCOUNT_STATE);
    mockRpc.mockResolvedValue({
      data: [{ ...ORDER, invoice_number: null, total_amount: 0, items: [] }],
      error: null,
    });
    renderOrders();

    expect(await screen.findByText("11111111")).toBeInTheDocument();
    expect(screen.getByText("Бараа: —")).toBeInTheDocument();
  });

  it("shows the RPC error message when loading orders fails", async () => {
    hoisted.setState(ACCOUNT_STATE);
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Дотоод алдаа гарлаа" },
    });
    renderOrders();

    expect(await screen.findByText("Дотоод алдаа гарлаа")).toBeInTheDocument();
    expect(mockCapture).toHaveBeenCalled();
  });

  it("shows a loading spinner while orders are pending", () => {
    hoisted.setState(ACCOUNT_STATE);
    mockRpc.mockReturnValue(new Promise(() => {}));
    renderOrders();
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});
