import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as NextIntl from "next-intl";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { formatDate } from "../constants";
import { PurchaseOrdersTab } from "../purchase-orders-tab";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  usePurchaseOrders: vi.fn(),
  useSuppliers: vi.fn(),
  usePurchaseOrderItems: vi.fn(),
  usePartsCatalog: vi.fn(),
  useCreatePurchaseOrder: vi.fn(),
  useReceivePurchaseOrder: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
  };
});

vi.mock("sonner", () => ({
  toast: { success: toastMocks.success, error: toastMocks.error },
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  usePurchaseOrders: mocks.usePurchaseOrders,
  useSuppliers: mocks.useSuppliers,
  usePurchaseOrderItems: mocks.usePurchaseOrderItems,
  usePartsCatalog: mocks.usePartsCatalog,
  useCreatePurchaseOrder: mocks.useCreatePurchaseOrder,
  useReceivePurchaseOrder: mocks.useReceivePurchaseOrder,
}));

// ── Test data ──────────────────────────────────────────────────────────

interface SamplePO {
  id: string;
  order_number: string;
  status: string;
  supplier: { name: string } | null;
  total_amount: number;
  created_at: string;
}

interface SampleItem {
  id: string;
  part_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
}

interface MutateOptions {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

interface CreatePOPayload {
  supplier_id: string | undefined;
  order_number: string;
  notes: string | undefined;
  items: { part_id: string; quantity_ordered: number; unit_cost: number }[];
}

const samplePOs: SamplePO[] = [
  {
    id: "po-1",
    order_number: "PO-001",
    status: "ordered",
    supplier: { name: "Auto Parts LLC" },
    total_amount: 150000,
    created_at: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "po-2",
    order_number: "PO-002",
    status: "received",
    supplier: null,
    total_amount: 50000,
    created_at: "2026-01-12T08:00:00.000Z",
  },
];

const po1Items: SampleItem[] = [
  {
    id: "item-1",
    part_name: "Oil Filter",
    quantity_ordered: 3,
    quantity_received: 1,
    unit_cost: 10000,
  },
];

const po2Items: SampleItem[] = [
  {
    id: "item-2",
    part_name: "Brake Pads",
    quantity_ordered: 2,
    quantity_received: 0,
    unit_cost: 20000,
  },
];

const sampleParts = [
  { id: "part-1", name: "Oil Filter", name_mn: null, is_active: true },
  { id: "part-2", name: "Discontinued Part", name_mn: null, is_active: false },
];

const sampleSuppliers = [
  { id: "sup-1", name: "Auto Parts LLC", is_active: true },
  { id: "sup-2", name: "Inactive Co", is_active: false },
];

const createPOMutate = vi.fn();
const receivePOMutate = vi.fn();

// ── Helpers ──────────────────────────────────────────────────────────────

function renderTab(
  props: { search?: string; onSearchChange?: (value: string) => void } = {},
) {
  return render(
    <PurchaseOrdersTab
      orgId="org-1"
      branchFilter={null}
      search={props.search ?? ""}
      onSearchChange={props.onSearchChange ?? vi.fn()}
    />,
  );
}

function createPOFormSubmitButton(): HTMLButtonElement {
  const button = document.querySelector(
    'button[form="create-po-form"]',
  ) as HTMLButtonElement | null;
  if (!button) throw new Error("create-po submit button not found");
  return button;
}

function itemPartSelect(): HTMLSelectElement {
  const select = document.querySelector(
    'select[name="item_0_part_id"]',
  ) as HTMLSelectElement | null;
  if (!select) throw new Error("item part select not found");
  return select;
}

function SearchHarness() {
  const [search, setSearch] = useState("");
  return (
    <PurchaseOrdersTab
      orgId="org-1"
      search={search}
      onSearchChange={setSearch}
    />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("PurchaseOrdersTab", () => {
  beforeEach(() => {
    mocks.usePurchaseOrders.mockReturnValue({
      data: samplePOs,
      isPending: false,
    });
    mocks.useSuppliers.mockReturnValue({ data: sampleSuppliers });
    mocks.usePurchaseOrderItems.mockImplementation(
      (_orgId: string, poId: string | undefined) => ({
        data: poId === "po-2" ? po2Items : po1Items,
        isPending: false,
      }),
    );
    mocks.usePartsCatalog.mockReturnValue({ data: sampleParts });
    mocks.useCreatePurchaseOrder.mockReturnValue({
      mutate: createPOMutate,
      isPending: false,
    });
    mocks.useReceivePurchaseOrder.mockReturnValue({
      mutate: receivePOMutate,
      isPending: false,
    });
    createPOMutate.mockReset();
    receivePOMutate.mockReset();
    toastMocks.success.mockClear();
    toastMocks.error.mockClear();
  });

  it("renders the loading skeleton while purchase orders are pending", () => {
    mocks.usePurchaseOrders.mockReturnValue({
      data: undefined,
      isPending: true,
    });

    renderTab();

    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThanOrEqual(5);
    expect(screen.queryByText("PO-001")).not.toBeInTheDocument();
  });

  it("renders PO rows with order number, supplier, status label, total and date", () => {
    renderTab();

    expect(screen.getByText("PO-001")).toBeInTheDocument();
    expect(screen.getByText("PO-002")).toBeInTheDocument();
    expect(screen.getByText("Auto Parts LLC")).toBeInTheDocument();
    // PO without a supplier falls back to the no-supplier label
    expect(screen.getByText("noSupplier")).toBeInTheDocument();
    expect(screen.getByText("poStatusOrdered")).toBeInTheDocument();
    expect(screen.getByText("poStatusReceived")).toBeInTheDocument();
    expect(screen.getByText("₮ 150,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 50,000")).toBeInTheDocument();
    expect(
      screen.getByText(formatDate("2026-01-10T08:00:00.000Z")),
    ).toBeInTheDocument();
    expect(screen.getByText("2 purchaseOrders")).toBeInTheDocument();
  });

  it("renders line items per PO with part, quantities and unit cost", async () => {
    const user = userEvent.setup();
    renderTab();

    // Line items are hidden until the PO header is expanded
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /PO-001/ }));

    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("₮ 10,000")).toBeInTheDocument();

    // Expanding another PO replaces the expanded one (single-expansion accordion)
    await user.click(screen.getByRole("button", { name: /PO-002/ }));
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(screen.getByText("Brake Pads")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("₮ 20,000")).toBeInTheDocument();
  });

