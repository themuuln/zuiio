import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangeStatusDrawer } from "@/components/work-orders/change-status-drawer";
import { render } from "@/test/test-utils";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockMutate = vi.fn();
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useMutation: () => ({
      mutate: mockMutate,
      isPending: false,
    }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
      getQueriesData: vi.fn().mockReturnValue([]),
      setQueryData: vi.fn(),
    }),
  };
});

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "test-org" },
  }),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => {
      const messages: Record<string, string> = {
        changeStatus: "Change Status",
        statusNew: "New",
        statusDiagnosing: "Diagnosing",
        statusInProgress: "In Progress",
        statusReadyForPickup: "Ready for Pickup",
        statusCompleted: "Completed",
        currentStatus: "Current Status",
        statusChanged: "Status changed",
      };
      return messages[key] ?? key;
    },
  };
});

vi.mock("@/lib/queries/keys", () => ({
  workOrderKeys: {
    all: (orgId: string) => ["organizations", orgId, "work-orders"],
  },
  inventoryKeys: {
    balances: (orgId: string) => [
      "organizations",
      orgId,
      "inventory",
      "balances",
    ],
    movements: (orgId: string) => [
      "organizations",
      orgId,
      "inventory",
      "movements",
    ],
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@/components/ui/detail-drawer", () => ({
  DetailDrawer: Object.assign(
    ({
      open,
      children,
    }: {
      open: boolean;
      children: React.ReactNode;
      onOpenChange?: (open: boolean) => void;
    }) => (open ? <div data-testid="detail-drawer">{children}</div> : null),
    {
      Header: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-header">{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-title">{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-description">{children}</div>
      ),
      Body: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => (
        <div data-testid="drawer-body" className={className}>
          {children}
        </div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer">{children}</div>
      ),
      FooterActions: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer-actions">{children}</div>
      ),
      Section: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-section">{children}</div>
      ),
      Divider: () => <hr data-testid="drawer-divider" />,
    },
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | boolean | undefined | null)[]) =>
    classes.filter(Boolean).join(" "),
}));

// ── Tests ──────────────────────────────────────────────────────────────

describe("ChangeStatusDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    workOrderId: "wo-001",
    currentStatus: "New",
  };

  it("renders drawer title text", () => {
    render(<ChangeStatusDrawer {...defaultProps} />);
    expect(screen.getByText("Change Status")).toBeInTheDocument();
  });

  it("renders all status flow options", () => {
    render(<ChangeStatusDrawer {...defaultProps} />);
    // "New" appears both as current status badge and as a flow option button
    expect(screen.getAllByText("New").length).toBeGreaterThan(0);
    expect(screen.getByText("Diagnosing")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Ready for Pickup")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("highlights current status by disabling its button", () => {
    render(<ChangeStatusDrawer {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    const currentBtn = buttons.find((btn) => btn.disabled);
    expect(currentBtn).toBeInTheDocument();
    expect(currentBtn).toHaveTextContent("New");
  });

  it("clicking a different status triggers mutation", () => {
    render(<ChangeStatusDrawer {...defaultProps} />);
    const targetBtn = screen.getByRole("button", { name: /In Progress/ });
    expect(targetBtn).not.toBeDisabled();
    fireEvent.click(targetBtn);
    expect(mockMutate).toHaveBeenCalledWith({
      woId: "wo-001",
      status: "In Progress",
    });
  });
});
