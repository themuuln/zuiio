import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import PortalInvoicesPage from "../page";

// ─── Sample data ──────────────────────────────────────────────

const sampleInvoices = [
  {
    id: "inv-1",
    invoice_number: "INV-001",
    status: "paid",
    subtotal: 95000,
    total: 95000,
    amount_paid: 95000,
    balance_due: 0,
    issued_at: "2025-01-15T10:00:00Z",
    due_at: "2025-02-15T10:00:00Z",
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "inv-2",
    invoice_number: "INV-002",
    status: "sent",
    subtotal: 150000,
    total: 150000,
    amount_paid: 0,
    balance_due: 150000,
    issued_at: "2025-01-20T10:00:00Z",
    due_at: "2025-02-20T10:00:00Z",
    created_at: "2025-01-20T10:00:00Z",
  },
  {
    id: "inv-3",
    invoice_number: "INV-003",
    status: "overdue",
    subtotal: 50000,
    total: 50000,
    amount_paid: 0,
    balance_due: 50000,
    issued_at: null,
    due_at: "2024-12-01T10:00:00Z",
    created_at: "2024-11-15T10:00:00Z",
  },
];

// ─── Mutable auth mock state (per-test override) ──────────────

let mockAuth: {
  customer: Record<string, unknown> | null;
  loading: boolean;
  token: string | null;
  error: Error | null;
} = {
  customer: { id: "c1" },
  loading: false,
  token: "tok-1",
  error: null,
};

// ─── Module mocks (hoisted to top by Vitest) ──────────────────

vi.mock(import("next-intl"), async (importOriginal) => {
  const mod = await importOriginal();
  const map: Record<string, string> = {
    "portal.invoices": "Invoices",
    "portal.noInvoices": "No invoices yet.",
    "portal.failedToLoadInvoices": "Failed to load invoices.",
    "common.somethingWentWrong": "Something went wrong",
    "common.retry": "Retry",
  };
  return {
    ...mod,
    useTranslations: () => (key: string) => map[key] ?? key,
  };
});

vi.mock("lucide-react", () => ({
  AlertCircle: () => <svg data-testid="icon-alert-circle" />,
  FileText: () => <svg data-testid="icon-file-text" />,
  RefreshCw: () => <svg data-testid="icon-refresh-cw" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/portal/invoices",
  useSearchParams: () => new URLSearchParams("token=tok-1"),
}));

vi.mock("@/hooks/use-portal-auth", () => ({
  usePortalAuth: () => mockAuth,
}));

// ─── Tests ────────────────────────────────────────────────────

describe("PortalInvoicesPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
  });

  // ── 1. Shows loading skeleton ──────────────────────────────

  it("shows loading skeleton when auth loading", () => {
    mockAuth = {
      customer: null,
      loading: true,
      token: null,
      error: null,
    };
    render(<PortalInvoicesPage />);
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.queryByText("No invoices yet.")).not.toBeInTheDocument();
  });

  it("shows loading skeleton when data loading", () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockReturnValue(new Promise<Response>(() => {}));
    render(<PortalInvoicesPage />);
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.queryByText("No invoices yet.")).not.toBeInTheDocument();
  });

  // ── 2. Renders invoice list with correct info ────────────

  it("renders invoice list with invoice number, status, and amounts", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleInvoices }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalInvoicesPage />);

    // Invoice numbers
    expect(await screen.findByText(/#INV-001/)).toBeInTheDocument();
    expect(screen.getByText(/#INV-002/)).toBeInTheDocument();
    expect(screen.getByText(/#INV-003/)).toBeInTheDocument();

    // Status badges
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText("sent")).toBeInTheDocument();
    expect(screen.getByText("overdue")).toBeInTheDocument();
  });

  // ── 3. Shows correct status badges ──────────────────────

  it("shows correct status badges for different invoice statuses", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    const statusSamples = [
      {
        id: "i-a",
        invoice_number: "INV-A",
        status: "draft",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "i-b",
        invoice_number: "INV-B",
        status: "sent",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "i-c",
        invoice_number: "INV-C",
        status: "overdue",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "i-d",
        invoice_number: "INV-D",
        status: "paid",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "i-e",
        invoice_number: "INV-E",
        status: "cancelled",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "i-f",
        invoice_number: "INV-F",
        status: "refunded",
        total: 100,
        created_at: "2025-01-01T00:00:00Z",
      },
    ];
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: statusSamples }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalInvoicesPage />);

    // Each status text should be rendered
    expect(await screen.findByText("draft")).toBeInTheDocument();
    expect(screen.getByText("sent")).toBeInTheDocument();
    expect(screen.getByText("overdue")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText("cancelled")).toBeInTheDocument();
    expect(screen.getByText("refunded")).toBeInTheDocument();
  });

  // ── 4. Shows invoice amounts ────────────────────────────

  it("shows invoice amounts formatted with ₮", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleInvoices }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalInvoicesPage />);

    await screen.findByText(/#INV-001/);

    // Amounts displayed formatted with ₮
    const amounts = screen.getAllByText(/₮/);
    expect(amounts.length).toBeGreaterThanOrEqual(3);

    // Each invoice total is shown: 95000, 150000, 50000
    expect(screen.getByText(/₮ 95,000/)).toBeInTheDocument();
    expect(screen.getByText(/₮ 150,000/)).toBeInTheDocument();
    expect(screen.getByText(/₮ 50,000/)).toBeInTheDocument();
  });

  // ── 5. Shows empty state ─────────────────────────────────

  it("shows empty state when no invoices", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<PortalInvoicesPage />);

    expect(await screen.findByText("No invoices yet.")).toBeInTheDocument();
    expect(screen.getByTestId("icon-file-text")).toBeInTheDocument();
  });

  // ── 6. Error state with retry ────────────────────────────

  it("shows error state with retry button", async () => {
    mockAuth = {
      customer: { id: "c1" },
      loading: false,
      token: "tok-1",
      error: null,
    };
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    render(<PortalInvoicesPage />);

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Failed to load invoices.")).toBeInTheDocument();

    // Switch fetch to succeed for retry
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: sampleInvoices }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    // After retry, the list should render
    expect(await screen.findByText(/#INV-001/)).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