  it("shows the receive-stock action only for non-received POs", async () => {
    const user = userEvent.setup();
    renderTab();

    // po-1 is ordered — its expanded card shows exactly one receive action
    await user.click(screen.getByRole("button", { name: /PO-001/ }));
    expect(
      screen.getAllByRole("button", { name: "receiveStock" }),
    ).toHaveLength(1);

    // po-2 is received — expanding it shows no receive action
    await user.click(screen.getByRole("button", { name: /PO-002/ }));
    expect(
      screen.queryByRole("button", { name: "receiveStock" }),
    ).not.toBeInTheDocument();
  });

  it("toggles line item visibility when the PO header is clicked", async () => {
    const user = userEvent.setup();
    renderTab();

    // Collapsed by default
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(screen.queryByText("Brake Pads")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /PO-001/ }));
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.queryByText("Brake Pads")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /PO-001/ }));
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
  });

  it("renders the empty state and opens the create drawer from it", async () => {
    const user = userEvent.setup();
    mocks.usePurchaseOrders.mockReturnValue({ data: [], isPending: false });

    renderTab();

    expect(screen.getByText("noPurchaseOrders")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "createFirstPO" }));
    expect(screen.getByLabelText(/orderNumber/)).toBeInTheDocument();
  });

  it("filters POs by order number, supplier name and status label via the search prop", () => {
    const props = {
      orgId: "org-1",
      onSearchChange: vi.fn(),
    };
    const { rerender } = render(
      <PurchaseOrdersTab {...props} search="PO-002" />,
    );
    expect(screen.getByText("PO-002")).toBeInTheDocument();
    expect(screen.queryByText("PO-001")).not.toBeInTheDocument();
    expect(screen.getByText("1 purchaseOrders")).toBeInTheDocument();

    rerender(<PurchaseOrdersTab {...props} search="Auto Parts" />);
    expect(screen.getByText("PO-001")).toBeInTheDocument();
    expect(screen.queryByText("PO-002")).not.toBeInTheDocument();

    rerender(<PurchaseOrdersTab {...props} search="poStatusReceived" />);
    expect(screen.getByText("PO-002")).toBeInTheDocument();
    expect(screen.queryByText("PO-001")).not.toBeInTheDocument();
  });

  it("calls onSearchChange when typing in the search box and pressing Enter", () => {
    render(<SearchHarness />);

    const input = screen.getByPlaceholderText("searchPOs");
    fireEvent.change(input, { target: { value: "PO-002" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.queryByText("PO-001")).not.toBeInTheDocument();
    expect(screen.getByText("PO-002")).toBeInTheDocument();
    expect(screen.getByText("1 purchaseOrders")).toBeInTheDocument();
  });

  it("lists only active suppliers in the create-PO drawer", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("button", { name: "createPO" }));
    const supplierSelect = screen.getByLabelText("supplier");
    const options = within(supplierSelect).getAllByRole("option");
    const optionTexts = options.map((o) => o.textContent);
    expect(optionTexts).toContain("Auto Parts LLC");
    expect(optionTexts).not.toContain("Inactive Co");
  });

  it("shows an error toast and skips the mutation when submitting without items", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("button", { name: "createPO" }));
    await user.type(screen.getByLabelText(/orderNumber/), "PO-999");
    await user.click(createPOFormSubmitButton());

    expect(toastMocks.error).toHaveBeenCalledWith("addAtLeastOneItem");
    expect(createPOMutate).not.toHaveBeenCalled();
  });

  it("submits the create-PO payload and closes the drawer on success", async () => {
    const user = userEvent.setup();
    createPOMutate.mockImplementation(
      (_payload: CreatePOPayload, opts: MutateOptions) => {
        opts.onSuccess?.();
      },
    );
    renderTab();

    await user.click(screen.getByRole("button", { name: "createPO" }));
    await user.type(screen.getByLabelText(/orderNumber/), "PO-999");
    await user.selectOptions(screen.getByLabelText("supplier"), "sup-1");
    await user.type(screen.getByLabelText("notes"), "urgent");
    await user.click(screen.getByRole("button", { name: "addItem" }));
    await user.selectOptions(itemPartSelect(), "part-1");

    const qtyInput = screen.getByLabelText("Numeric");
    await user.clear(qtyInput);
    await user.type(qtyInput, "3");
    fireEvent.blur(qtyInput);

    const costInput = screen.getByLabelText("Currency");
    await user.type(costInput, "5000");
    fireEvent.blur(costInput);

    await user.click(createPOFormSubmitButton());

    expect(createPOMutate).toHaveBeenCalledWith(
      {
        supplier_id: "sup-1",
        order_number: "PO-999",
        notes: "urgent",
        items: [{ part_id: "part-1", quantity_ordered: 3, unit_cost: 5000 }],
      },
      expect.any(Object),
    );
    expect(toastMocks.success).toHaveBeenCalledWith("poCreated");
    await waitFor(() =>
      expect(screen.queryByLabelText(/orderNumber/)).not.toBeInTheDocument(),
    );
  });

  it("shows the mutation error message when create-PO fails", async () => {
    const user = userEvent.setup();
    createPOMutate.mockImplementation(
      (_payload: CreatePOPayload, opts: MutateOptions) => {
        opts.onError?.(new Error("supplier invalid"));
      },
    );
    renderTab();

    await user.click(screen.getByRole("button", { name: "createPO" }));
    await user.type(screen.getByLabelText(/orderNumber/), "PO-999");
    await user.click(screen.getByRole("button", { name: "addItem" }));
    await user.selectOptions(itemPartSelect(), "part-1");

    await user.click(createPOFormSubmitButton());

    expect(toastMocks.error).toHaveBeenCalledWith("supplier invalid");
  });

  it("receives stock and shows a success toast", async () => {
    const user = userEvent.setup();
    receivePOMutate.mockImplementation((_poId: string, opts: MutateOptions) => {
      opts.onSuccess?.();
    });

    renderTab();

    await user.click(screen.getByRole("button", { name: /PO-001/ }));
    await user.click(screen.getByRole("button", { name: "receiveStock" }));

    expect(receivePOMutate).toHaveBeenCalledWith("po-1", expect.any(Object));
    expect(toastMocks.success).toHaveBeenCalledWith("poReceived");
  });

  it("shows the mutation error message when receiving stock fails", async () => {
    const user = userEvent.setup();
    receivePOMutate.mockImplementation((_poId: string, opts: MutateOptions) => {
      opts.onError?.(new Error("already received"));
    });

    renderTab();

    await user.click(screen.getByRole("button", { name: /PO-001/ }));
    await user.click(screen.getByRole("button", { name: "receiveStock" }));

    expect(receivePOMutate).toHaveBeenCalledWith("po-1", expect.any(Object));
    expect(toastMocks.error).toHaveBeenCalledWith("already received");
  });
});
