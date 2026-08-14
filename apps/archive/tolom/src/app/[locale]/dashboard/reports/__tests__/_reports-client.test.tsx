import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import ReportsPage from "../_reports-client";

// ── Mock data hooks ──────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  selectedBranchId: "all",
  setSelectedBranchId: vi.fn(),
  useReport: vi.fn(),
  useMechanics: vi.fn(),
  useBranches: vi.fn(),
  insights: vi.fn(),
  forecast: vi.fn(),
  targets: vi.fn(),
  retention: vi.fn(),
  pnl: vi.fn(),
  serviceBreakdown: vi.fn(),
  financeSummary: vi.fn(),
  refetch: vi.fn(),
  refetchReport: vi.fn(),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: { orgId: "org-1" },
    isPending: false,
    error: null,
  }),
}));

vi.mock("@/lib/queries/use-branches", () => ({
  useBranches: (...args: unknown[]) => mocks.useBranches(...args),
}));

vi.mock("@/lib/queries/use-reports", () => ({
  useReport: (...args: unknown[]) => mocks.useReport(...args),
  useMechanics: (...args: unknown[]) => mocks.useMechanics(...args),
  useReportInsights: (...args: unknown[]) => mocks.insights(...args),
  useReportForecast: (...args: unknown[]) => mocks.forecast(...args),
  useReportTargets: (...args: unknown[]) => mocks.targets(...args),
  useReportRetention: (...args: unknown[]) => mocks.retention(...args),
  useReportPnl: (...args: unknown[]) => mocks.pnl(...args),
  useReportServiceBreakdown: (...args: unknown[]) =>
    mocks.serviceBreakdown(...args),
  useReportFinanceSummary: (...args: unknown[]) =>
    mocks.financeSummary(...args),
}));

vi.mock("@/hooks/use-selected-branch-guard", () => ({
  useSelectedBranchGuard: () => null,
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => mocks.selectedBranchId,
  useSetSelectedBranchId: () => mocks.setSelectedBranchId,
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
    useLocale: () => "en",
  };
});

