import { render, screen } from "@testing-library/react";
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

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
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
