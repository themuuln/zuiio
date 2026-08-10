import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as NextIntl from "next-intl";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { formatDate } from "../constants";
import { MovementsTab } from "../movements-tab";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useInventoryMovements: vi.fn(),
  useInventoryBalances: vi.fn(),
  useCreateMovement: vi.fn(),
  reportServerError: vi.fn(),
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
  };
});

vi.mock("sonner", () => ({
  toast: { success: toastMocks.success, error: toastMocks.error },
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("@/lib/queries/use-inventory", () => ({
  useInventoryMovements: mocks.useInventoryMovements,
  useInventoryBalances: mocks.useInventoryBalances,
  useCreateMovement: mocks.useCreateMovement,
}));

// ── Test data ──────────────────────────────────────────────────────────

interface SampleMovement {
  id: string;
  part_id: string;
  part_name: string;
  movement_type: string;
  quantity: number;
  unit_cost: number | null;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
}

interface MutateOptions {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

interface CreateMovementPayload {
  part_id: string;
  quantity: number;
  movement_type: string;
  unit_cost?: number;
  notes?: string;
}

const sampleMovements: SampleMovement[] = [
  {
    id: "mov-1",
    part_id: "part-1",
    part_name: "Oil Filter",
    movement_type: "purchase",
    quantity: 5,
    unit_cost: 100000,
    reference_type: "po-1",
    notes: "restock order",
    created_at: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "mov-2",
    part_id: "part-2",
    part_name: "Brake Pads",
    movement_type: "sale",
    quantity: 7,
    unit_cost: 50000,
    reference_type: "invoice-2",
    notes: null,
    created_at: "2026-01-12T08:00:00.000Z",
  },
];

const sampleBalances = [{ part_id: "part-1", quantity_on_hand: 12 }];

const searchPartsResponse = {
  data: [
    {
      id: "part-1",
      name: "Spark Plug",
      name_mn: null,
      part_number: null,
      barcode: null,
      category: null,
      description: null,
      unit: "pc",
      default_price: null,
      purchase_price: null,
      image_url: null,
      location: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ],
};

const createMovementMutate = vi.fn();
const fetchMock = vi.fn();

// ── Helpers ──────────────────────────────────────────────────────────────

function renderTab(
  props: {
    search?: string;
    onSearchChange?: (value: string) => void;
    movementFilter?: string;
    onMovementFilterChange?: (filter: string) => void;
  } = {},
) {
  return render(
    <MovementsTab
      orgId="org-1"
      branchFilter={null}
      search={props.search ?? ""}
      onSearchChange={props.onSearchChange ?? vi.fn()}
      movementFilter={props.movementFilter ?? "all"}
      onMovementFilterChange={props.onMovementFilterChange ?? vi.fn()}
    />,
  );
}

function recordMovementSubmitButton(): HTMLButtonElement {
  const button = document.querySelector(
    'button[form="record-movement-form"]',
  ) as HTMLButtonElement | null;
  if (!button) throw new Error("record-movement submit button not found");
  return button;
}

function movementTypeSelect(): HTMLSelectElement {
  const select = document.querySelector("select") as HTMLSelectElement | null;
  if (!select) throw new Error("movement type select not found");
  return select;
}

function notesInput(): HTMLInputElement {
  const form = document.querySelector(
    "#record-movement-form",
  ) as HTMLFormElement | null;
  if (!form) throw new Error("record-movement form not found");
  const label = Array.from(form.querySelectorAll("label")).find(
    (l) => l.textContent === "notes",
  );
  const input = label?.nextElementSibling as HTMLInputElement | null;
  if (!input) throw new Error("notes input not found");
  return input;
}

function SearchHarness() {
  const [search, setSearch] = useState("");
  return (
    <MovementsTab
      orgId="org-1"
      search={search}
      onSearchChange={setSearch}
      movementFilter="all"
      onMovementFilterChange={vi.fn()}
    />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("MovementsTab", () => {
  beforeEach(() => {
    mocks.useInventoryMovements.mockReturnValue({
      data: sampleMovements,
      isPending: false,
    });
    mocks.useInventoryBalances.mockReturnValue({ data: sampleBalances });
    mocks.useCreateMovement.mockReturnValue({
      mutate: createMovementMutate,
      isPending: false,
    });
    createMovementMutate.mockReset();
    fetchMock.mockReset();
    toastMocks.success.mockClear();
    toastMocks.error.mockClear();
    mocks.reportServerError.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the loading skeleton while movements are pending", () => {
    mocks.useInventoryMovements.mockReturnValue({
      data: undefined,
      isPending: true,
    });

    renderTab();

    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThanOrEqual(5);
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
  });

  it("renders movement rows with part name, type badge, qty, unit cost, date, reference and notes", () => {
    renderTab();

    expect(screen.getAllByText("Oil Filter").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Brake Pads").length).toBeGreaterThan(0);
    // Type badge label (table + mobile card + filter chip)
    expect(screen.getAllByText("movementPurchase").length).toBeGreaterThan(1);
    expect(screen.getAllByText("movementSale").length).toBeGreaterThan(1);
    // Quantity + unit cost
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("7").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₮ 100,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₮ 50,000").length).toBeGreaterThan(0);
    // Date rendered via formatDate
    expect(
      screen.getAllByText(formatDate("2026-01-10T08:00:00.000Z")).length,
    ).toBeGreaterThan(0);
    // Reference + notes columns
    expect(screen.getAllByText("po-1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("invoice-2").length).toBeGreaterThan(0);
    expect(screen.getByText("restock order")).toBeInTheDocument();
    expect(screen.getByText("2 movements")).toBeInTheDocument();
  });

  it("renders the empty state when there are no movements", () => {
    mocks.useInventoryMovements.mockReturnValue({
      data: [],
      isPending: false,
    });

    renderTab();

    expect(screen.getByText("noMovements")).toBeInTheDocument();
  });

  it("filters rows by the movementFilter prop", () => {
    renderTab({ movementFilter: "sale" });

    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(screen.getAllByText("Brake Pads").length).toBeGreaterThan(0);
    expect(screen.getByText("1 movements")).toBeInTheDocument();
  });

  it("shows the DataTable empty state when the filter matches no rows", () => {
    renderTab({ movementFilter: "waste" });

    expect(screen.getByText("noDataFound")).toBeInTheDocument();
    expect(screen.getByText("0 movements")).toBeInTheDocument();
  });

  it("calls onMovementFilterChange when a filter chip is clicked", async () => {
    const user = userEvent.setup();
    const onMovementFilterChange = vi.fn();
    renderTab({ onMovementFilterChange });

    await user.click(screen.getByRole("button", { name: "movementSale" }));

    expect(onMovementFilterChange).toHaveBeenCalledWith("sale");
  });

  it("filters rows by the search prop (part name, notes, reference)", () => {
    const props = {
      orgId: "org-1",
      onSearchChange: vi.fn(),
      movementFilter: "all",
      onMovementFilterChange: vi.fn(),
    };
    const { rerender } = render(<MovementsTab {...props} search="invoice" />);
    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(screen.getAllByText("Brake Pads").length).toBeGreaterThan(0);

    rerender(<MovementsTab {...props} search="restock" />);
    expect(screen.getAllByText("Oil Filter").length).toBeGreaterThan(0);
    expect(screen.queryByText("Brake Pads")).not.toBeInTheDocument();
  });

  it("calls onSearchChange when typing in the search box and pressing Enter", () => {
    render(<SearchHarness />);

    const input = screen.getByPlaceholderText("searchMovements");
    fireEvent.change(input, { target: { value: "invoice" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(screen.getAllByText("Brake Pads").length).toBeGreaterThan(0);
    expect(screen.getByText("1 movements")).toBeInTheDocument();
  });

  it("shows an error toast and skips the mutation when submitting without a part or quantity", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("button", { name: "recordMovement" }));
    expect(screen.getByText("recordStockMovement")).toBeInTheDocument();

    await user.click(recordMovementSubmitButton());

    expect(toastMocks.error).toHaveBeenCalledWith("selectPartAndQty");
    expect(createMovementMutate).not.toHaveBeenCalled();
  });

  it("submits the record-movement payload and closes the drawer on success", async () => {
    const user = userEvent.setup();
    createMovementMutate.mockImplementation(
      (_payload: CreateMovementPayload, opts: MutateOptions) => {
        opts.onSuccess?.();
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => searchPartsResponse,
    });
    renderTab();

    await user.click(screen.getByRole("button", { name: "recordMovement" }));

    // Live part search → select the part chip
    const partInput = screen.getByPlaceholderText("searchParts");
    await user.type(partInput, "spark");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Spark Plug" }),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/inventory/parts?q=spark"),
    );
    await user.click(screen.getByRole("button", { name: "Spark Plug" }));

    // The selected part's current balance is visible right after selection
    expect(screen.getByText(/currentBalance/)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    const qtyInput = screen.getByLabelText("Numeric");
    await user.type(qtyInput, "5");
    fireEvent.blur(qtyInput);

    const costInput = screen.getByLabelText("Currency");
    await user.type(costInput, "100000");
    fireEvent.blur(costInput);

    await user.selectOptions(movementTypeSelect(), "sale");

    await user.type(notesInput(), "restock");

    await user.click(recordMovementSubmitButton());

    expect(createMovementMutate).toHaveBeenCalledWith(
      {
        part_id: "part-1",
        quantity: 5,
        movement_type: "sale",
        unit_cost: 100000,
        notes: "restock",
      },
      expect.any(Object),
    );
    expect(toastMocks.success).toHaveBeenCalledWith("movementRecorded");
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText("searchParts"),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows the mutation error message when recording a movement fails", async () => {
    const user = userEvent.setup();
    createMovementMutate.mockImplementation(
      (_payload: CreateMovementPayload, opts: MutateOptions) => {
        opts.onError?.(new Error("stock below zero"));
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => searchPartsResponse,
    });
    renderTab();

    await user.click(screen.getByRole("button", { name: "recordMovement" }));
    const partInput = screen.getByPlaceholderText("searchParts");
    await user.type(partInput, "spark");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Spark Plug" }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Spark Plug" }));

    const qtyInput = screen.getByLabelText("Numeric");
    await user.type(qtyInput, "2");
    fireEvent.blur(qtyInput);

    await user.click(recordMovementSubmitButton());

    expect(createMovementMutate).toHaveBeenCalledWith(
      {
        part_id: "part-1",
        quantity: 2,
        movement_type: "purchase",
        unit_cost: undefined,
        notes: undefined,
      },
      expect.any(Object),
    );
    expect(toastMocks.error).toHaveBeenCalledWith("stock below zero");
  });

  it("reports the error when the live part search fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockRejectedValue(new Error("network down"));
    renderTab();

    await user.click(screen.getByRole("button", { name: "recordMovement" }));
    const partInput = screen.getByPlaceholderText("searchParts");
    await user.type(partInput, "spark");

    await waitFor(() =>
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      ),
    );
  });
});
