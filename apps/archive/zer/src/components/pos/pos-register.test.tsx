import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSaleMock } = vi.hoisted(() => ({ createSaleMock: vi.fn() }));
const { queueOfflineActionMock } = vi.hoisted(() => ({
  queueOfflineActionMock: vi.fn(),
}));
const { routerPushMock } = vi.hoisted(() => ({ routerPushMock: vi.fn() }));

const offlineState = vi.hoisted(() => ({
  isOnline: true,
  pendingCount: 0,
  isReplaying: false,
  replay: vi.fn(),
  refreshPendingCount: vi.fn(),
}));

vi.mock("@/app/(dashboard)/sales/new/actions", () => ({
  createSale: createSaleMock,
}));

vi.mock("@/lib/offline-sync", () => ({
  queueOfflineAction: queueOfflineActionMock,
}));

vi.mock("@/lib/offline/offline-provider", () => ({
  useOffline: () => offlineState,
}));

vi.mock("@/lib/hooks/use-barcode-scanner", () => ({
  useBarcodeScanner: () => {},
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

// Avoid the product image component's IntersectionObserver + Supabase URLs.
vi.mock("@/components/ui/optimized-image", () => ({
  OptimizedImage: ({ alt }: { alt?: string }) => (
    <span data-testid="opt-img">{alt}</span>
  ),
}));

// VariantPicker stub: emits a fixed variant on demand.
vi.mock("@/components/products/variant-picker", () => ({
  VariantPicker: ({ onSelect }: { onSelect?: (v: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelect?.({
          variant_id: "v1",
          option_labels: "Улаан",
          sale_price: 6000,
          current_stock: 5,
          image_url: null,
        })
      }
    >
      Вариант сонгох
    </button>
  ),
}));

import type { PosProduct } from "@/lib/pos";
import type { PosCategory } from "./pos-product-grid";
import { type PosOpenSession, PosRegister } from "./pos-register";

const product = (overrides: Partial<PosProduct> = {}): PosProduct => ({
  id: "p1",
  name: "Талх",
  sale_price: 5000,
  current_stock: 10,
  unit: "ш",
  barcode: "1234567890",
  sku: "SKU-1",
  categoryId: null,
  image_url: null,
  has_variants: false,
  ...overrides,
});

const categories: PosCategory[] = [{ id: "c1", name: "Хүнс" }];

function renderRegister(
  products: PosProduct[] = [product()],
  openSession: PosOpenSession | null = null,
  hasReceiptPrinter = false,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PosRegister
        products={products}
        categories={categories}
        openSession={openSession}
        hasReceiptPrinter={hasReceiptPrinter}
      />
    </QueryClientProvider>,
  );
}

describe("PosRegister", () => {
  beforeEach(() => {
    createSaleMock.mockReset();
    queueOfflineActionMock.mockReset();
    queueOfflineActionMock.mockImplementation(() => Promise.resolve());
    offlineState.isOnline = true;
    offlineState.pendingCount = 0;
    createSaleMock.mockResolvedValue({
      success: true,
      sale: { id: "s1", total_amount: 10000, customer_name: null },
    });
  });

  it("adds a product to the cart with one tap and shows the subtotal", () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    expect(screen.getByText("Захиалга")).toBeInTheDocument();
    expect(screen.queryByText("Бүтээгдэхүүн олдсонгүй")).toBeNull();
    expect(screen.getAllByText(/5,000/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Төлбөр авах" })).toBeEnabled();
  });

  it("increments quantity when the same product is tapped twice", () => {
    renderRegister();
    const tile = screen.getByRole("button", { name: /Талх/ });
    fireEvent.click(tile);
    fireEvent.click(tile);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10,000/).length).toBeGreaterThan(0);
  });

  it("disables out-of-stock products", () => {
    renderRegister([product({ current_stock: 0 })]);
    expect(screen.getByRole("button", { name: /Талх/ })).toBeDisabled();
    expect(screen.getByText("Дууссан")).toBeInTheDocument();
  });

  it("opens the variant dialog for variant products and adds the variant", () => {
    renderRegister([product({ has_variants: true })]);
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    expect(
      screen.getByRole("button", { name: "Вариант сонгох" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Вариант сонгох" }));
    expect(screen.getByText("Улаан")).toBeInTheDocument();
    expect(screen.getAllByText(/6,000/).length).toBeGreaterThan(0);
  });

  it("charges cash with exact tendered and submits the createSale contract", async () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Төлбөр авах" }));

    // Short tendered → confirm disabled.
    expect(screen.getByRole("button", { name: "Батлах" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    const confirm = screen.getByRole("button", { name: "Батлах" });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() => expect(createSaleMock).toHaveBeenCalledTimes(1));
    const formData = createSaleMock.mock.calls[0][1] as FormData;
    expect(formData.get("status")).toBe("completed");
    expect(formData.get("payment_method")).toBe("cash");
    expect(formData.get("paid_amount")).toBe("5000");
    const items = JSON.parse(String(formData.get("items"))) as Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
    expect(items).toEqual([
      { productId: "p1", quantity: 1, unitPrice: 5000, variantId: null },
    ]);
  });

  it("shows the change when cash tendered exceeds the total", () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Төлбөр авах" }));
    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    expect(screen.getByTestId("pos-change")).toHaveTextContent("₮ 0");
  });

  it("queues the sale offline instead of calling the server action", async () => {
    offlineState.isOnline = false;
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Төлбөр авах" }));
    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    fireEvent.click(screen.getByRole("button", { name: "Батлах" }));

    await waitFor(() =>
      expect(queueOfflineActionMock).toHaveBeenCalledWith(
        "sale",
        expect.any(Object),
        expect.any(Array),
      ),
    );
    expect(createSaleMock).not.toHaveBeenCalled();
    expect(offlineState.refreshPendingCount).toHaveBeenCalled();
  });

  it("clears the cart after a successful sale", async () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Төлбөр авах" }));
    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    fireEvent.click(screen.getByRole("button", { name: "Батлах" }));

    await waitFor(() => expect(createSaleMock).toHaveBeenCalled());
    expect(screen.queryByText("Бүтээгдэхүүн нэмээрэй")).toBeInTheDocument();
  });

  it("links to the cash register when no session is open", () => {
    renderRegister();
    expect(screen.getByText("Кассын ээлж нээгээгүй байна")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ээлж нээх" })).toHaveAttribute(
      "href",
      "/cash-register",
    );
  });

  it("shows the open session chip when a session is running", () => {
    renderRegister([product()], { id: "s1", registerName: "Касс 1" });
    expect(screen.getByText("Ээлж нээлттэй: Касс 1")).toBeInTheDocument();
    expect(screen.queryByText("Кассын ээлж нээгээгүй байна")).toBeNull();
  });

  it("overrides a line price with the touch keypad", () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Талх үнэ засах" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "Хадгалах" }));
    expect(screen.getAllByText(/3,500/).length).toBeGreaterThan(0);
  });

  it("charges by card without a cash tender", async () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Төлбөр авах" }));
    fireEvent.click(screen.getByRole("button", { name: "Карт" }));
    const confirm = screen.getByRole("button", { name: "Батлах" });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() => expect(createSaleMock).toHaveBeenCalledTimes(1));
    const formData = createSaleMock.mock.calls[0][1] as FormData;
    expect(formData.get("payment_method")).toBe("card");
    expect(formData.get("paid_amount")).toBe("5000");
  });

  it("navigates to the printable receipt when the org has a printer", async () => {
    renderRegister([product()], null, true);
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Төлбөр авах" }));
    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    fireEvent.click(screen.getByRole("button", { name: "Батлах" }));

    await waitFor(() => expect(createSaleMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(routerPushMock).toHaveBeenCalledWith("/sales/s1?print=1"),
    );
  });

  it("shows the server error and keeps the cart when the sale fails", async () => {
    createSaleMock.mockResolvedValue({
      error: "Үлдэгдэл хүрэлцэхгүй байна.",
    });
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    fireEvent.click(screen.getByRole("button", { name: "Төлбөр авах" }));
    fireEvent.click(screen.getByRole("button", { name: "Бүрэн дүн" }));
    fireEvent.click(screen.getByRole("button", { name: "Батлах" }));

    await waitFor(() =>
      expect(
        screen.getByText("Үлдэгдэл хүрэлцэхгүй байна."),
      ).toBeInTheDocument(),
    );
    // Cart is kept so the cashier can fix the problem.
    expect(screen.queryByText("Бүтээгдэхүүн нэмээрэй")).toBeNull();
  });
});
