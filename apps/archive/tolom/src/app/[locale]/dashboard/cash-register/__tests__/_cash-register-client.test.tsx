import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CashRegisterSessionWithEntries } from "@/lib/types";
import { render } from "@/test/test-utils";
import { CashRegisterClient } from "../_cash-register-client";

// ── DetailDrawer ──────────────────────────────────────────────────
// Base UI's Drawer keeps its popup mounted through the exit transition,
// which never completes in jsdom — a closed drawer would stay in the DOM.
// Stub the drawer as an open-gated container so "dialog closed" is
// observable while the real forms inside still run (submit payloads).
vi.mock("@/components/ui/detail-drawer", () => {
  function Passthrough({ children }: { children?: ReactNode }) {
    return <>{children}</>;
  }

  function DetailDrawer({
    open,
    children,
  }: {
    open: boolean;
    children?: ReactNode;
  }) {
    return open ? <div data-slot="detail-drawer">{children}</div> : null;
  }

  return {
    DetailDrawer: Object.assign(DetailDrawer, {
      Header: Passthrough,
      Title: Passthrough,
      Description: Passthrough,
      Body: Passthrough,
      Footer: Passthrough,
      FooterActions: Passthrough,
      Divider: Passthrough,
      Section: Passthrough,
    }),
  };
});

// ── next-intl ─────────────────────────────────────────────────────
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// ── Hook mocks (shared contract: {data, isPending, error} / {mutateAsync, isPending}) ──
const mocks = vi.hoisted(() => ({
  useCurrentOrg: vi.fn(),
  useCurrentSession: vi.fn(),
  useOpenSession: vi.fn(),
  useCloseSession: vi.fn(),
  useCashOut: vi.fn(),
  useIsFirstLoad: vi.fn(),
  branchId: "all",
  toast: { success: vi.fn(), error: vi.fn() },
  reportServerError: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: mocks.useCurrentOrg,
}));

vi.mock("@/lib/queries/use-cash-register", () => ({
  useCurrentSession: mocks.useCurrentSession,
  useOpenSession: mocks.useOpenSession,
  useCloseSession: mocks.useCloseSession,
  useCashOut: mocks.useCashOut,
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => mocks.branchId,
}));

vi.mock("@/hooks/use-is-first-load", () => ({
  useIsFirstLoad: mocks.useIsFirstLoad,
}));

// ── Fixtures ──────────────────────────────────────────────────────

