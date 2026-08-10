import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ExpenseForm } from "../expense-form";

// ── Mock state (hoisted so vi.mock factories can reference it) ─────────
const hooks = vi.hoisted(() => ({
  createExpense: vi.fn(),
  orgId: "org-1" as string | null,
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

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({
    data: hooks.orgId ? { orgId: hooks.orgId } : null,
    isPending: false,
  }),
}));

vi.mock("@/lib/queries/use-expenses", () => ({
  useExpenseCategories: () => ({
    data: [{ id: "cat-1", name: "Fuel" }],
  }),
  useCreateExpense: () => ({
    mutate: hooks.createExpense,
    isPending: false,
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────

function submitButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "addExpense" });
}

async function fillRequiredFields(user: UserEvent) {
  await user.type(
    screen.getByPlaceholderText("descriptionPlaceholder"),
    "Diesel refill",
  );
  const amount = document.querySelector<HTMLInputElement>("#expense-amount");
  if (!amount) throw new Error("amount input not found");
  await user.click(amount);
  await user.keyboard("120000");
  await user.tab();
}

/**
 * Base UI Select items: userEvent clicks get blocked by the popup's
 * `pointer-events: none` during mount transitions in jsdom, while bare
 * fireEvent.click lacks the pointerdown that arms selection. Fire both.
 */
function selectPopupItem(text: string) {
  const item = screen.getByText(text);
  fireEvent.pointerDown(item, { pointerType: "mouse" });
  fireEvent.click(item);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("ExpenseForm", () => {
  beforeEach(() => {
    hooks.orgId = "org-1";
    hooks.createExpense.mockReset();
  });

  it("renders required fields, selects and action buttons", () => {
    render(<ExpenseForm />);
    expect(
      screen.getByPlaceholderText("descriptionPlaceholder"),
    ).toBeInTheDocument();
    expect(document.querySelector("#expense-amount")).not.toBeNull();
    expect(document.querySelector("#expense-date")).not.toBeNull();
    expect(
      screen.getByRole("combobox", { name: "category" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "paymentMethod" }),
    ).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(submitButton()).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);
    await user.click(submitButton());

    expect(
      await screen.findByText("Description is required"),
    ).toBeInTheDocument();
    expect(screen.getByText("Amount is required")).toBeInTheDocument();
    expect(hooks.createExpense).not.toHaveBeenCalled();
  });

  it("submits description/amount/date/category/payment payload and calls onSuccess", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<ExpenseForm onSuccess={onSuccess} />);

    await fillRequiredFields(user);

    // Expense date
    const dateInput = document.querySelector<HTMLInputElement>("#expense-date");
    if (!dateInput) throw new Error("date input not found");
    fireEvent.change(dateInput, { target: { value: "2026-08-09" } });

    // Category via select popup
    await user.click(screen.getByRole("combobox", { name: "category" }));
    selectPopupItem("Fuel");

    await user.click(submitButton());

    await waitFor(() =>
      expect(hooks.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Diesel refill",
          amount: 120000,
          taxAmount: 0,
          expenseDate: "2026-08-09",
          dueDate: null,
          categoryId: "cat-1",
          paymentMethod: "cash",
          referenceNumber: undefined,
          paidAt: null,
          notes: undefined,
        }),
        expect.any(Object),
      ),
    );

    // Simulate mutation success → onSuccess fires
    const [, callbacks] = hooks.createExpense.mock.calls[0] as [
      unknown,
      { onSuccess: (expense: unknown) => void },
    ];
    callbacks.onSuccess({ id: "exp-1" });
    expect(onSuccess).toHaveBeenCalledWith({ id: "exp-1" });
  });

  it("includes paidAt when the paid checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByText("paid"));
    await user.click(submitButton());

    await waitFor(() =>
      expect(hooks.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({ paidAt: expect.any(String) }),
        expect.any(Object),
      ),
    );
  });

  it("calls onCancel from the cancel button", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ExpenseForm onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows an error and skips submission when the org is not loaded", async () => {
    const user = userEvent.setup();
    hooks.orgId = null;
    render(<ExpenseForm />);

    await fillRequiredFields(user);
    await user.click(submitButton());

    expect(
      await screen.findByText("Organization not loaded"),
    ).toBeInTheDocument();
    expect(hooks.createExpense).not.toHaveBeenCalled();
  });
});
