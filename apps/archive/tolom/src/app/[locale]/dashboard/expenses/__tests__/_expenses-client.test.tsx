import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ExpenseCategory,
  ExpenseStats,
  ExpenseWithCategory,
} from "@/lib/types";
import { render } from "@/test/test-utils";
import ExpensesPage from "../_expenses-client";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useExpenses: vi.fn(),
  useExpenseStats: vi.fn(),
  useExpenseCategories: vi.fn(),
  useCurrentOrg: vi.fn(),
  refetch: vi.fn(),
  setNewExpenseSheetOpen: vi.fn(),
  setDetailExpenseId: vi.fn(),
  setSearch: vi.fn(),
  setCategory: vi.fn(),
  setStatus: vi.fn(),
  setDateFrom: vi.fn(),
  setDateTo: vi.fn(),
  resetAll: vi.fn(),
  reportServerError: vi.fn(),
  branchId: "all",
  search: "",
  category: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  activeCount: 0,
}));

// ── Hook mocks ──────────────────────────────────────────────────────
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-expenses", () => ({
  useExpenses: mocks.useExpenses,
  useExpenseStats: mocks.useExpenseStats,
}));

vi.mock("@/lib/queries/use-expense-categories", () => ({
  useExpenseCategories: mocks.useExpenseCategories,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/lib/hooks/use-table-filters", () => ({
  useTableFilters: () => ({
    search: mocks.search,
    setSearch: mocks.setSearch,
    category: mocks.category,
    setCategory: mocks.setCategory,
    status: mocks.status,
    setStatus: mocks.setStatus,
    dateFrom: mocks.dateFrom,
    setDateFrom: mocks.setDateFrom,
    dateTo: mocks.dateTo,
    setDateTo: mocks.setDateTo,
    activeCount: mocks.activeCount,
    resetAll: mocks.resetAll,
  }),
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-01-15T10:00:00.000Z"),
}));

