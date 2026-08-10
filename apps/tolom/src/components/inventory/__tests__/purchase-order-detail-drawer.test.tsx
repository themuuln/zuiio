import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseOrderDetailDrawer } from "@/components/inventory/purchase-order-detail-drawer";
import { reportServerError } from "@/lib/sentry-report-server";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockOrgQuery = vi.fn();
const mockUsePurchaseOrders = vi.fn();
const mockUsePurchaseOrderItems = vi.fn();
const mockUseReceivePurchaseOrder = vi.fn();
const mockUseUpdatePurchaseOrder = vi.fn();
const mockUseReceiveByBarcode = vi.fn();

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: (...args: unknown[]) => mockOrgQuery(...args),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  usePurchaseOrders: (...args: unknown[]) => mockUsePurchaseOrders(...args),
  usePurchaseOrderItems: (...args: unknown[]) =>
    mockUsePurchaseOrderItems(...args),
  useReceivePurchaseOrder: (...args: unknown[]) =>
    mockUseReceivePurchaseOrder(...args),
  useUpdatePurchaseOrder: (...args: unknown[]) =>
    mockUseUpdatePurchaseOrder(...args),
  useReceiveByBarcode: (...args: unknown[]) => mockUseReceiveByBarcode(...args),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const po = {
  id: "po-1",
  order_number: "PO-1001",
  status: "draft",
  order_date: "2026-08-01",
  supplier: { name: "Supplier A" },
  total_amount: 150_000,
  notes: "Urgent restock",
};

const poItems = [
  {
    id: "i1",
    part_name: "Oil Filter",
    quantity_ordered: 5,
    quantity_received: 2,
    unit_cost: 10_000,
  },
];