function makeSession(
  overrides: Partial<CashRegisterSessionWithEntries> = {},
): CashRegisterSessionWithEntries {
  return {
    id: "session-1",
    organization_id: "org-1",
    branch_id: null,
    date: "2026-01-15",
    status: "open",
    opened_at: "2026-01-15T01:00:00.000Z",
    closed_at: null,
    opening_balance: 50000,
    closing_balance: null,
    expected_balance: 90000,
    cash_in: 60000,
    cash_out: 20000,
    discrepancy: null,
    discrepancy_note: null,
    opened_by: null,
    closed_by: null,
    created_by: null,
    created_at: "2026-01-15T01:00:00.000Z",
    updated_at: "2026-01-15T01:00:00.000Z",
    deleted_at: null,
    entries: [
      {
        id: "e-1",
        session_id: "session-1",
        organization_id: "org-1",
        entry_type: "in",
        amount: 60000,
        source: "invoice_payment",
        source_id: null,
        description: "Repair payment",
        created_by: null,
        created_at: "2026-01-15T03:00:00.000Z",
      },
      {
        id: "e-2",
        session_id: "session-1",
        organization_id: "org-1",
        entry_type: "out",
        amount: 20000,
        source: "expense",
        source_id: null,
        description: null,
        created_by: null,
        created_at: "2026-01-15T04:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

function sessionHookResult(overrides: Record<string, unknown> = {}) {
  return {
    data: makeSession(),
    isPending: false,
    error: null,
    ...overrides,
  };
}

function resolvingMutateAsync(result: unknown) {
  return vi
    .fn()
    .mockImplementation(
      (_payload: unknown, options?: { onSuccess?: (data: unknown) => void }) =>
        Promise.resolve(result).then((data) => {
          options?.onSuccess?.(data);
          return data;
        }),
    );
}

function mutationResult() {
  return {
    mutateAsync: resolvingMutateAsync({ id: "session-1" }),
    isPending: false,
  };
}

// ── Helpers ───────────────────────────────────────────────────────

function q(name: string): HTMLInputElement | null {
  return document.querySelector(`input[name="${name}"]`);
}

function required<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Expected ${name} in DOM`);
  return value;
}

function submitButton(formId: string): HTMLButtonElement {
  const el = document.querySelector(`button[form="${formId}"]`);
  if (!el)
    throw new Error(`Expected submit button for form "${formId}" in DOM`);
  return el as HTMLButtonElement;
}

/** Type a raw number into a CurrencyInput (focus → type → blur commits). */
function setCurrency(ariaLabel: string, value: string) {
  const input = screen.getByLabelText(ariaLabel) as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

function openDrawer(): HTMLElement {
  return required(
    document.querySelector('[data-slot="detail-drawer"]'),
    "detail drawer",
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("CashRegisterClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.branchId = "all";
    mocks.useCurrentOrg.mockReturnValue({
      data: { orgId: "org-1" },
      isPending: false,
    });
    mocks.useCurrentSession.mockReturnValue(sessionHookResult());
    mocks.useOpenSession.mockReturnValue(mutationResult());
    mocks.useCloseSession.mockReturnValue(mutationResult());
    mocks.useCashOut.mockReturnValue(mutationResult());
    mocks.useIsFirstLoad.mockReturnValue(false);
  });

  describe("loading state", () => {
    it("shows skeletons while org + session are loading on first load", () => {
      mocks.useCurrentOrg.mockReturnValue({ data: undefined, isPending: true });
      mocks.useCurrentSession.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
      });
      mocks.useIsFirstLoad.mockReturnValue(true);

      render(<CashRegisterClient />);

      expect(
        document.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBeGreaterThan(0);
      expect(
        screen.queryByText("cashRegister.noSession"),
      ).not.toBeInTheDocument();
    });

    it("skips the skeleton after the first load and shows the no-session card", () => {
      mocks.useCurrentSession.mockReturnValue({
        data: null,
        isPending: true,
        error: null,
      });

      render(<CashRegisterClient />);

      expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
        0,
      );
      expect(screen.getByText("cashRegister.noSession")).toBeInTheDocument();
    });
  });

  describe("open session rendering", () => {
    it("renders the session header with opened time, status and entry count", () => {
      const session = makeSession();
      mocks.useCurrentSession.mockReturnValue(sessionHookResult());
      render(<CashRegisterClient />);

      expect(mocks.useCurrentSession).toHaveBeenCalledWith("org-1", null);
      expect(screen.getByText("cashRegister.sessionOpen")).toBeInTheDocument();
      const openedTime = new Date(session.opened_at).toLocaleTimeString();
      expect(
        screen.getByText(`cashRegister.openedAt ${openedTime}`),
      ).toBeInTheDocument();
      expect(screen.getByText("2 transactions")).toBeInTheDocument();
    });

    it("renders the four balance cards with formatted currency values", () => {
      render(<CashRegisterClient />);

      expect(
        screen.getByText("cashRegister.openingBalance"),
      ).toBeInTheDocument();
      expect(screen.getByText("₮ 50,000")).toBeInTheDocument();
      expect(screen.getByText("cashRegister.cashIn")).toBeInTheDocument();
      expect(screen.getByText("₮ 60,000")).toBeInTheDocument();
      expect(screen.getByText("cashRegister.cashOut")).toBeInTheDocument();
      expect(screen.getByText("₮ 20,000")).toBeInTheDocument();
      expect(
        screen.getByText("cashRegister.expectedBalance"),
      ).toBeInTheDocument();
      expect(screen.getByText("₮ 90,000")).toBeInTheDocument();
    });

    it("derives the expected balance from opening + in - out when expected_balance is null", () => {
      mocks.useCurrentSession.mockReturnValue(
        sessionHookResult({ data: makeSession({ expected_balance: null }) }),
      );

      render(<CashRegisterClient />);

      expect(screen.getByText("₮ 90,000")).toBeInTheDocument();
    });
  });

  describe("transaction list", () => {
    it("renders entries with description, source and signed amounts", () => {
      render(<CashRegisterClient />);

      expect(screen.getByText("cashRegister.entries")).toBeInTheDocument();
      expect(screen.getByText("Repair payment")).toBeInTheDocument();
      expect(screen.getByText(/· invoice payment$/)).toBeInTheDocument();
      expect(screen.getByText("+₮ 60,000")).toBeInTheDocument();
      // entry with null description falls back to its source
      expect(screen.getByText("expense")).toBeInTheDocument();
      expect(screen.getByText("-₮ 20,000")).toBeInTheDocument();
    });

    it("hides the transaction list when the session has no entries", () => {
      mocks.useCurrentSession.mockReturnValue(
        sessionHookResult({ data: makeSession({ entries: [] }) }),
      );

      render(<CashRegisterClient />);

      expect(
        screen.queryByText("cashRegister.entries"),
      ).not.toBeInTheDocument();
    });
  });

  describe("open session dialog", () => {
    it("submits the entered balance and closes the dialog on success", async () => {
      const user = userEvent.setup();
      const mutateAsync = resolvingMutateAsync({ id: "session-new" });
      mocks.useOpenSession.mockReturnValue({ mutateAsync, isPending: false });
      mocks.branchId = "branch-1";
      mocks.useCurrentSession.mockReturnValue({
        data: null,
        isPending: false,
        error: null,
      });

      render(<CashRegisterClient />);

      expect(mocks.useCurrentSession).toHaveBeenCalledWith("org-1", "branch-1");
      await user.click(
        screen.getAllByRole("button", {
          name: "cashRegister.openSession",
        })[0],
      );
      setCurrency("cashRegister.openingBalance", "75000");
      await user.click(submitButton("open-session-form"));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
      expect(mutateAsync).toHaveBeenCalledWith(
        { opening_balance: 75000, branch_id: "branch-1" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "common.cancel" }),
        ).not.toBeInTheDocument(),
      );
    });

    it("keeps the submit disabled until a balance is entered", async () => {
      const user = userEvent.setup();
      mocks.useCurrentSession.mockReturnValue({
        data: null,
        isPending: false,
        error: null,
      });

      render(<CashRegisterClient />);

      await user.click(
        screen.getAllByRole("button", {
          name: "cashRegister.openSession",
        })[0],
      );
      expect(submitButton("open-session-form")).toBeDisabled();
      setCurrency("cashRegister.openingBalance", "10000");
      expect(submitButton("open-session-form")).toBeEnabled();
    });

    it("shows the saving label and disables submit while the mutation is pending", async () => {
      const user = userEvent.setup();
      mocks.useOpenSession.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      });
      mocks.useCurrentSession.mockReturnValue({
        data: null,
        isPending: false,
        error: null,
      });

      render(<CashRegisterClient />);

      await user.click(
        screen.getAllByRole("button", {
          name: "cashRegister.openSession",
        })[0],
      );
      setCurrency("cashRegister.openingBalance", "10000");
      expect(screen.getByText("common.saving")).toBeInTheDocument();
      expect(submitButton("open-session-form")).toBeDisabled();
    });

    it("keeps the dialog open and toasts when the mutation fails", async () => {
      const user = userEvent.setup();
      const mutateAsync = vi
        .fn()
        .mockRejectedValue(new Error("failed to open"));
      mocks.useOpenSession.mockReturnValue({ mutateAsync, isPending: false });
      mocks.useCurrentSession.mockReturnValue({
        data: null,
        isPending: false,
        error: null,
      });

      render(<CashRegisterClient />);

      await user.click(
        screen.getAllByRole("button", {
          name: "cashRegister.openSession",
        })[0],
      );
      setCurrency("cashRegister.openingBalance", "75000");
      await user.click(submitButton("open-session-form"));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
      expect(mutateAsync).toHaveBeenCalledWith(
        { opening_balance: 75000, branch_id: null },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      // The rejection is caught: error toast + server report, dialog stays
      // open (no onSuccess → no close, form not reset).
      await waitFor(() =>
        expect(mocks.toast.error).toHaveBeenCalledWith("failed to open"),
      );
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
      expect(
        screen.getByLabelText("cashRegister.openingBalance"),
      ).toBeInTheDocument();
    });
  });

  describe("close session dialog", () => {
    it("shows the summary and submits closing balance + note on success", async () => {
      const user = userEvent.setup();
      const mutateAsync = resolvingMutateAsync({ id: "session-1" });
      mocks.useCloseSession.mockReturnValue({ mutateAsync, isPending: false });

      render(<CashRegisterClient />);

      await user.click(
        screen.getByRole("button", { name: "cashRegister.closeSession" }),
      );

      const dialog = openDrawer();
      expect(within(dialog).getByText("₮ 50,000")).toBeInTheDocument();
      expect(within(dialog).getByText("+₮ 60,000")).toBeInTheDocument();
      expect(within(dialog).getByText("-₮ 20,000")).toBeInTheDocument();
      expect(within(dialog).getByText("₮ 90,000")).toBeInTheDocument();

      setCurrency("cashRegister.closingBalance", "90000");
      fireEvent.change(
        screen.getByPlaceholderText("cashRegister.discrepancyNotePlaceholder"),
        { target: { value: "All counted" } },
      );
      await user.click(submitButton("close-session-form"));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
      expect(mutateAsync).toHaveBeenCalledWith(
        { sessionId: "session-1", closing_balance: 90000, note: "All counted" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "common.cancel" }),
        ).not.toBeInTheDocument(),
      );
    });

    it("shows the live discrepancy preview: balanced, over and short", async () => {
      const user = userEvent.setup();

      render(<CashRegisterClient />);

      await user.click(
        screen.getByRole("button", { name: "cashRegister.closeSession" }),
      );
      const dialog = openDrawer();

      setCurrency("cashRegister.closingBalance", "90000");
      await waitFor(() =>
        expect(
          within(dialog).getByText("cashRegister.balanced"),
        ).toBeInTheDocument(),
      );

      setCurrency("cashRegister.closingBalance", "95000");
      await waitFor(() =>
        expect(
          within(dialog).getByText("+₮ 5,000 cashRegister.over"),
        ).toBeInTheDocument(),
      );

      setCurrency("cashRegister.closingBalance", "85000");
      await waitFor(() =>
        expect(
          within(dialog).getByText("₮ -5,000 cashRegister.short"),
        ).toBeInTheDocument(),
      );
    });

    it("keeps the dialog open and toasts when closing fails", async () => {
      const user = userEvent.setup();
      const mutateAsync = vi.fn().mockRejectedValue(new Error("close failed"));
      mocks.useCloseSession.mockReturnValue({ mutateAsync, isPending: false });

      render(<CashRegisterClient />);

      await user.click(
        screen.getByRole("button", { name: "cashRegister.closeSession" }),
      );
      setCurrency("cashRegister.closingBalance", "90000");
      fireEvent.change(
        screen.getByPlaceholderText("cashRegister.discrepancyNotePlaceholder"),
        { target: { value: "All counted" } },
      );
      await user.click(submitButton("close-session-form"));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
      await waitFor(() =>
        expect(mocks.toast.error).toHaveBeenCalledWith("close failed"),
      );
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
      expect(openDrawer()).toBeInTheDocument();
    });
  });

  describe("cash out dialog", () => {
    it("submits amount and description and closes on success", async () => {
      const user = userEvent.setup();
      const mutateAsync = resolvingMutateAsync({ id: "entry-1" });
      mocks.useCashOut.mockReturnValue({ mutateAsync, isPending: false });

      render(<CashRegisterClient />);

      await user.click(
        screen.getByRole("button", { name: "cashRegister.addCashOut" }),
      );
      setCurrency("cashRegister.cashOutAmount", "5000");
      fireEvent.change(required(q("description"), "description input"), {
        target: { value: "  Office supplies  " },
      });
      await user.click(submitButton("cash-out-form"));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
      expect(mutateAsync).toHaveBeenCalledWith(
        {
          sessionId: "session-1",
          amount: 5000,
          description: "Office supplies",
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "common.cancel" }),
        ).not.toBeInTheDocument(),
      );
    });

    it("keeps the dialog open and toasts when the cash-out fails", async () => {
      const user = userEvent.setup();
      const mutateAsync = vi
        .fn()
        .mockRejectedValue(new Error("cash out failed"));
      mocks.useCashOut.mockReturnValue({ mutateAsync, isPending: false });

      render(<CashRegisterClient />);

      await user.click(
        screen.getByRole("button", { name: "cashRegister.addCashOut" }),
      );
      setCurrency("cashRegister.cashOutAmount", "5000");
      fireEvent.change(required(q("description"), "description input"), {
        target: { value: "Office supplies" },
      });
      await user.click(submitButton("cash-out-form"));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
      await waitFor(() =>
        expect(mocks.toast.error).toHaveBeenCalledWith("cash out failed"),
      );
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        expect.any(Error),
      );
      expect(openDrawer()).toBeInTheDocument();
    });
  });

  describe("error states", () => {
    it("falls back to the no-session card when the session query errors", () => {
      mocks.useCurrentSession.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("boom"),
      });

      render(<CashRegisterClient />);

      expect(screen.queryAllByText("₮ 50,000")).toHaveLength(0);
      expect(screen.getByText("cashRegister.noSession")).toBeInTheDocument();
    });
  });
});
