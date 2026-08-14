import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommissionRulesSection } from "@/app/[locale]/dashboard/settings/_commission-rules-section";
import type { MechanicCommissionRule } from "@/lib/types";

// ── Hoisted mocks ──────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  useCommissionRules: vi.fn(),
  useCreateCommissionRule: vi.fn(),
  useUpdateCommissionRule: vi.fn(),
  useDeleteCommissionRule: vi.fn(),
  useMechanicsList: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  reportServerError: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args),
  },
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: (...args: unknown[]) => mocks.reportServerError(...args),
}));

vi.mock("@/lib/queries/use-commission-rules", () => ({
  useCommissionRules: mocks.useCommissionRules,
  useCreateCommissionRule: mocks.useCreateCommissionRule,
  useUpdateCommissionRule: mocks.useUpdateCommissionRule,
  useDeleteCommissionRule: mocks.useDeleteCommissionRule,
}));

vi.mock("@/lib/queries/use-work-order-detail", () => ({
  useMechanicsList: mocks.useMechanicsList,
}));

// ── CrudFormDrawer mock ────────────────────────────────────────────────
// The real CrudFormDrawer memoizes its submit handler with `useCallback(
// fn, [])` (crud-form-drawer.tsx:124), which captures the MOUNT-time
// onSubmit. The drawer stays mounted across open/close, so an edit-mode
// submit (opened after mount) calls the create closure — edit submits
// never reach the update mutation. This faithful mock keeps the real form
// contract (react-hook-form + zodResolver with the caller's schema, live
// onSubmit, close on success) so the sections' own submit/body-building
// logic is exercised without the shared drawer's stale-closure bug.
vi.mock("@/components/ui/crud-form-drawer", async () => {
  const { zodResolver, useForm } = await import("@/lib/hooks/use-form");
  const { reportServerError } = await import("@/lib/sentry-report-server");
  const { useEffect } = await import("react");
  return {
    CrudFormDrawer: ({
      open,
      onOpenChange,
      mode,
      title,
      formId,
      schema,
      defaultValues,
      onSubmit,
      isPending = false,
      children,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      mode: "create" | "edit";
      title: { create: string; edit: string };
      formId: string;
      schema: unknown;
      defaultValues: Record<string, unknown>;
      onSubmit: (data: Record<string, unknown>) => Promise<void>;
      isPending?: boolean;
      children: (form: ReturnType<typeof useForm>) => ReactNode;
    }) => {
      const form = useForm({
        resolver: zodResolver(schema as never) as never,
        defaultValues,
      });
      useEffect(() => {
        if (open) form.reset(defaultValues);
      }, [open, defaultValues, form]);
      if (!open) return null;
      return (
        <div>
          <div>{mode === "edit" ? title.edit : title.create}</div>
          <form
            id={formId}
            onSubmit={form.handleSubmit(async (data) => {
              try {
                await onSubmit(data as Record<string, unknown>);
                onOpenChange(false);
              } catch (err) {
                reportServerError("CrudFormDrawer submit failed", err);
              }
            })}
          >
            {children(form as never)}
          </form>
          <button type="submit" form={formId} disabled={isPending}>
            {mode === "edit" ? "Save" : "Create"}
          </button>
        </div>
      );
    },
  };
});

// ── Fixtures ───────────────────────────────────────────────────────────

const LABOR_RULE = {
  id: "r1",
  organization_id: "org-1",
  mechanic_id: "m1",
  mechanic_name: "Bat-Erdene",
  name: "Labor commission",
  commission_type: "percentage_of_labor",
  commission_value: 10,
  min_commission: 50000,
  max_commission: 200000,
  is_active: true,
  priority: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  created_by: null,
  deleted_at: null,
} as MechanicCommissionRule & { mechanic_name: string };