vi.mock("@/hooks/use-page-header", () => ({
  usePageHeader: () => ({
    setNewExpenseSheetOpen: mocks.setNewExpenseSheetOpen,
    setDetailExpenseId: mocks.setDetailExpenseId,
  }),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => mocks.branchId,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: () => (
    <button type="button" data-testid="export-button">
      Export Excel
    </button>
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────────

const fuelCategory: ExpenseCategory = {
  id: "cat-fuel",
  organization_id: "org-1",
  name: "Fuel",
  description: null,
  color: "#f59e0b",
  icon: "fuel",
  sort_order: 1,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const maintenanceCategory: ExpenseCategory = {
  ...fuelCategory,
  id: "cat-maint",
  name: "Maintenance",
  color: "#3b82f6",
  sort_order: 2,
};

function makeExpense(
  overrides: Partial<ExpenseWithCategory> = {},
): ExpenseWithCategory {
  return {
    id: "exp-1",
    organization_id: "org-1",
    branch_id: null,
    category_id: "cat-fuel",
    vendor_name: null,
    description: "Test expense",
    amount: 100000,
    tax_amount: 0,
    expense_date: "2026-01-05T12:00:00.000Z",
    due_date: null,
    paid_at: null,
    payment_method: null,
    reference_number: null,
    receipt_url: null,
    notes: null,
    is_recurring: false,
    recurrence_interval: null,
    created_by: null,
    created_at: "2026-01-05T12:00:00.000Z",
    updated_at: "2026-01-05T12:00:00.000Z",
    ...overrides,
  };
}

function expensesResult(
  data: ExpenseWithCategory[] | undefined,
  overrides: Record<string, unknown> = {},
) {
  return {
    data,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}

const stats: ExpenseStats = {
  totalExpenses: 7,
  totalAmount: 9_999_999,
  totalTax: 0,
  paidAmount: 0,
  unpaidAmount: 543_210,
  overdueCount: 2,
  byCategory: [],
  thisMonth: 123_456,
  lastMonth: 0,
};

const paidExpense = makeExpense({
  id: "exp-1",
  description: "Engine oil change",
  vendor_name: "FuelPro LLC",
  amount: 250_000,
  expense_date: "2026-01-05T12:00:00.000Z",
  reference_number: "REF-100",
  paid_at: "2026-01-06T12:00:00.000Z",
  category: fuelCategory,
});

const overdueExpense = makeExpense({
  id: "exp-2",
  category_id: null,
  description: "Tire replacement",
  vendor_name: null,
  amount: 800_000,
  expense_date: "2026-01-08T12:00:00.000Z",
  due_date: "2020-01-01T12:00:00.000Z",
  paid_at: null,
  category: null,
});

// ── Tests ───────────────────────────────────────────────────────────

describe("ExpensesPage", () => {
  beforeEach(() => {
    mocks.useExpenses.mockReset();
    mocks.useExpenseStats.mockReset();
    mocks.useExpenseCategories.mockReset();
    mocks.useCurrentOrg.mockReset();
    mocks.refetch.mockReset();
    mocks.setNewExpenseSheetOpen.mockReset();
    mocks.setDetailExpenseId.mockReset();
    mocks.setSearch.mockReset();
    mocks.setCategory.mockReset();
    mocks.setStatus.mockReset();
    mocks.setDateFrom.mockReset();
    mocks.setDateTo.mockReset();
    mocks.resetAll.mockReset();
    mocks.reportServerError.mockReset();
    mocks.branchId = "all";
    mocks.search = "";
    mocks.category = "";
    mocks.status = "";
    mocks.dateFrom = "";
    mocks.dateTo = "";
    mocks.activeCount = 0;
    mocks.useCurrentOrg.mockReturnValue({
      data: { orgId: "org-1" },
      isPending: false,
    });
    mocks.useExpenses.mockReturnValue(expensesResult([]));
    mocks.useExpenseStats.mockReturnValue({
      data: undefined,
      isPending: false,
    });
    mocks.useExpenseCategories.mockReturnValue({
      data: [fuelCategory, maintenanceCategory],
    });
  });

  it("shows the page title and hides the add button while expenses are pending", () => {
    mocks.useExpenses.mockReturnValue(
      expensesResult(undefined, { isPending: true, isFetching: true }),
    );
    mocks.useExpenseStats.mockReturnValue({ data: undefined, isPending: true });
    render(<ExpensesPage />);

    expect(screen.getByText("nav.expenses")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "expenses.addExpenseButton" }),
    ).not.toBeInTheDocument();
    // KPI labels render during loading; values are skeletons, not "—"
    expect(screen.getByText("expenses.totalExpenses")).toBeInTheDocument();
    expect(screen.getByText("expenses.totalAmount")).toBeInTheDocument();
    expect(screen.queryByText("\u2014")).not.toBeInTheDocument();
  });

  it("renders the KPI stat cards with formatted values", () => {
    mocks.useExpenseStats.mockReturnValue({ data: stats, isPending: false });
    render(<ExpensesPage />);

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("₮ 9,999,999")).toBeInTheDocument();
    expect(screen.getByText("₮ 123,456")).toBeInTheDocument();
    expect(screen.getByText("₮ 543,210")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    // Overdue badge in the badge bar when stats report overdue expenses
    expect(screen.getByText("expenses.overdue: 2")).toBeInTheDocument();
  });

  it("renders expense rows with category, description, amount, date, vendor and status", () => {
    mocks.useExpenseStats.mockReturnValue({ data: stats, isPending: false });
    mocks.useExpenses.mockReturnValue(
      expensesResult([paidExpense, overdueExpense]),
    );
    render(<ExpensesPage />);

    expect(screen.getAllByText("Engine oil change").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tire replacement").length).toBeGreaterThan(0);
    // Category badge in table + mobile card
    expect(screen.getAllByText("Fuel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FuelPro LLC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₮ 250,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₮ 800,000").length).toBeGreaterThan(0);
    // Table date cell (mobile card shows a shorter format)
    expect(screen.getByText("Jan 5, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jan 8, 2026")).toBeInTheDocument();
    // Reference number (namespaced t in columns returns bare key) and status badges
    expect(screen.getByText(/reference: REF-100/)).toBeInTheDocument();
    expect(screen.getAllByText("expenses.paid").length).toBeGreaterThan(0);
    expect(screen.getAllByText("expenses.overdue").length).toBeGreaterThan(0);
  });

  it("shows the empty state and opens the add sheet from the empty action", async () => {
    const user = userEvent.setup();
    render(<ExpensesPage />);

    expect(screen.getByText("expenses.noExpenses")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "expenses.addFirstExpense" }),
    );
    expect(mocks.setNewExpenseSheetOpen).toHaveBeenCalledWith(true);
  });

  it("opens the new expense sheet from the header action", async () => {
    const user = userEvent.setup();
    mocks.useExpenses.mockReturnValue(
      expensesResult([paidExpense, overdueExpense]),
    );
    render(<ExpensesPage />);

    await user.click(
      screen.getByRole("button", { name: "expenses.addExpenseButton" }),
    );
    expect(mocks.setNewExpenseSheetOpen).toHaveBeenCalledWith(true);
  });

  it("shows the error state with retry and refetches on try again", async () => {
    const user = userEvent.setup();
    mocks.useExpenses.mockReturnValue(
      expensesResult(undefined, {
        isError: true,
        error: new Error("Failed to load"),
      }),
    );
    render(<ExpensesPage />);

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "tryAgain" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("shows the no-organization error when the org is missing", () => {
    mocks.useCurrentOrg.mockReturnValue({
      data: null,
      isPending: false,
    });
    render(<ExpensesPage />);

    expect(screen.getByText("common.noOrganization")).toBeInTheDocument();
    expect(mocks.useExpenses).toHaveBeenCalledWith(
      undefined,
      expect.anything(),
    );
  });

  it("falls back to the raw date and reports invalid expense dates", () => {
    mocks.useExpenseStats.mockReturnValue({ data: stats, isPending: false });
    mocks.useExpenses.mockReturnValue(
      expensesResult([
        makeExpense({ id: "exp-bad", expense_date: "not-a-date" }),
      ]),
    );
    render(<ExpensesPage />);

    // Mobile card shows the raw string instead of "Invalid Date"
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
    expect(mocks.reportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });

  it("opens the expense detail on row click", () => {
    mocks.useExpenses.mockReturnValue(expensesResult([paidExpense]));
    render(<ExpensesPage />);

    // Click the table row version of the text (mobile card wrapper ignores
    // clicks on its own role="button" subtree)
    const cellText = screen
      .getAllByText("Engine oil change")
      .find((el) => el.closest("tr"));
    expect(cellText).toBeDefined();
    fireEvent.click(cellText as HTMLElement);
    expect(mocks.setDetailExpenseId).toHaveBeenCalledWith("exp-1");
  });

  it("passes the selected branch to useExpenses and shows the branch badge", () => {
    mocks.branchId = "branch-1";
    mocks.useExpenses.mockReturnValue(expensesResult([]));
    mocks.useExpenseStats.mockReturnValue({ data: stats, isPending: false });
    render(<ExpensesPage />);

    expect(mocks.useExpenses).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ branchId: "branch-1" }),
    );
    expect(mocks.useExpenseStats).toHaveBeenCalledWith("org-1", "branch-1");
    expect(screen.getByText("expenses.branchFiltered")).toBeInTheDocument();
  });

  it("filters by category through the category select", async () => {
    const user = userEvent.setup();
    mocks.useExpenses.mockReturnValue(expensesResult([paidExpense]));
    render(<ExpensesPage />);

    // First combobox in DOM order is the category select (the DataTable's
    // rows-per-page select also has combobox role)
    await act(async () => {
      fireEvent.click(screen.getAllByRole("combobox")[0]);
    });
    await waitFor(() =>
      expect(screen.getAllByText("Maintenance").length).toBeGreaterThan(0),
    );
    await act(async () => {
      await user.click(screen.getAllByText("Maintenance")[0]);
    });
    expect(mocks.setCategory).toHaveBeenCalledWith("cat-maint");
  });

  it("switches the paid status filter through the toggle group", async () => {
    mocks.useExpenses.mockReturnValue(expensesResult([paidExpense]));
    render(<ExpensesPage />);

    const toggle = screen.getByRole("button", { name: "expenses.unpaid" });
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(mocks.setStatus).toHaveBeenCalledWith("unpaid");
  });

  it("derives query params from active filters", () => {
    mocks.search = "oil";
    mocks.category = "cat-maint";
    mocks.status = "overdue";
    mocks.dateFrom = "2026-01-01";
    mocks.dateTo = "2026-01-31";
    mocks.branchId = "branch-9";
    const { rerender } = render(<ExpensesPage />);

    expect(mocks.useExpenses).toHaveBeenLastCalledWith(
      "org-1",
      expect.objectContaining({
        q: "oil",
        categoryId: "cat-maint",
        paid: false,
        overdue: true,
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        branchId: "branch-9",
      }),
    );

    mocks.status = "paid";
    rerender(<ExpensesPage />);
    expect(mocks.useExpenses).toHaveBeenLastCalledWith(
      "org-1",
      expect.objectContaining({ paid: true, overdue: undefined }),
    );
  });

  it("applies a date range preset and writes formatted dates to the filters", async () => {
    render(<ExpensesPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "placeholder" }));
    });
    const preset = await screen.findAllByText("today");
    expect(preset.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(preset[0]);
    });

    const today = new Date();
    const expected = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    expect(mocks.setDateFrom).toHaveBeenCalledWith(expected);
    expect(mocks.setDateTo).toHaveBeenCalledWith(expected);
  });

  it("shows the filter count badge and clears all filters", async () => {
    const user = userEvent.setup();
    mocks.activeCount = 3;
    mocks.useExpenses.mockReturnValue(expensesResult([paidExpense]));
    render(<ExpensesPage />);

    expect(screen.getByText("expenses.filterCount")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "expenses.clearFilters" }),
    );
    expect(mocks.resetAll).toHaveBeenCalled();
  });
});
