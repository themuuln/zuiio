import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockCountDetailDrawer } from "@/components/inventory/stock-count/detail-drawer";
import { createTestQueryClient } from "@/test/test-utils";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockSessionQuery = vi.fn();

vi.mock("@/lib/queries/use-stock-counts", () => ({
  useStockCountSession: (...args: unknown[]) => mockSessionQuery(...args),
}));

const session = {
  id: "s1",
  organization_id: "org-1",
  status: "in_progress",
  started_at: "2026-08-01T10:00:00Z",
  total_items: 2,
  total_variance: 3,
  notes: "Check the shelves",
  items: [
    {
      id: "i1",
      session_id: "s1",
      part_id: "p1",
      part_name: "Oil Filter",
      part_number: "OF-1",
      system_quantity: 5,
      physical_quantity: 7,
      variance: 2,
    },
    {
      id: "i2",
      session_id: "s1",
      part_id: "p2",
      part_name: "Brake Pad",
      part_number: null,
      system_quantity: 3,
      physical_quantity: 3,
      variance: 0,
    },
  ],
};

function renderDrawer(
  props: {
    open?: boolean;
    isPending?: boolean;
    data?: typeof session | null;
  } = {},
) {
  const queryClient = createTestQueryClient();
  mockSessionQuery.mockReturnValue({
    data: props.data !== undefined ? props.data : session,
    isPending: props.isPending ?? false,
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StockCountDetailDrawer
        open={props.open ?? true}
        onOpenChange={vi.fn()}
        orgId="org-1"
        sessionId="s1"
      />
    </QueryClientProvider>,
  );
}

describe("StockCountDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    renderDrawer({ open: false });
    expect(screen.queryByText("countDetail")).not.toBeInTheDocument();
  });

  it("shows a loading spinner while the session is pending", () => {
    renderDrawer({ isPending: true });
    // Drawer content renders in a portal (document.body)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders session meta, status badge and notes", () => {
    renderDrawer();
    expect(screen.getByText("countDetail")).toBeInTheDocument();
    expect(screen.getByText("sessionInProgress")).toBeInTheDocument();
    expect(screen.getByText("items: 2")).toBeInTheDocument();
    expect(screen.getByText("variance: +3")).toBeInTheDocument();
    expect(screen.getByText("Check the shelves")).toBeInTheDocument();
  });

  it("renders the items table with variance values", () => {
    renderDrawer();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("OF-1")).toBeInTheDocument();
    expect(screen.getByText("Brake Pad")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the empty state when a session has no items", () => {
    renderDrawer({ data: { ...session, items: [] } });
    expect(screen.getByText("noItems")).toBeInTheDocument();
  });

  it("shows negative variance styling for negative totals", () => {
    renderDrawer({ data: { ...session, total_variance: -1 } });
    expect(screen.getByText("variance: -1")).toBeInTheDocument();
  });

  it("closes when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const queryClient = createTestQueryClient();
    mockSessionQuery.mockReturnValue({ data: session, isPending: false });
    render(
      <QueryClientProvider client={queryClient}>
        <StockCountDetailDrawer
          open={true}
          onOpenChange={onOpenChange}
          orgId="org-1"
          sessionId="s1"
        />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
