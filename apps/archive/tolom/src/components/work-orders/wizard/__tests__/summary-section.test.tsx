import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { SummarySection } from "../summary-section";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockHandleCreate = vi.fn();
let mockCtx: Record<string, unknown>;

vi.mock("../wizard-context", () => ({
  useWizardContext: () => mockCtx,
}));

vi.mock("next-intl", () => {
  const NextIntlClientProvider = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );
  return {
    NextIntlClientProvider,
    useTranslations: () => (key: string, _values?: unknown) => key,
  };
});

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

vi.mock("lucide-react", () => {
  const Icon = () => <svg data-testid="lucide-icon" />;
  return { Wrench: Icon };
});

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────

function createMockCtx(overrides?: Record<string, unknown>) {
  return {
    servicesTotal: 100000,
    partsTotal: 40000,
    grandTotal: 135000,
    isFormValid: true,
    saving: false,
    handleCreate: mockHandleCreate,
    ...overrides,
  };
}

function renderSummary() {
  return render(<SummarySection />);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("SummarySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = createMockCtx();
  });

  it("renders the summary card with wizard step attribute", () => {
    const { container } = renderSummary();
    expect(
      container.querySelector('[data-wizard-step="summary"]'),
    ).toBeInTheDocument();
  });

  it("shows services, parts and grand totals with exact formatting", () => {
    renderSummary();
    expect(screen.getByText("servicesTotal")).toBeInTheDocument();
    expect(screen.getByText("partsTotal")).toBeInTheDocument();
    expect(screen.getByText("grandTotal")).toBeInTheDocument();
    expect(screen.getByText("₮ 100,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 40,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 135,000")).toBeInTheDocument();
  });

  it("calls handleCreate when the create button is clicked", async () => {
    const user = userEvent.setup();
    renderSummary();
    await user.click(screen.getByText("createWorkOrder"));
    expect(mockHandleCreate).toHaveBeenCalledTimes(1);
  });

  it("disables the create button when the form is invalid", () => {
    mockCtx = createMockCtx({ isFormValid: false });
    renderSummary();
    const createButton = screen.getByText("createWorkOrder").closest("button");
    expect(createButton).toBeDisabled();
  });

  it("enables the create button when the form is valid", () => {
    renderSummary();
    const createButton = screen.getByText("createWorkOrder").closest("button");
    expect(createButton).not.toBeDisabled();
  });

  it("shows the creating label while saving", () => {
    mockCtx = createMockCtx({ saving: true });
    renderSummary();
    expect(screen.getByText("creating")).toBeInTheDocument();
    expect(screen.queryByText("createWorkOrder")).not.toBeInTheDocument();
  });

  it("renders the cancel link to the work orders page", () => {
    renderSummary();
    const cancel = screen.getByText("cancel").closest("a");
    expect(cancel).toHaveAttribute("href", "/dashboard/work-orders");
  });
});
