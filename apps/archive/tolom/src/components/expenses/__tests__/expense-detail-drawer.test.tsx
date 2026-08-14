import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ExpenseDetailDrawer } from "../expense-detail-drawer";

// ── Mock state ─────────────────────────────────────────────────────────
const hooks = vi.hoisted(() => ({
  expense: null as Record<string, unknown> | null,
  loading: false,
  error: null as Error | null,
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" }, isPending: false }),
}));

vi.mock("@/lib/queries/use-expenses", () => ({
  useExpense: () => ({
    data: hooks.expense,
    isLoading: hooks.loading,
    error: hooks.error,
  }),
  useExpenseCategories: () => ({
    data: [{ id: "cat-1", name: "Fuel" }],
  }),
  useUpdateExpense: () => ({
    mutateAsync: hooks.updateExpense,
    isPending: false,
  }),
  useDeleteExpense: () => ({
    mutateAsync: hooks.deleteExpense,
  }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────

const baseExpense = {
  id: "exp-1",
  organization_id: "org-1",
  branch_id: null,
  category_id: "cat-1",
  vendor_name: "Fuel Station",
  description: "Diesel refill",
  amount: 120000,
  tax_amount: 0,
  expense_date: "2026-08-01",
  due_date: null,
  paid_at: "2026-08-02T10:00:00Z",
  payment_method: "cash",
  reference_number: "INV-123",
  receipt_url: null,
  notes: "Office van",
  is_recurring: false,
  recurrence_interval: null,
  created_by: "user-1",
  created_at: "2026-08-01T08:00:00Z",
  updated_at: "2026-08-02T10:00:00Z",
  category: {
    id: "cat-1",
    organization_id: "org-1",
    name: "Fuel",
    description: null,
    color: "#000000",
    icon: "flame",
    sort_order: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
};

function renderDrawer(overrides: { open?: boolean } = {}) {
  return render(
    <ExpenseDetailDrawer
      open={overrides.open ?? true}
      onOpenChange={vi.fn()}
      expenseId="exp-1"
    />,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("ExpenseDetailDrawer", () => {
  beforeEach(() => {
    hooks.expense = baseExpense;
    hooks.loading = false;
    hooks.error = null;
    hooks.updateExpense.mockReset();
    hooks.deleteExpense.mockReset();
    hooks.updateExpense.mockResolvedValue({
      data: { id: "exp-1" },
      error: null,
    });
    hooks.deleteExpense.mockResolvedValue({ data: null, error: null });
  });

  it("shows a loading state while the expense is fetching", () => {
    hooks.expense = null;
    hooks.loading = true;
    renderDrawer();
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("shows the error message when fetching fails", () => {
    hooks.expense = null;
    hooks.error = new Error("Failed to load expense");
    renderDrawer();
    expect(screen.getByText("Failed to load expense")).toBeInTheDocument();
  });

  it("shows a not-found message when the expense is missing", () => {
    hooks.expense = null;
    renderDrawer();
    expect(screen.getByText("notFound")).toBeInTheDocument();
  });

  it("renders the read-only view with expense data", () => {
    renderDrawer();
    expect(screen.getByText("Diesel refill")).toBeInTheDocument();
    expect(screen.getByText(/₮\s*120,000/)).toBeInTheDocument();
    expect(screen.getAllByText("paid").length).toBeGreaterThan(0);
    expect(screen.getByText("Fuel")).toBeInTheDocument();
    expect(screen.getByText("Fuel Station")).toBeInTheDocument();
    expect(screen.getByText("INV-123")).toBeInTheDocument();
    expect(screen.getByText("Office van")).toBeInTheDocument();
  });

  it("shows an overdue badge for an unpaid expense with a past due date", () => {
    hooks.expense = {
      ...baseExpense,
      paid_at: null,
      due_date: "2020-01-01T00:00:00Z",
    };
    renderDrawer();
    expect(screen.getAllByText("overdue").length).toBeGreaterThan(0);
  });

  it("switches to edit mode with prefilled values and saves the update payload", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ExpenseDetailDrawer
        open
        onOpenChange={onOpenChange}
        expenseId="exp-1"
      />,
    );

    // Enter edit mode (the header icon pencil is not inside a button —
    // target the action-button pencil instead)
    const pencil = document
      .querySelector('button svg[class*="pencil"]')
      ?.closest("button");
    if (!pencil) throw new Error("edit button not found");
    fireEvent.click(pencil);

    // Prefilled values
    const description =
      document.querySelector<HTMLInputElement>("#eds-description");
    if (!description) throw new Error("edit description input not found");
    expect(description.value).toBe("Diesel refill");
    expect(document.querySelector<HTMLInputElement>("#eds-date")?.value).toBe(
      "2026-08-01",
    );

    // Change description and save
    fireEvent.change(description, { target: { value: "Premium diesel" } });
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() =>
      expect(hooks.updateExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "exp-1",
          description: "Premium diesel",
          amount: 120000,
          paymentMethod: "cash",
          referenceNumber: "INV-123",
          vendorName: "Fuel Station",
          notes: "Office van",
          paidAt: expect.any(String),
        }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("expenseUpdated");

    // Back to read-only view after save
    await waitFor(() =>
      expect(screen.getByText("Diesel refill")).toBeInTheDocument(),
    );
  });

  it("does not submit a NaN amount and shows a validation error", async () => {
    const user = userEvent.setup();
    renderDrawer();

    const pencil = document
      .querySelector('button svg[class*="pencil"]')
      ?.closest("button");
    if (!pencil) throw new Error("edit button not found");
    fireEvent.click(pencil);

    const amount = document.querySelector<HTMLInputElement>("#eds-amount");
    if (!amount) throw new Error("amount input not found");
    await user.clear(amount);
    await user.type(amount, "abc");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("invalidAmount")).toBeInTheDocument();
    expect(hooks.updateExpense).not.toHaveBeenCalled();
  });

  it("deletes the expense from the confirm dialog", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ExpenseDetailDrawer
        open
        onOpenChange={onOpenChange}
        expenseId="exp-1"
      />,
    );

    const trash = document
      .querySelector('button svg[class*="trash"]')
      ?.closest("button");
    if (!trash) throw new Error("delete button not found");
    fireEvent.click(trash);

    expect(screen.getAllByText("deleteConfirm").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "delete" }));

    await waitFor(() =>
      expect(hooks.deleteExpense).toHaveBeenCalledWith("exp-1"),
    );
    expect(toast.success).toHaveBeenCalledWith("expenseDeleted");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