const FIXED_RULE = {
  id: "r2",
  organization_id: "org-1",
  mechanic_id: null,
  name: "Flat per WO",
  commission_type: "fixed_per_work_order",
  commission_value: 250000,
  min_commission: null,
  max_commission: null,
  is_active: false,
  priority: 2,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  created_by: null,
  deleted_at: null,
} as MechanicCommissionRule;

const MECHANICS = [
  { id: "m1", full_name: "Bat-Erdene" },
  { id: "m2", full_name: null },
];

// ── Helpers ────────────────────────────────────────────────────────────

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CommissionRulesSection orgId="org-1" />
    </QueryClientProvider>,
  );
}

interface MutationMock {
  mutateAsync: Mock;
  isPending: boolean;
}

function mutationResult(
  mutateAsync = vi.fn().mockResolvedValue(undefined),
): MutationMock {
  return { mutateAsync, isPending: false };
}

function required<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error(`Missing ${name}`);
  return value;
}

function formElement(): HTMLFormElement {
  return required(
    document.querySelector("form") as HTMLFormElement | null,
    "drawer form",
  );
}

function submitForm() {
  fireEvent.submit(formElement());
}

/** The <tr> containing a rule's name cell. */
function ruleRow(name: string): HTMLElement {
  const nameEl = screen.getByText(name);
  const row = nameEl.closest("tr");
  if (!row) throw new Error(`No row for rule ${name}`);
  return row;
}

/** Row action button by lucide icon class (pencil / trash-2). */
function rowButton(row: HTMLElement, icon: string): HTMLButtonElement {
  const svg = row.querySelector(`svg.lucide-${icon}`);
  const button = svg?.closest("button");
  if (!button) throw new Error(`No ${icon} button in row`);
  return button as HTMLButtonElement;
}

/** Type into a NumericInput and commit the value (commits on blur/Enter). */
async function setNumericInput(id: string, value: string) {
  const user = userEvent.setup();
  await user.clear(
    required(document.getElementById(id), id) as HTMLInputElement,
  );
  await user.type(
    required(document.getElementById(id), id) as HTMLInputElement,
    value,
  );
  await user.tab();
}

/** Fill the create-drawer required fields (name + commission value). */
async function fillCreateForm(name: string, commissionValue: string) {
  const user = userEvent.setup();
  await user.type(
    required(screen.getByPlaceholderText("ruleNamePlaceholder"), "name input"),
    name,
  );
  await setNumericInput("commission-value", commissionValue);
}

