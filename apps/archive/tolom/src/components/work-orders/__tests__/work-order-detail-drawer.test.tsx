import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkOrderAttachment, WorkOrderDetail } from "@/lib/types";
import { render } from "@/test/test-utils";
import { WorkOrderDetailDrawer } from "../work-order-detail-drawer";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const mockMutateStatus =
  vi.fn<
    (
      vars: { woId: string; status: string },
      opts: {
        onSuccess?: (
          data: unknown,
          vars: { woId: string; status: string },
        ) => void;
        onError?: (err: Error) => void;
      },
    ) => void
  >();

const mockUseWorkOrderDetail = vi.fn();
let mockOrgResult: { data: { orgId: string | undefined } | null };

vi.mock("next-intl", () => {
  const NextIntlClientProvider = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  return {
    NextIntlClientProvider,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({ toast: mockToast }));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => mockOrgResult,
}));

vi.mock("@/lib/queries/use-work-order-detail", () => ({
  useWorkOrderDetail: (...args: unknown[]) => mockUseWorkOrderDetail(...args),
  useUpdateWorkOrderStatus: () => ({
    mutate: mockMutateStatus,
    isPending: false,
  }),
}));

vi.mock("@/components/ui/detail-drawer", () => {
  const Root = ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
  }) =>
    open ? (
      <div data-testid="detail-drawer">
        <button
          type="button"
          data-testid="drawer-close"
          onClick={() => onOpenChange(false)}
        >
          close
        </button>
        {children}
      </div>
    ) : null;
  const Header = ({
    children,
    actions,
  }: {
    children: ReactNode;
    actions?: ReactNode;
  }) => (
    <div data-testid="drawer-header">
      {children}
      {actions}
    </div>
  );
  const Title = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-title">{children}</div>
  );
  const Description = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-description">{children}</div>
  );
  const Body = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-body">{children}</div>
  );
  const Footer = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-footer">{children}</div>
  );
  return {
    DetailDrawer: Object.assign(Root, {
      Header,
      Title,
      Description,
      Body,
      Footer,
    }),
  };
});

vi.mock("@/components/ui/dropdown-menu", () => {
  const Trigger = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <button type="button" data-testid="status-trigger" className={className}>
      {children}
    </button>
  );
  const Content = ({ children }: { children: ReactNode }) => (
    <div data-testid="status-menu">{children}</div>
  );
  const Group = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  const Item = ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
  return {
    DropdownMenu: Group,
    DropdownMenuTrigger: Trigger,
    DropdownMenuContent: Content,
    DropdownMenuGroup: Group,
    DropdownMenuItem: Item,
  };
});

