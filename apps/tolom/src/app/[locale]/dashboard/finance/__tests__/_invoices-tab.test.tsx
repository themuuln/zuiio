import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { InvoicesTab } from "../_invoices-tab";

const mocks = vi.hoisted(() => ({
  useInvoiceStats: vi.fn(),
  useInvoices: vi.fn(),
  useSendInvoiceEmail: vi.fn(),
  sendEmailMutate: vi.fn(),
  reportServerError: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  clipboardWrite: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// useTableFilters reads URL query state via nuqs; keep it stateful and local.
vi.mock("nuqs", async () => {
  const React = await import("react");
  return {
    useQueryState: (
      _key: string,
      options?: { defaultValue?: string | number },
    ) => {
      const [value, setValue] = React.useState(options?.defaultValue ?? "");
      const setter = React.useCallback((v: string) => {
        setValue(v);
        return Promise.resolve();
      }, []);
      return [value, setter];
    },
    parseAsString: { withDefault: (def: string) => ({ defaultValue: def }) },
    parseAsInteger: { withDefault: (def: number) => ({ defaultValue: def }) },
  };
});

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/lib/queries/use-invoices", () => ({
  useInvoiceStats: mocks.useInvoiceStats,
  useInvoices: mocks.useInvoices,
  useSendInvoiceEmail: mocks.useSendInvoiceEmail,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

// Export flow is covered elsewhere; keep the toolbar light here.
vi.mock("@/components/export-button", () => ({
  ExportButton: () => <button type="button">Export Excel</button>,
}));

// ── Fixtures ─────────────────────────────────────────────────────
interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  balance_due: number;
  amount_paid: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  vehicle_plate: string | null;
  public_token: string;
  email_sent_at: string | null;
  issued_at: string;
  due_at: string | null;
}

const invoices: InvoiceListItem[] = [
  {
    id: "inv-1",
    invoice_number: "INV-0001",
    status: "paid",
    total: 100000,
    balance_due: 0,
    amount_paid: 100000,
    customer_name: "Bat",
    customer_email: "bat@example.com",
    customer_phone: null,
    vehicle_plate: "1234УБА",
    public_token: "tok-1",
    email_sent_at: "2026-01-05T10:00:00Z",
    issued_at: "2026-01-05T00:00:00Z",
    due_at: null,
  },
  {
    id: "inv-2",
    invoice_number: "INV-0002",
    status: "sent",
    total: 50000,
    balance_due: 50000,
    amount_paid: 0,
    customer_name: "Sara",
    customer_email: null,
    customer_phone: "99111111",
    vehicle_plate: null,
    public_token: "tok-2",
    email_sent_at: null,
    issued_at: "2026-01-10T00:00:00Z",
    due_at: "2026-01-20T00:00:00Z",
  },
  {
    id: "inv-3",
    invoice_number: "INV-0003",
    status: "overdue",
    total: 200000,
    balance_due: 200000,
    amount_paid: 0,
    customer_name: null,
    customer_email: null,
    customer_phone: null,
    vehicle_plate: "9999УБА",
    public_token: "tok-3",
    email_sent_at: null,
    issued_at: "2025-12-01T00:00:00Z",
    due_at: "2025-12-15T00:00:00Z",
  },
];

const stats = {
  total: 3,
  draft: 0,
  sent: 1,
  paid: 1,
  overdue: 1,
  totalRevenue: 100000,
  outstanding: 250000,
};

function setStats(data: typeof stats | undefined, isPending: boolean) {
  mocks.useInvoiceStats.mockReturnValue({ data, isPending });
}

function setInvoices(data: InvoiceListItem[] | undefined, isPending: boolean) {
  mocks.useInvoices.mockReturnValue({ data, isPending });
}

function setSendEmail(overrides: Record<string, unknown> = {}) {
  mocks.useSendInvoiceEmail.mockReturnValue({
    mutateAsync: mocks.sendEmailMutate,
    isPending: false,
    ...overrides,
  });
}

function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

describe("InvoicesTab", () => {
  beforeEach(() => {
    setStats(stats, false);
    setInvoices(invoices, false);
    setSendEmail();
    mocks.sendEmailMutate.mockReset().mockResolvedValue({} as never);
    mocks.reportServerError.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.clipboardWrite.mockReset().mockResolvedValue(undefined);
  });

  it("shows KPI and table skeletons while stats and invoices are loading", () => {
    setStats(undefined, true);
    setInvoices(undefined, true);
    render(<InvoicesTab orgId="org-1" />);
    // 4 KPI skeletons + 1 table-row skeleton
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBe(5);
  });

  it("renders invoice stats and the invoice table rows", () => {
    render(<InvoicesTab orgId="org-1" />);
    // KPI values: total, sent, paid, outstanding + subtitles
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("₮ 250,000")).toBeTruthy();
    expect(screen.getByText("1 overdueCount")).toBeTruthy();
    expect(screen.getAllByText("₮ 100,000").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("INV-0001")).toBeTruthy();
    expect(screen.getByText("INV-0002")).toBeTruthy();
    expect(screen.getByText("INV-0003")).toBeTruthy();
    expect(screen.getByText("Bat")).toBeTruthy();
    expect(screen.getByText("Sara")).toBeTruthy();
    expect(screen.getByText("1234УБА")).toBeTruthy();
    expect(screen.getByText("9999УБА")).toBeTruthy();
    // Status badges (the filter toolbar renders the same label keys as buttons)
    const table = screen.getByRole("table");
    expect(within(table).getByText("statusPaid")).toBeTruthy();
    expect(within(table).getByText("statusSent")).toBeTruthy();
    expect(within(table).getByText("statusOverdue")).toBeTruthy();
    expect(screen.getByText("₮ 50,000")).toBeTruthy();
    expect(screen.getByText("₮ 200,000")).toBeTruthy();
    expect(
      screen.getByText(formatInvoiceDate("2026-01-05T00:00:00Z")),
    ).toBeTruthy();
    expect(
      screen.getByText(formatInvoiceDate("2026-01-10T00:00:00Z")),
    ).toBeTruthy();
    expect(
      screen.getByText(formatInvoiceDate("2025-12-01T00:00:00Z")),
    ).toBeTruthy();
  });

  it("shows the sent badge and hides the email button for invoices that were already emailed", () => {
    render(<InvoicesTab orgId="org-1" />);
    expect(screen.getByText("sentBadge")).toBeTruthy();
    // inv-1 was emailed → only inv-2 and inv-3 get an email button
    expect(screen.getAllByRole("button", { name: "email" })).toHaveLength(2);
  });

  it("shows the empty state with zeroed KPIs when there are no invoices", () => {
    setInvoices([], false);
    setStats(
      {
        total: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        totalRevenue: 0,
        outstanding: 0,
      },
      false,
    );
    render(<InvoicesTab orgId="org-1" />);
    expect(screen.getByText("No invoices found")).toBeTruthy();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("₮ 0")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "email" })).toBeNull();
  });

  it("re-queries the invoice list when a status filter is selected", async () => {
    const user = userEvent.setup();
    render(<InvoicesTab orgId="org-1" />);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "statusPaid" }));
    });
    expect(mocks.useInvoices).toHaveBeenLastCalledWith("org-1", "paid");

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "filterAll" }));
    });
    expect(mocks.useInvoices).toHaveBeenLastCalledWith("org-1", "");
  });

  it("filters the table rows by the search query and shows the result label", async () => {
    const user = userEvent.setup();
    render(<InvoicesTab orgId="org-1" />);
    await waitFor(() => expect(screen.getByText("INV-0001")).toBeTruthy());

    const input = screen.getByRole("textbox", { name: "searchInvoices" });
    await act(async () => {
      // "Sara" only matches the second invoice's customer name
      await user.type(input, "Sara");
      await user.keyboard("{Enter}");
    });

    await waitFor(() => expect(screen.queryByText("INV-0001")).toBeNull());
    expect(screen.queryByText("INV-0003")).toBeNull();
    expect(screen.getByText("Sara")).toBeTruthy();
    expect(screen.getByText("resultsCount")).toBeTruthy();
  });

  it("sends the invoice email with the invoice id as the mutation payload", async () => {
    const user = userEvent.setup();
    render(<InvoicesTab orgId="org-1" />);
    await act(async () => {
      // inv-1 was already emailed → first email button belongs to inv-2
      await user.click(screen.getAllByRole("button", { name: "email" })[0]);
    });
    await waitFor(() =>
      expect(mocks.sendEmailMutate).toHaveBeenCalledWith({
        invoiceId: "inv-2",
      }),
    );
  });

  it("reports the error via reportServerError when sending the email fails", async () => {
    mocks.sendEmailMutate.mockRejectedValue(new Error("smtp boom"));
    const user = userEvent.setup();
    render(<InvoicesTab orgId="org-1" />);
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: "email" })[0]);
    });
    await waitFor(() =>
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      ),
    );
  });

  it("does not send emails when no org is available", async () => {
    const user = userEvent.setup();
    render(<InvoicesTab orgId={null} />);
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: "email" })[0]);
    });
    expect(mocks.sendEmailMutate).not.toHaveBeenCalled();
  });

  it("copies the public invoice link to the clipboard and toasts", async () => {
    const user = userEvent.setup();
    render(<InvoicesTab orgId="org-1" />);
    // jsdom's own clipboard stub re-attaches between tests; spy on the live
    // instance after render so the component's writeText call is recorded.
    if (navigator.clipboard) {
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(
        mocks.clipboardWrite,
      );
    }
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: "share" })[0]);
    });
    expect(mocks.clipboardWrite).toHaveBeenCalledWith(
      `${window.location.origin}/invoice/tok-1`,
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("linkCopied");
  });
});