function renderDrawer(
  overrides: { po?: typeof po; items?: typeof poItems; poId?: string } = {},
) {
  const queryClient = createTestQueryClient();
  mockUsePurchaseOrders.mockReturnValue({
    data: overrides.po !== undefined ? [overrides.po] : [po],
    isLoading: false,
  });
  mockUsePurchaseOrderItems.mockReturnValue({
    data: overrides.items ?? poItems,
    isLoading: false,
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PurchaseOrderDetailDrawer
        open={true}
        onOpenChange={vi.fn()}
        poId={overrides.poId ?? "po-1"}
      />
    </QueryClientProvider>,
  );
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} element in DOM`);
  return value;
}

describe("PurchaseOrderDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgQuery.mockReturnValue({
      data: { orgId: "org-1" },
      isPending: false,
    });
    mockUseReceivePurchaseOrder.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "po-1" }),
      isPending: false,
    });
    mockUseUpdatePurchaseOrder.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "po-1" }),
      isPending: false,
    });
    mockUseReceiveByBarcode.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "i2" }),
      isPending: false,
    });
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  it("renders order number, status, supplier and notes", () => {
    renderDrawer();
    expect(screen.getByText("PO-1001")).toBeInTheDocument();
    expect(screen.getByText("poStatusDraft")).toBeInTheDocument();
    expect(screen.getByText(/Supplier A/)).toBeInTheDocument();
    expect(screen.getByText("Urgent restock")).toBeInTheDocument();
  });

  it("renders line items with quantities, costs and totals", () => {
    renderDrawer();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("10,000 ₮").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50,000 ₮").length).toBeGreaterThan(0);
    expect(screen.getByText("150,000 ₮")).toBeInTheDocument();
  });

  it("shows empty items message when there are no items", () => {
    renderDrawer({ items: [] });
    expect(screen.getByText("noItems")).toBeInTheDocument();
  });

  it("marks a draft order as ordered", async () => {
    const user = userEvent.setup();
    const updateMutate = vi.fn().mockResolvedValue({ id: "po-1" });
    mockUseUpdatePurchaseOrder.mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /markOrdered/ }));
    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalledWith({
        id: "po-1",
        body: { status: "ordered" },
      });
    });
    expect(toast.success).toHaveBeenCalledWith("poUpdated");
  });

  it("receives stock after confirmation", async () => {
    const user = userEvent.setup();
    const receiveMutate = vi.fn().mockResolvedValue({ id: "po-1" });
    mockUseReceivePurchaseOrder.mockReturnValue({
      mutateAsync: receiveMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /receiveStock/ }));
    await waitFor(() => {
      expect(receiveMutate).toHaveBeenCalledWith("po-1");
    });
    expect(toast.success).toHaveBeenCalledWith("poReceived");
  });

  it("does not receive stock when confirmation is declined", async () => {
    const user = userEvent.setup();
    const receiveMutate = vi.fn().mockResolvedValue({ id: "po-1" });
    mockUseReceivePurchaseOrder.mockReturnValue({
      mutateAsync: receiveMutate,
      isPending: false,
    });
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /receiveStock/ }));
    expect(receiveMutate).not.toHaveBeenCalled();
  });

  it("cancels the purchase order after confirmation", async () => {
    const user = userEvent.setup();
    const updateMutate = vi.fn().mockResolvedValue({ id: "po-1" });
    mockUseUpdatePurchaseOrder.mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    });
    renderDrawer();

    await user.click(screen.getByRole("button", { name: /cancelPO/ }));
    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalledWith({
        id: "po-1",
        body: { status: "cancelled" },
      });
    });
  });

  it("receives an item by barcode", async () => {
    const user = userEvent.setup();
    const barcodeMutate = vi.fn().mockResolvedValue({ id: "i2" });
    mockUseReceiveByBarcode.mockReturnValue({
      mutateAsync: barcodeMutate,
      isPending: false,
    });
    renderDrawer();

    const barcodeInput = required(
      screen.getByPlaceholderText("enterBarcode"),
      "barcode input",
    );
    await user.type(barcodeInput, "BC-42");
    await user.click(screen.getByRole("button", { name: /receiveItem/ }));

    await waitFor(() => {
      expect(barcodeMutate).toHaveBeenCalledWith({
        poId: "po-1",
        barcode: "BC-42",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("itemReceivedByBarcode");
  });

  it("shows scan error when barcode receive fails", async () => {
    const user = userEvent.setup();
    const barcodeMutate = vi
      .fn()
      .mockRejectedValue(new Error("Barcode not found"));
    mockUseReceiveByBarcode.mockReturnValue({
      mutateAsync: barcodeMutate,
      isPending: false,
    });
    renderDrawer();

    const barcodeInput = required(
      screen.getByPlaceholderText("enterBarcode"),
      "barcode input",
    );
    await user.type(barcodeInput, "BC-99");
    await user.click(screen.getByRole("button", { name: /receiveItem/ }));

    await waitFor(() => {
      expect(screen.getByText("Barcode not found")).toBeInTheDocument();
    });
    expect(reportServerError).toHaveBeenCalledWith(
      "Barcode receive failed",
      expect.any(Error),
    );
  });

  it("shows not-found state and closes when the PO is missing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const queryClient = createTestQueryClient();
    mockUsePurchaseOrders.mockReturnValue({ data: [], isLoading: false });
    mockUsePurchaseOrderItems.mockReturnValue({ data: [], isLoading: false });
    render(
      <QueryClientProvider client={queryClient}>
        <PurchaseOrderDetailDrawer
          open={true}
          onOpenChange={onOpenChange}
          poId="missing"
        />
      </QueryClientProvider>,
    );

    // "poNotFound" appears in both the title and the body
    expect(screen.getAllByText("poNotFound").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("hides action buttons for received orders", () => {
    renderDrawer({ po: { ...po, status: "received" } });
    expect(
      screen.queryByRole("button", { name: /receiveStock/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /cancelPO/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /markOrdered/ }),
    ).not.toBeInTheDocument();
  });
});