vi.mock("@/components/ui/badge", () => ({
  badgeVariants: () => "badge-mock",
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-slot="skeleton" />,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

vi.mock("lucide-react", () => {
  const Icon = () => <svg data-testid="lucide-icon" />;
  return {
    ArrowUpDown: Icon,
    Calendar: Icon,
    ChevronDown: Icon,
    ChevronRight: Icon,
    FileText: Icon,
    Paperclip: Icon,
    Wrench: Icon,
  };
});

vi.mock("@/components/work-orders/line-items", () => ({
  LineItemRow: ({ name, finalPrice }: { name: string; finalPrice: number }) => (
    <div data-testid="line-item-row">
      {name} — {finalPrice}
    </div>
  ),
  TotalsSummary: ({
    servicesTotal,
    partsTotal,
    grandTotal,
    discountTotal,
    serviceCount,
    partCount,
    nuatEnabled,
  }: {
    servicesTotal: number;
    partsTotal: number;
    grandTotal: number;
    discountTotal: number;
    serviceCount: number;
    partCount: number;
    nuatEnabled?: boolean;
    t: (key: string) => string;
  }) => (
    <div
      data-testid="totals-summary"
      data-services={servicesTotal}
      data-parts={partsTotal}
      data-grand={grandTotal}
      data-discount={discountTotal}
      data-svccount={serviceCount}
      data-partcount={partCount}
      data-nuat={String(nuatEnabled ?? false)}
    />
  ),
}));

// ── Fixtures ───────────────────────────────────────────────────────────

function makeWorkOrder(
  overrides: Partial<WorkOrderDetail> = {},
): WorkOrderDetail {
  const hoursAgo = (h: number) =>
    new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
  const minutesAgo = (m: number) =>
    new Date(Date.now() - m * 60 * 1000).toISOString();
  return {
    id: "wo-12345",
    organization_id: "org-1",
    branch_id: null,
    customer_id: null,
    vehicle_id: null,
    mechanic_id: "mech-1",
    status: "In Progress",
    complaint: "Engine noise",
    diagnosis: "Worn belt",
    description: null,
    notes: null,
    mechanic_notes: null,
    diagnosis_label_id: null,
    bay_number: 3,
    queue_order: 1,
    odometer_at_service: null,
    discount_amount: 0,
    discount_percentage: 0,
    discount_total: 5000,
    subtotal: 135000,
    total: 135000,
    completed_at: null,
    started_at: minutesAgo(61),
    created_at: hoursAgo(48),
    updated_at: hoursAgo(1),
    created_by: null,
    updated_by: null,
    deleted_at: null,
    customer: null,
    vehicle: null,
    mechanic: { id: "mech-1", full_name: "Alice Smith" },
    helpers: [
      {
        id: "h-1",
        full_name: "Bob",
      } as unknown as WorkOrderDetail["helpers"][number],
    ],
    services: [
      {
        id: "svc-1",
        service_name: "Oil Change",
        final_price: 30000,
      } as unknown as WorkOrderDetail["services"][number],
      {
        id: "svc-2",
        service_name: "Tire Rotation",
        final_price: 70000,
      } as unknown as WorkOrderDetail["services"][number],
    ],
    parts: [
      {
        id: "part-1",
        part_name: "Oil Filter",
        final_price: 25000,
      } as unknown as WorkOrderDetail["parts"][number],
      {
        id: "part-2",
        part_name: "Drain Plug",
        final_price: 15000,
      } as unknown as WorkOrderDetail["parts"][number],
    ],
    status_history: [
      {
        id: "h1",
        status: "New",
        created_at: hoursAgo(48),
      } as unknown as WorkOrderDetail["status_history"][number],
      {
        id: "h2",
        status: "Diagnosing",
        created_at: hoursAgo(24),
      } as unknown as WorkOrderDetail["status_history"][number],
      {
        id: "h3",
        status: "In Progress",
        created_at: hoursAgo(61),
      } as unknown as WorkOrderDetail["status_history"][number],
    ],
    service_history: [],
    attachments: [
      { id: "a1", deleted_at: null } as unknown as WorkOrderAttachment,
      { id: "a2", deleted_at: null } as unknown as WorkOrderAttachment,
      { id: "a3", deleted_at: hoursAgo(1) } as unknown as WorkOrderAttachment,
    ],
    nuat_enabled: false,
    ...overrides,
  };
}

function mockDetailSuccess(wo: WorkOrderDetail = makeWorkOrder()) {
  mockUseWorkOrderDetail.mockReturnValue({
    data: wo,
    isPending: false,
    error: null,
  });
}

function renderDrawer(onOpenChange = vi.fn()) {
  return render(
    <WorkOrderDetailDrawer
      open
      onOpenChange={onOpenChange}
      workOrderId="wo-12345"
    />,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("WorkOrderDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgResult = { data: { orgId: "org-1" } };
    mockDetailSuccess();
    mockMutateStatus.mockImplementation((_vars, opts) => {
      opts?.onSuccess?.(null, _vars);
    });
  });

  it("does not render anything when closed", () => {
    render(
      <WorkOrderDetailDrawer
        open={false}
        onOpenChange={vi.fn()}
        workOrderId="wo-12345"
      />,
    );
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("shows loading skeleton while the work order is pending", () => {
    mockUseWorkOrderDetail.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    });
    const { container } = renderDrawer();
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("shows the fetch error message when the query fails", () => {
    mockUseWorkOrderDetail.mockReturnValue({
      data: makeWorkOrder(),
      isPending: false,
      error: new Error("boom"),
    });
    renderDrawer();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("falls back to not-found message when no org is available", () => {
    mockOrgResult = { data: { orgId: undefined } };
    renderDrawer();
    expect(screen.getByText("Work order not found")).toBeInTheDocument();
  });

  it("renders header with truncated id, bay number and elapsed time", () => {
    renderDrawer();
    expect(screen.getByText("#wo-12345")).toBeInTheDocument();
    expect(screen.getByText("Bay 3")).toBeInTheDocument();
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });

  it("renders complaint and diagnosis with diagnosis label", () => {
    const wo = makeWorkOrder({
      diagnosis_label: {
        id: "label-1",
        name: "Belt",
      } as WorkOrderDetail["diagnosis_label"],
    });
    mockDetailSuccess(wo);
    renderDrawer();
    expect(screen.getByText("Engine noise")).toBeInTheDocument();
    expect(screen.getByText("Worn belt")).toBeInTheDocument();
    expect(screen.getByText("· Belt")).toBeInTheDocument();
  });

  it("renders the team with mechanic and helper names", () => {
    renderDrawer();
    // Mechanic appears in the Team row and the footer
    expect(screen.getAllByText("Alice Smith")).toHaveLength(2);
    expect(screen.getByText("+ Bob")).toBeInTheDocument();
  });

  it("renders status history entries with durations", () => {
    renderDrawer();
    const body = screen.getByTestId("drawer-body");
    // Timeline entries scoped to the body — statuses also appear in the menu
    expect(within(body).getByText("New")).toBeInTheDocument();
    expect(within(body).getByText("Diagnosing")).toBeInTheDocument();
    // Duration between Diagnosing (24h ago) and New (48h ago) = 24h → "1d 0h"
    expect(within(body).getByText("1d 0h")).toBeInTheDocument();
  });

  it("renders service and part line items", () => {
    renderDrawer();
    const rows = screen.getAllByTestId("line-item-row");
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent("Oil Change");
    expect(rows[1]).toHaveTextContent("Tire Rotation");
    expect(rows[2]).toHaveTextContent("Oil Filter");
    expect(rows[3]).toHaveTextContent("Drain Plug");
  });

  it("computes totals from line items and discount exactly", () => {
    renderDrawer();
    const totals = screen.getByTestId("totals-summary");
    // services: 30000 + 70000 = 100000
    expect(totals).toHaveAttribute("data-services", "100000");
    // parts: 25000 + 15000 = 40000
    expect(totals).toHaveAttribute("data-parts", "40000");
    // grand = 100000 + 40000 - 5000 discount = 135000
    expect(totals).toHaveAttribute("data-grand", "135000");
    expect(totals).toHaveAttribute("data-discount", "5000");
    expect(totals).toHaveAttribute("data-svccount", "2");
    expect(totals).toHaveAttribute("data-partcount", "2");
  });

  it("shows attachment count excluding deleted attachments", () => {
    renderDrawer();
    expect(screen.getByText("2 files")).toBeInTheDocument();
  });

  it("calls the status mutation and shows a success toast on change", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByText("Completed"));
    expect(mockMutateStatus).toHaveBeenCalledWith(
      { woId: "wo-12345", status: "Completed" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockToast.success).toHaveBeenCalledWith("statusChanged: Completed");
  });

  it("shows an error toast when the status mutation fails", async () => {
    mockMutateStatus.mockImplementation((_vars, opts) => {
      opts?.onError?.(new Error("status update failed"));
    });
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByText("Completed"));
    expect(mockToast.error).toHaveBeenCalledWith("status update failed");
  });

  it("does not offer the current status in the menu", () => {
    renderDrawer();
    // Current status is "In Progress" and "Cancelled" is always filtered
    expect(screen.queryByText("Cancelled")).not.toBeInTheDocument();
  });

  it("closes the drawer via onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderDrawer(onOpenChange);
    await user.click(screen.getByTestId("drawer-close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("opens the full page in a new tab", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByText("Open Full Page"));
    expect(openSpy).toHaveBeenCalledWith(
      "/dashboard/work-orders/wo-12345",
      "_blank",
    );
    openSpy.mockRestore();
  });
});
