import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createContext, type ReactNode, useContext } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { NewWorkOrderDrawer } from "../new-work-order-drawer";

// ── Mock state (vi.hoisted so it's available in mock factories) ───────
const mockWizard = vi.hoisted(() => ({
  loading: false,
  saving: false,
  isFormValid: true,
  grandTotal: 60000,
  servicesTotal: 35000,
  partsTotal: 25000,
  handleCreate: vi.fn(),
}));

// ── Mock next-intl ────────────────────────────────────────────────────
vi.mock("next-intl", () => {
  const NextIntlClientProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => <>{children}</>;
  return {
    NextIntlClientProvider,
    useTranslations: () => (key: string) => key,
  };
});

// ── Mock utils (cn + formatCurrency) ─────────────────────────────────
vi.mock("@/lib/utils", () => ({
  formatCurrency: (v: number) => `₮${v.toLocaleString()}`,
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));

// ── Mock wizard context ──────────────────────────────────────────────
const WizardTestContext = createContext<Record<string, unknown> | null>(null);

vi.mock("@/components/work-orders/wizard", () => ({
  useWizardContext: () => {
    const ctx = useContext(WizardTestContext);
    if (!ctx) throw new Error("useWizardContext must be within WizardProvider");
    return ctx;
  },
  WizardProvider: ({ children }: { children: ReactNode }) => (
    <WizardTestContext.Provider
      value={{
        loading: mockWizard.loading,
        saving: mockWizard.saving,
        isFormValid: mockWizard.isFormValid,
        grandTotal: mockWizard.grandTotal,
        servicesTotal: mockWizard.servicesTotal,
        partsTotal: mockWizard.partsTotal,
        handleCreate: mockWizard.handleCreate,
      }}
    >
      {children}
    </WizardTestContext.Provider>
  ),
  ComplaintSection: () => <div data-testid="complaint-section">Complaint</div>,
  CustomerSection: () => <div data-testid="customer-section">Customer</div>,
  MechanicSection: () => <div data-testid="mechanic-section">Mechanic</div>,
  PartsSection: () => <div data-testid="parts-section">Parts</div>,
  ServicesSection: () => <div data-testid="services-section">Services</div>,
  VehicleSection: () => <div data-testid="vehicle-section">Vehicle</div>,
}));

// ── Mock DetailDrawer (with sub-components as properties) ─────────────
vi.mock("@/components/ui/detail-drawer", () => {
  const DetailDrawer: any = ({
    open,
    _onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    children: ReactNode;
  }) =>
    open ? (
      <div data-testid="detail-drawer" data-open={String(open)}>
        {children}
      </div>
    ) : null;
  DetailDrawer.Header = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-header">{children}</div>
  );
  DetailDrawer.Title = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-title">{children}</div>
  );
  DetailDrawer.Body = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-body">{children}</div>
  );
  DetailDrawer.Footer = ({ children }: { children: ReactNode }) => (
    <div data-testid="drawer-footer">{children}</div>
  );
  return { DetailDrawer };
});

// ── Messages ──────────────────────────────────────────────────────────
const messages = {
  workOrders: { newWorkOrder: "newWorkOrder" },
  workOrderWizard: {
    servicesTotal: "servicesTotal",
    partsTotal: "partsTotal",
    grandTotal: "grandTotal",
    cancel: "cancel",
    createWorkOrder: "createWorkOrder",
    creating: "creating",
  },
};

// ── Tests ──────────────────────────────────────────────────────────────
describe("NewWorkOrderDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWizard.loading = false;
    mockWizard.saving = false;
    mockWizard.isFormValid = true;
    mockWizard.grandTotal = 60000;
    mockWizard.servicesTotal = 35000;
    mockWizard.partsTotal = 25000;
    mockWizard.handleCreate.mockReset();
  });

  it("renders drawer with title when open", () => {
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    expect(screen.getByTestId("detail-drawer")).toBeInTheDocument();
    expect(screen.getByText("newWorkOrder")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<NewWorkOrderDrawer open={false} onOpenChange={vi.fn()} />, {
      messages,
    });
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("shows loading skeleton when WizardProvider.loading is true", () => {
    mockWizard.loading = true;
    const { container } = render(
      <NewWorkOrderDrawer open onOpenChange={vi.fn()} />,
      { messages },
    );
    expect(
      container.querySelector('[data-testid="detail-drawer"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });

  it("renders all wizard sections when not loading", () => {
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    expect(screen.getByTestId("customer-section")).toBeInTheDocument();
    expect(screen.getByTestId("vehicle-section")).toBeInTheDocument();
    expect(screen.getByTestId("complaint-section")).toBeInTheDocument();
    expect(screen.getByTestId("services-section")).toBeInTheDocument();
    expect(screen.getByTestId("parts-section")).toBeInTheDocument();
    expect(screen.getByTestId("mechanic-section")).toBeInTheDocument();
  });

  it("renders summary section with totals", () => {
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    expect(screen.getByText("servicesTotal")).toBeInTheDocument();
    expect(screen.getByText("partsTotal")).toBeInTheDocument();
    expect(screen.getByText("₮35,000")).toBeInTheDocument();
    expect(screen.getByText("₮25,000")).toBeInTheDocument();
  });

  it("renders cancel and create buttons", () => {
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    expect(screen.getByText("cancel")).toBeInTheDocument();
    expect(screen.getByText("createWorkOrder")).toBeInTheDocument();
  });

  it("disables create button when form is invalid", () => {
    mockWizard.isFormValid = false;
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    const createButton = screen.getByText("createWorkOrder").closest("button");
    expect(createButton).toBeDisabled();
  });

  it("enables create button when form is valid", () => {
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    const createButton = screen.getByText("createWorkOrder").closest("button");
    expect(createButton).not.toBeDisabled();
  });

  it("shows creating text when saving", () => {
    mockWizard.saving = true;
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    expect(screen.getByText("creating")).toBeInTheDocument();
  });

  it("calls handleCreate when create button is clicked", async () => {
    const user = userEvent.setup();
    render(<NewWorkOrderDrawer open onOpenChange={vi.fn()} />, { messages });
    await user.click(screen.getByText("createWorkOrder"));
    expect(mockWizard.handleCreate).toHaveBeenCalled();
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<NewWorkOrderDrawer open onOpenChange={onOpenChange} />, {
      messages,
    });
    await user.click(screen.getByText("cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
