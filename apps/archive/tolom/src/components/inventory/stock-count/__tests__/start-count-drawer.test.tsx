import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StartCountDrawer } from "@/components/inventory/stock-count/start-count-drawer";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockCapture = vi.fn();

vi.mock("@zuiio/capture", () => ({
  capture: (...args: unknown[]) => mockCapture(...args),
}));

const mockPartsQuery = vi.fn();
const mockBalancesQuery = vi.fn();
const mockCreateSession = vi.fn();
const mockAddCountItem = vi.fn();
const mockReconcile = vi.fn();

vi.mock("@/lib/queries/use-inventory", () => ({
  usePartsCatalog: (...args: unknown[]) => mockPartsQuery(...args),
  useInventoryBalances: (...args: unknown[]) => mockBalancesQuery(...args),
}));

vi.mock("@/lib/queries/use-stock-counts", () => ({
  useCreateStockCountSession: (...args: unknown[]) =>
    mockCreateSession(...args),
  useAddCountItem: (...args: unknown[]) => mockAddCountItem(...args),
  useReconcileSession: (...args: unknown[]) => mockReconcile(...args),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const parts = [
  { id: "p1", name: "Oil Filter", part_number: "OF-1", is_active: true },
  { id: "p2", name: "Brake Pad", part_number: "BP-2", is_active: true },
  { id: "p3", name: "Old Filter", part_number: "OF-0", is_active: false },
];

function renderDrawer(onOpenChange = vi.fn()) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <StartCountDrawer open={true} onOpenChange={onOpenChange} orgId="org-1" />
    </QueryClientProvider>,
  );
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} element in DOM`);
  return value;
}

describe("StartCountDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPartsQuery.mockReturnValue({ data: parts, isPending: false });
    mockBalancesQuery.mockReturnValue({
      data: [{ part_id: "p1", quantity_on_hand: 5 }],
    });
    mockCreateSession.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "s1" }),
      isPending: false,
    });
    mockAddCountItem.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "ci-1" }),
      isPending: false,
    });
    mockReconcile.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        id: "s1",
        movements_created: 1,
      }),
      isPending: false,
    });
  });

  it("renders the title and part search", () => {
    renderDrawer();
    expect(screen.getByText("stockCountTitle")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("searchPartsToCount"),
    ).toBeInTheDocument();
  });

  it("keeps review disabled until items are added", () => {
    renderDrawer();
    expect(
      screen.getByRole("button", { name: /reviewAndComplete/ }),
    ).toBeDisabled();
  });

  it("filters active parts and excludes already-added items", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const searchInput = required(
      screen.getByPlaceholderText("searchPartsToCount"),
      "search input",
    );
    await user.type(searchInput, "filter");

    // Only active parts matching the query
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.queryByText("Old Filter")).not.toBeInTheDocument();

    // Add the part, then search again — it must no longer appear
    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addItemToCount/ }));
    await user.type(searchInput, "filter");
    expect(screen.getByText("noPartsMatch")).toBeInTheDocument();
  });

  it("adds an item with the counted quantity", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const searchInput = required(
      screen.getByPlaceholderText("searchPartsToCount"),
      "search input",
    );
    await user.type(searchInput, "oil");
    await user.click(screen.getByText("Oil Filter"));

    // Selected-part form shows the resolved system quantity from balances
    expect(screen.getByText("5")).toBeInTheDocument();

    const qtyInput = screen.getByLabelText("Numeric");
    await user.clear(qtyInput);
    await user.type(qtyInput, "3");
    await user.tab();

    await user.click(screen.getByRole("button", { name: /addItemToCount/ }));

    // Variance = physical (3) − system (5) → −2, not +3
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("systemQuantity: 5")).toBeInTheDocument();
    expect(screen.getByText("physicalQuantity: 3")).toBeInTheDocument();
    expect(screen.getByText("-2")).toBeInTheDocument();
  });

  it("removes an item from the count", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const searchInput = required(
      screen.getByPlaceholderText("searchPartsToCount"),
      "search input",
    );
    await user.type(searchInput, "oil");
    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addItemToCount/ }));

    const removeButton = document.querySelector("button.text-destructive");
    await user.click(required(removeButton, "remove item button"));

    expect(screen.queryByText("Oil Filter")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reviewAndComplete/ }),
    ).toBeDisabled();
  });

  it("completes the count and creates movements", async () => {
    const user = userEvent.setup();
    const createMutate = vi.fn().mockResolvedValue({ id: "s1" });
    const addItemMutate = vi.fn().mockResolvedValue({ id: "ci-1" });
    const reconcileMutate = vi.fn().mockResolvedValue({
      id: "s1",
      movements_created: 1,
    });
    mockCreateSession.mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    });
    mockAddCountItem.mockReturnValue({
      mutateAsync: addItemMutate,
      isPending: false,
    });
    mockReconcile.mockReturnValue({
      mutateAsync: reconcileMutate,
      isPending: false,
    });
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);

    const searchInput = required(
      screen.getByPlaceholderText("searchPartsToCount"),
      "search input",
    );
    await user.type(searchInput, "oil");
    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addItemToCount/ }));
    await user.click(screen.getByRole("button", { name: /reviewAndComplete/ }));

    // Review step summary
    expect(screen.getAllByText("itemsCounted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("itemsWithVariance").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /completeCount/ }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledWith({});
      expect(addItemMutate).toHaveBeenCalledWith({
        sessionId: "s1",
        part_id: "p1",
        physical_quantity: 1,
      });
      expect(reconcileMutate).toHaveBeenCalledWith({ sessionId: "s1" });
    });

    // Done step
    expect(screen.getAllByText("countCompleted").length).toBeGreaterThan(0);
    expect(screen.getByText("countCompletedDesc")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("countCompleted");

    // Done button closes
    await user.click(screen.getByRole("button", { name: "done" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error toast and captures the failure when completing fails", async () => {
    const user = userEvent.setup();
    const createMutate = vi.fn().mockRejectedValue(new Error("db down"));
    mockCreateSession.mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    });
    renderDrawer();

    const searchInput = required(
      screen.getByPlaceholderText("searchPartsToCount"),
      "search input",
    );
    await user.type(searchInput, "oil");
    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addItemToCount/ }));
    await user.click(screen.getByRole("button", { name: /reviewAndComplete/ }));
    await user.click(screen.getByRole("button", { name: /completeCount/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("countFailed");
    });
    expect(mockCapture).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: "stock-count complete" }),
    );
  });

  it("goes back from review to the add step", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const searchInput = required(
      screen.getByPlaceholderText("searchPartsToCount"),
      "search input",
    );
    await user.type(searchInput, "oil");
    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addItemToCount/ }));
    await user.click(screen.getByRole("button", { name: /reviewAndComplete/ }));
    await user.click(screen.getByRole("button", { name: /back/ }));

    expect(
      screen.getByPlaceholderText("searchPartsToCount"),
    ).toBeInTheDocument();
  });

  it("closes and resets when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDrawer(onOpenChange);

    const searchInput = required(
      screen.getByPlaceholderText("searchPartsToCount"),
      "search input",
    );
    await user.type(searchInput, "oil");
    await user.click(screen.getByText("Oil Filter"));
    await user.click(screen.getByRole("button", { name: /addItemToCount/ }));
    await user.click(screen.getByRole("button", { name: "cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