// ── Mock dynamic tab imports (render the data they receive) ──────
vi.mock("../_eod-view", () => ({
  EodView: ({ data }: { data: Record<string, unknown> }) => {
    const mechanics = (data.mechanics ?? []) as Array<Record<string, unknown>>;
    return (
      <div data-testid="eod-view" data-mechanics={String(mechanics.length)}>
        {mechanics.map((m) => (
          <div key={String(m.mechanic_id)} data-testid="eod-mechanic">
            {String(m.mechanic_name)}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock("../_finance-tab", () => ({
  FinanceTab: ({
    financeQ,
  }: {
    financeQ: {
      data: Record<string, unknown> | undefined;
      isPending: boolean;
    };
  }) => (
    <div data-testid="finance-tab">
      <span data-testid="finance-revenue">
        {String(financeQ.data?.total_revenue ?? "")}
      </span>
      <span data-testid="finance-pending">{String(financeQ.isPending)}</span>
    </div>
  ),
}));

vi.mock("../_overview-tab", () => ({
  OverviewTab: ({
    reportType,
    report,
    mechanicFilter,
  }: {
    reportType: string;
    report: Record<string, unknown> | null;
    mechanicFilter: string;
  }) => {
    const kpis = report ?? {};
    const mechRows = (kpis.mechanic_kpis ?? []) as Array<
      Record<string, unknown>
    >;
    return (
      <div
        data-testid="overview-tab"
        data-type={reportType}
        data-mechanic-filter={mechanicFilter}
      >
        <span data-testid="kpi-wo">
          {String(kpis.work_orders_completed ?? "")}
        </span>
        <span data-testid="kpi-services">
          {String(kpis.services_count ?? "")}
        </span>
        <span data-testid="kpi-parts">{String(kpis.parts_count ?? "")}</span>
        <span data-testid="kpi-revenue">
          {String(kpis.total_revenue ?? "")}
        </span>
        {mechRows.map((row) => (
          <div key={String(row.mechanic_name)} data-testid="mechanic-row">
            {String(row.mechanic_name)}
          </div>
        ))}
      </div>
    );
  },
}));

// ── Mock child components (real tab bar + header kept) ───────────
vi.mock("../_reports-filters", () => ({
  ReportsFilters: ({
    branches,
    selectedBranchId,
    onBranchChange,
    mechanics,
    mechanicFilter,
    onMechanicFilterChange,
  }: {
    branches: Array<{ id: string; name: string }>;
    selectedBranchId: string;
    onBranchChange?: (id: string) => void;
    mechanics: Array<{ id: string; fullName: string | null }>;
    mechanicFilter: string;
    onMechanicFilterChange?: (id: string) => void;
  }) => (
    <div data-testid="reports-filters">
      {branches.length > 1 && (
        <select
          aria-label="branch"
          data-testid="branch-select"
          value={selectedBranchId}
          onChange={(e) => onBranchChange?.(e.target.value)}
        >
          <option value="all">all</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}
      <select
        aria-label="mechanic"
        data-testid="mechanic-select"
        value={mechanicFilter}
        onChange={(e) => onMechanicFilterChange?.(e.target.value)}
      >
        <option value="">all</option>
        {mechanics.map((m) => (
          <option key={m.id} value={m.id}>
            {m.fullName ?? ""}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("../_reports-date-picker", () => ({
  ReportsDatePicker: ({
    reportType,
    onCustomRangeChange,
  }: {
    reportType: string;
    onCustomRangeChange?: (range: { from: Date; to: Date }) => void;
  }) => (
    <div data-testid="reports-date-picker">
      {reportType === "custom" && (
        <button
          type="button"
          data-testid="custom-range-button"
          onClick={() =>
            onCustomRangeChange?.({
              from: new Date(2026, 0, 1),
              to: new Date(2026, 0, 10),
            })
          }
        >
          set-custom-range
        </button>
      )}
    </div>
  ),
}));

vi.mock("../_reports-skeleton", () => ({
  ReportsSkeleton: () => <div data-testid="reports-skeleton">Skeleton</div>,
}));

// ── Test data ────────────────────────────────────────────────────
const reportData = {
  date: "2026-01-15",
  work_orders_completed: 7,
  services_count: 9,
  parts_count: 11,
  total_revenue: 150000,
  total_discounts: 0,
  comparison: null,
  profitability: null,
  mechanic_kpis: [
    {
      mechanic_name: "John",
      work_orders_completed: 4,
      services_count: 5,
      parts_count: 6,
      total_revenue: 80000,
      avg_revenue_per_wo: 20000,
    },
    {
      mechanic_name: "Jane",
      work_orders_completed: 3,
      services_count: 4,
      parts_count: 5,
      total_revenue: 70000,
      avg_revenue_per_wo: 23333,
    },
  ],
};

const eodReportData = {
  date: "2026-01-15",
  mechanics: [
    {
      mechanic_id: "m1",
      mechanic_name: "John",
      work_orders_completed: 3,
      services_performed: 5,
      parts_used: 8,
      total_revenue: 50000,
    },
  ],
  total_work_orders: 3,
  total_revenue: 50000,
};

function defaultReportResult() {
  return {
    data: null,
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.refetchReport,
  };
}

describe("ReportsPage client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectedBranchId = "all";
    mocks.useReport.mockReturnValue(defaultReportResult());
    mocks.useMechanics.mockReturnValue({ data: [] });
    mocks.useBranches.mockReturnValue({ data: [] });
    mocks.insights.mockReturnValue({ data: [], refetch: mocks.refetch });
    mocks.forecast.mockReturnValue({ data: null, refetch: mocks.refetch });
    mocks.targets.mockReturnValue({ data: [], refetch: mocks.refetch });
    mocks.retention.mockReturnValue({ data: null, refetch: mocks.refetch });
    mocks.pnl.mockReturnValue({ data: null, refetch: mocks.refetch });
    mocks.serviceBreakdown.mockReturnValue({
      data: [],
      refetch: mocks.refetch,
    });
    mocks.financeSummary.mockReturnValue({
      data: null,
      isPending: false,
    });
  });

  it("renders the loading skeleton while the report is pending", () => {
    mocks.useReport.mockReturnValue({
      ...defaultReportResult(),
      isPending: true,
    });
    render(<ReportsPage />);

    expect(screen.getByTestId("reports-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("eod-view")).not.toBeInTheDocument();
    // Refresh button is disabled while loading
    expect(screen.getByRole("button", { name: "refresh" })).toBeDisabled();
  });

  it("renders the error card when the report query fails", () => {
    mocks.useReport.mockReturnValue({
      ...defaultReportResult(),
      isError: true,
      error: new Error("API failure"),
    });
    render(<ReportsPage />);

    expect(screen.getByText("errorLoading")).toBeInTheDocument();
    expect(screen.queryByTestId("reports-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
    // Empty state must not appear when the query errored
    expect(screen.queryByText("subtitle")).not.toBeInTheDocument();
  });

  it("renders the empty state when there is no data and no error", () => {
    render(<ReportsPage />);

    // Header renders the title too, so the empty card adds a second one
    expect(screen.getAllByText("title")).toHaveLength(2);
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.queryByTestId("reports-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
  });

  it("passes KPIs and mechanic rows to the overview tab for a daily report", async () => {
    mocks.useReport.mockReturnValue({
      ...defaultReportResult(),
      data: reportData,
    });
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("overview-tab")).toHaveAttribute(
        "data-type",
        "daily",
      );
    });
    expect(screen.getByTestId("kpi-wo")).toHaveTextContent("7");
    expect(screen.getByTestId("kpi-services")).toHaveTextContent("9");
    expect(screen.getByTestId("kpi-parts")).toHaveTextContent("11");
    expect(screen.getByTestId("kpi-revenue")).toHaveTextContent("150000");
    const rows = screen.getAllByTestId("mechanic-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("John");
    expect(rows[1]).toHaveTextContent("Jane");
  });

  it("re-queries with the weekly type and renders the overview when the weekly tab is clicked", async () => {
    const user = userEvent.setup();
    mocks.useReport.mockReturnValue({
      ...defaultReportResult(),
      data: reportData,
    });
    render(<ReportsPage />);

    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "weekly" }));
    });

    const lastCall = mocks.useReport.mock.calls.at(-1);
    expect(lastCall?.[1]).toBe("weekly");
    expect(lastCall?.[2]).toMatchObject({ date: expect.any(String) });
    await waitFor(() => {
      expect(screen.getByTestId("overview-tab")).toHaveAttribute(
        "data-type",
        "weekly",
      );
    });
  });

  it("renders EOD mechanics when the EOD tab is clicked", async () => {
    const user = userEvent.setup();
    mocks.useReport.mockReturnValue({
      ...defaultReportResult(),
      data: eodReportData,
    });
    render(<ReportsPage />);

    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "eodSummary" }));
    });

    await waitFor(() => {
      const eodView = screen.getByTestId("eod-view");
      expect(eodView).toHaveAttribute("data-mechanics", "1");
      expect(screen.getByTestId("eod-mechanic")).toHaveTextContent("John");
    });
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument();
  });

  it("passes the finance summary to the finance tab when the Finance tab is clicked", async () => {
    const user = userEvent.setup();
    mocks.financeSummary.mockReturnValue({
      data: { total_revenue: 1234 },
      isPending: false,
    });
    render(<ReportsPage />);

    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "Finance" }));
    });

    expect(screen.getByTestId("finance-tab")).toBeInTheDocument();
    expect(screen.getByTestId("finance-revenue")).toHaveTextContent("1234");
    expect(screen.getByTestId("finance-pending")).toHaveTextContent("false");
  });

  it("updates the report date params when the custom range changes", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await act(async () => {
      await user.click(screen.getByRole("tab", { name: "customRange" }));
    });
    await act(async () => {
      await user.click(screen.getByTestId("custom-range-button"));
    });

    const lastCall = mocks.useReport.mock.calls.at(-1);
    expect(lastCall?.[1]).toBe("custom");
    expect(lastCall?.[2]).toMatchObject({
      date: "2026-01-01",
      date_from: "2026-01-01",
      date_to: "2026-01-10",
    });
  });

  it("refetches every report query when the refresh button is clicked", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "refresh" }));
    });

    expect(mocks.refetchReport).toHaveBeenCalledTimes(1);
    // insights, forecast, targets, retention, pnl, service breakdown
    expect(mocks.refetch).toHaveBeenCalledTimes(6);
  });

  it("passes the selected branch to the report query and records branch changes", async () => {
    const user = userEvent.setup();
    mocks.useBranches.mockReturnValue({
      data: [
        { id: "b1", name: "Branch 1" },
        { id: "b2", name: "Branch 2" },
      ],
    });
    const { rerender } = render(<ReportsPage />);

    // "all" branch → no branch filter
    expect(mocks.useReport.mock.calls.at(-1)?.[3]).toBeNull();

    await act(async () => {
      await user.selectOptions(screen.getByLabelText("branch"), "b1");
    });
    expect(mocks.setSelectedBranchId).toHaveBeenCalledWith("b1");

    // Re-render as if the store updated → branch filter propagates
    mocks.selectedBranchId = "b1";
    rerender(<ReportsPage />);
    expect(mocks.useReport.mock.calls.at(-1)?.[3]).toBe("b1");
  });

  it("passes the mechanic filter to the report query params", async () => {
    const user = userEvent.setup();
    mocks.useMechanics.mockReturnValue({
      data: [{ id: "m1", full_name: "John Doe" }],
    });
    render(<ReportsPage />);

    await act(async () => {
      await user.selectOptions(screen.getByLabelText("mechanic"), "m1");
    });

    expect(mocks.useReport.mock.calls.at(-1)?.[2]).toMatchObject({
      mechanic: "m1",
    });
  });

  it("clears the mechanic filter when the mechanic is no longer available", async () => {
    const user = userEvent.setup();
    mocks.useMechanics.mockReturnValue({
      data: [{ id: "m1", full_name: "John Doe" }],
    });
    const { rerender } = render(<ReportsPage />);

    await act(async () => {
      await user.selectOptions(screen.getByLabelText("mechanic"), "m1");
    });
    expect(screen.getByTestId("mechanic-select")).toHaveValue("m1");

    mocks.useMechanics.mockReturnValue({ data: [] });
    rerender(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("mechanic-select")).toHaveValue("");
    });
    expect(mocks.useReport.mock.calls.at(-1)?.[2]).not.toHaveProperty(
      "mechanic",
    );
  });
});
