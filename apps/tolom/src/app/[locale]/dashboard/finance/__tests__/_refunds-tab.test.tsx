import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RefundStats, RefundWithInvoice } from "@/lib/types";
import { render } from "@/test/test-utils";
import { RefundsTab } from "../_refunds-tab";

const mocks = vi.hoisted(() => ({
  useRefundList: vi.fn(),
  useRefundStats: vi.fn(),
  useCancelRefund: vi.fn(),
  cancelMutate: vi.fn(),
  reportServerError: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-refunds", () => ({
  useRefundList: mocks.useRefundList,
  useRefundStats: mocks.useRefundStats,
  useCancelRefund: mocks.useCancelRefund,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

// Export flow is covered elsewhere; keep the toolbar light here.
vi.mock("@/components/export-button", () => ({
  ExportButton: () => <button type="button">Export Excel</button>,
}));

// ── Fixtures ─────────────────────────────────────────────────────
const refunds: RefundWithInvoice[] = [
  {
    id: "r1",
    invoice_id: "inv-1",
    organization_id: "org-1",
    amount: 50000,
    method: "cash",
    reason: "Customer changed mind",
    reference: null,
    notes: null,
    status: "pending",
    refunded_at: "2026-01-10T09:00:00Z",
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-01-10T09:00:00Z",
    created_by: null,
    invoice_number: "INV-0001",
    invoice_total: 50000,
    customer_name: "Bat",
  },
  {
    id: "r2",
    invoice_id: "inv-2",
    organization_id: "org-1",
    amount: 12000,
    method: "bank_transfer",
    reason: null,
    reference: "REF-2",
    notes: null,
    status: "completed",
    refunded_at: "2026-01-08T09:00:00Z",
    created_at: "2026-01-08T09:00:00Z",
    updated_at: "2026-01-08T09:00:00Z",
    created_by: null,
    invoice_number: "INV-0002",
    invoice_total: 12000,
    customer_name: "Sara",
  },
];

const stats: RefundStats = {
  totalRefunded: 62000,
  refundCount: 2,
  pendingAmount: 50000,
};

function setRefunds(data: RefundWithInvoice[] | undefined, isPending: boolean) {
  mocks.useRefundList.mockReturnValue({ data, isPending });
}

function setStats(data: RefundStats | undefined, isPending: boolean) {
  mocks.useRefundStats.mockReturnValue({ data, isPending });
}

function setCancelMutation(overrides: Record<string, unknown> = {}) {
  mocks.useCancelRefund.mockReturnValue({
    mutateAsync: mocks.cancelMutate,
    isPending: false,
    ...overrides,
  });
}

describe("RefundsTab", () => {
  beforeEach(() => {
    setRefunds(refunds, false);
    setStats(stats, false);
    setCancelMutation();
    mocks.cancelMutate.mockReset().mockResolvedValue(refunds[0]);
    mocks.reportServerError.mockReset();
    window.confirm = vi.fn(() => true);
  });

  it("shows KPI and table skeletons while refunds and stats are loading", () => {
    setRefunds(undefined, true);
    setStats(undefined, true);
    render(<RefundsTab orgId="org-1" />);
    // 4 KPI skeletons + 1 table-row skeleton
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBe(5);
  });

  it("renders refund stats and the refund table rows", () => {
    render(<RefundsTab orgId="org-1" />);
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("₮ 62,000")).toBeTruthy();
    expect(screen.getByText("₮ 50,000")).toBeTruthy();
    expect(screen.getByText("₮ 31,000")).toBeTruthy();

    expect(screen.getByText("INV-0001")).toBeTruthy();
    expect(screen.getByText("Bat")).toBeTruthy();
    expect(screen.getByText("-₮ 50,000")).toBeTruthy();
    expect(screen.getByText("cash")).toBeTruthy();
    expect(screen.getByText("Customer changed mind")).toBeTruthy();
    expect(screen.getByText("bank transfer")).toBeTruthy();
    expect(screen.getByText("INV-0002")).toBeTruthy();
    expect(screen.getByText("Sara")).toBeTruthy();
    // Status badges (the filter toolbar renders "Pending"/"Completed" buttons too)
    const table = screen.getByRole("table");
    expect(within(table).getByText("Pending")).toBeTruthy();
    expect(within(table).getByText("Completed")).toBeTruthy();
    expect(
      screen.getByText(new Date("2026-01-10T09:00:00Z").toLocaleDateString()),
    ).toBeTruthy();
    expect(
      screen.getByText(new Date("2026-01-08T09:00:00Z").toLocaleDateString()),
    ).toBeTruthy();

    // Only the pending refund offers a cancel action
    expect(
      screen.getAllByRole("button", { name: "common.cancel" }),
    ).toHaveLength(1);
  });

  it("shows the empty state with zeroed KPIs when there are no refunds", () => {
    setRefunds([], false);
    setStats({ totalRefunded: 0, refundCount: 0, pendingAmount: 0 }, false);
    render(<RefundsTab orgId="org-1" />);
    expect(screen.getByText("refund.noRefunds")).toBeTruthy();
    expect(screen.getByText("refund.noRefundsDesc")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getAllByText("₮ 0").length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByRole("button", { name: "common.cancel" })).toBeNull();
  });

  it("re-queries the refund list when a status filter is selected", async () => {
    const user = userEvent.setup();
    render(<RefundsTab orgId="org-1" />);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Pending" }));
    });
    expect(mocks.useRefundList).toHaveBeenLastCalledWith("org-1", "pending");

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "All" }));
    });
    expect(mocks.useRefundList).toHaveBeenLastCalledWith("org-1", "");
  });

  it("filters the table rows by the search query", async () => {
    const user = userEvent.setup();
    render(<RefundsTab orgId="org-1" />);
    await waitFor(() => expect(screen.getByText("INV-0001")).toBeTruthy());

    const input = screen.getByRole("textbox", {
      name: "refund.searchPlaceholder",
    });
    await act(async () => {
      // "REF-2" only matches the second refund's reference field
      await user.type(input, "REF-2");
      await user.keyboard("{Enter}");
    });

    await waitFor(() => expect(screen.queryByText("INV-0001")).toBeNull());
    expect(screen.getByText("INV-0002")).toBeTruthy();
    expect(screen.getByText("1 result")).toBeTruthy();
  });

  it("shows a no-matches label when the search matches nothing", async () => {
    const user = userEvent.setup();
    render(<RefundsTab orgId="org-1" />);
    await waitFor(() => expect(screen.getByText("INV-0001")).toBeTruthy());

    const input = screen.getByRole("textbox", {
      name: "refund.searchPlaceholder",
    });
    await act(async () => {
      await user.type(input, "zzz");
      await user.keyboard("{Enter}");
    });

    await waitFor(() =>
      expect(screen.getByText('No matches for "zzz"')).toBeTruthy(),
    );
    expect(screen.queryByText("INV-0001")).toBeNull();
  });

  it("cancels a pending refund with the refund id after confirmation", async () => {
    const user = userEvent.setup();
    render(<RefundsTab orgId="org-1" />);
    await act(async () => {
      await user.click(
        screen.getAllByRole("button", { name: "common.cancel" })[0],
      );
    });
    expect(window.confirm).toHaveBeenCalledWith("refund.confirmCancel");
    expect(mocks.cancelMutate).toHaveBeenCalledWith("r1");
  });

  it("skips the mutation when the confirmation is dismissed", async () => {
    window.confirm = vi.fn(() => false);
    const user = userEvent.setup();
    render(<RefundsTab orgId="org-1" />);
    await act(async () => {
      await user.click(
        screen.getAllByRole("button", { name: "common.cancel" })[0],
      );
    });
    expect(mocks.cancelMutate).not.toHaveBeenCalled();
  });

  it("reports the error via reportServerError when the cancel mutation fails", async () => {
    mocks.cancelMutate.mockRejectedValue(new Error("cancel boom"));
    const user = userEvent.setup();
    render(<RefundsTab orgId="org-1" />);
    await act(async () => {
      await user.click(
        screen.getAllByRole("button", { name: "common.cancel" })[0],
      );
    });
    await waitFor(() =>
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      ),
    );
  });

  it("disables the cancel button while the cancel mutation is pending", () => {
    setCancelMutation({ isPending: true });
    render(<RefundsTab orgId="org-1" />);
    const cancel = screen.getAllByRole("button", { name: "common.cancel" })[0];
    expect((cancel as HTMLButtonElement).disabled).toBe(true);
  });
});