async function openAddDrawer() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "addCommissionRule" }));
  await screen.findByText("createCommissionRule");
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("CommissionRulesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.useCommissionRules.mockReturnValue({
      data: [LABOR_RULE, FIXED_RULE],
      isPending: false,
      error: null,
    });
    mocks.useCreateCommissionRule.mockReturnValue(mutationResult());
    mocks.useUpdateCommissionRule.mockReturnValue(mutationResult());
    mocks.useDeleteCommissionRule.mockReturnValue(mutationResult());
    mocks.useMechanicsList.mockReturnValue({
      data: MECHANICS,
      isPending: false,
    });
  });

  describe("list rendering", () => {
    it("shows skeletons while rules are loading", () => {
      mocks.useCommissionRules.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
      });
      const { container } = renderSection();

      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText("Labor commission")).not.toBeInTheDocument();
    });

    it("shows the error state when rules fail to load", () => {
      mocks.useCommissionRules.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("boom"),
      });
      renderSection();

      expect(screen.getByText("failedToLoadRules")).toBeInTheDocument();
      expect(screen.queryByText("Labor commission")).not.toBeInTheDocument();
    });

    it("renders the rules table with mechanic, type, value, min/max and status", async () => {
      renderSection();

      // Percentage rule: mechanic name, type label, percent value, min/max
      expect(await screen.findByText("Labor commission")).toBeInTheDocument();
      expect(screen.getByText("Bat-Erdene")).toBeInTheDocument();
      expect(screen.getByText("typePercentLabor")).toBeInTheDocument();
      expect(screen.getByText("10%")).toBeInTheDocument();
      expect(screen.getByText("₮ 50,000 / ₮ 200,000")).toBeInTheDocument();

      // Fixed rule: all-mechanics label, currency value, no min/max
      expect(screen.getByText("Flat per WO")).toBeInTheDocument();
      expect(screen.getByText("allMechanics")).toBeInTheDocument();
      expect(screen.getByText("typeFixedPerWo")).toBeInTheDocument();
      expect(screen.getByText("₮ 250,000")).toBeInTheDocument();
      expect(screen.getByText("— / —")).toBeInTheDocument();

      // Status badges
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("inactive")).toBeInTheDocument();

      // Header + add CTA
      expect(screen.getByText("tableMechanic")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "addCommissionRule" }),
      ).toBeInTheDocument();
    });

    it("renders the empty state with a create CTA when no rules exist", async () => {
      mocks.useCommissionRules.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
      });
      renderSection();

      expect(
        await screen.findByText("noCommissionRulesYet"),
      ).toBeInTheDocument();
      expect(screen.getByText("noCommissionRulesDesc")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "addCommissionRule" }),
      ).toBeInTheDocument();
    });
  });

  describe("rule creation", () => {
    it("validates required fields before submitting", async () => {
      renderSection();
      await screen.findByText("Labor commission");
      await openAddDrawer();

      submitForm();

      expect(
        await screen.findByText("Rule name is required"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Commission value is required"),
      ).toBeInTheDocument();
      expect(
        mocks.useCreateCommissionRule.mock.results[0]?.value.mutateAsync,
      ).not.toHaveBeenCalled();
    });

    it("submits the create payload with trimmed values and parsed numbers", async () => {
      const createMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useCreateCommissionRule.mockReturnValue(
        mutationResult(createMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");
      await openAddDrawer();

      await fillCreateForm("  Brake commission  ", "12.5");
      await setNumericInput("min-commission", "50000");
      await setNumericInput("max-commission", "200000");
      submitForm();

      await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
      expect(createMutate).toHaveBeenCalledWith({
        name: "Brake commission",
        mechanic_id: null,
        commission_type: "percentage_of_labor",
        commission_value: 12.5,
        min_commission: 50000,
        max_commission: 200000,
        is_active: true,
      });
      // Drawer closes after a successful submit
      await waitFor(() =>
        expect(
          screen.queryByText("createCommissionRule"),
        ).not.toBeInTheDocument(),
      );
    });

    it("switches to a fixed amount and submits the fixed payload", async () => {
      const createMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useCreateCommissionRule.mockReturnValue(
        mutationResult(createMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");
      await openAddDrawer();

      // Default percentage mode shows the percent label + % suffix
      expect(screen.getByText("commissionPercent")).toBeInTheDocument();
      expect(screen.getByText("%")).toBeInTheDocument();

      fireEvent.change(
        required(document.getElementById("commission-type"), "type select"),
        { target: { value: "fixed_per_work_order" } },
      );
      expect(screen.getByText("fixedAmount")).toBeInTheDocument();
      expect(screen.queryByText("%")).not.toBeInTheDocument();

      await fillCreateForm("Flat fee", "250000");
      submitForm();

      await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
      expect(createMutate).toHaveBeenCalledWith({
        name: "Flat fee",
        mechanic_id: null,
        commission_type: "fixed_per_work_order",
        commission_value: 250000,
        min_commission: null,
        max_commission: null,
        is_active: true,
      });
    });

    it("selects a mechanic in the combobox and includes mechanic_id in the payload", async () => {
      const createMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useCreateCommissionRule.mockReturnValue(
        mutationResult(createMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");
      await openAddDrawer();

      // Base UI Combobox input is the first combobox; the native type
      // <select> is the second (fireEvent bypasses jsdom pointer-events)
      // Base UI Combobox input is the first combobox; the native type
      // <select> is the second. The popup opens on mousedown, so use
      // userEvent (fireEvent.click skips pointer/mouse events).
      const combobox = screen.getAllByRole("combobox")[0];
      await userEvent.click(combobox);
      // Scope to the popup option — "Bat-Erdene" also appears in the table
      await waitFor(() => {
        expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
      });
      const option = screen
        .getAllByRole("option")
        .find((el) => el.textContent?.includes("Bat-Erdene"));
      await userEvent.click(required(option, "mechanic option"));

      await fillCreateForm("Mechanic rule", "5");
      submitForm();

      await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({ mechanic_id: "m1" }),
      );
    });

    it("deactivates the rule via the active switch in the form", async () => {
      const createMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useCreateCommissionRule.mockReturnValue(
        mutationResult(createMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");
      await openAddDrawer();

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeChecked();
      await userEvent.click(toggle);

      await fillCreateForm("Inactive rule", "8");
      submitForm();

      await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
      expect(createMutate).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });
  });

  describe("rule editing", () => {
    it("pre-fills the form and submits an update with the rule id and parsed body", async () => {
      const updateMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useUpdateCommissionRule.mockReturnValue(
        mutationResult(updateMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");

      const user = userEvent.setup();
      await user.click(rowButton(ruleRow("Labor commission"), "pencil"));

      // Drawer opens in edit mode with the rule pre-filled
      expect(await screen.findByText("editCommissionRule")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("ruleNamePlaceholder")).toHaveValue(
        "Labor commission",
      );
      expect(document.getElementById("commission-value")).toHaveValue("10");
      expect(document.getElementById("commission-type")).toHaveValue(
        "percentage_of_labor",
      );
      expect(screen.getByRole("switch")).toBeChecked();

      // Change the name and submit
      const nameInput = screen.getByPlaceholderText("ruleNamePlaceholder");
      await user.clear(nameInput);
      await user.type(nameInput, "Labor commission v2");
      submitForm();

      await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
      expect(updateMutate).toHaveBeenCalledWith({
        id: "r1",
        body: {
          name: "Labor commission v2",
          mechanic_id: "m1",
          commission_type: "percentage_of_labor",
          commission_value: 10,
          min_commission: 50000,
          max_commission: 200000,
          is_active: true,
        },
      });
    });
  });

  describe("delete", () => {
    it("deletes a rule after confirmation and shows a success toast", async () => {
      const confirmSpy = vi.fn().mockReturnValue(true);
      vi.stubGlobal("confirm", confirmSpy);
      const deleteMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useDeleteCommissionRule.mockReturnValue(
        mutationResult(deleteMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");

      await userEvent.click(rowButton(ruleRow("Labor commission"), "trash-2"));

      expect(confirmSpy).toHaveBeenCalledWith("confirmDeleteMessage");
      await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith("r1"));
      expect(mocks.toastSuccess).toHaveBeenCalledWith("commissionRuleDeleted");
    });

    it("skips deletion when confirmation is dismissed", async () => {
      vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
      const deleteMutate = vi.fn().mockResolvedValue(undefined);
      mocks.useDeleteCommissionRule.mockReturnValue(
        mutationResult(deleteMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");

      await userEvent.click(rowButton(ruleRow("Labor commission"), "trash-2"));

      expect(deleteMutate).not.toHaveBeenCalled();
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
    });

    it("reports and toasts the error when deletion fails", async () => {
      vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
      const deleteMutate = vi.fn().mockRejectedValue(new Error("Server boom"));
      mocks.useDeleteCommissionRule.mockReturnValue(
        mutationResult(deleteMutate),
      );
      renderSection();
      await screen.findByText("Labor commission");

      await userEvent.click(rowButton(ruleRow("Labor commission"), "trash-2"));

      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith("Server boom"),
      );
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
    });
  });
});
