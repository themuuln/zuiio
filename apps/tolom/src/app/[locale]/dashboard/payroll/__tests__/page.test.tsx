import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import PayrollPage from "../page";

// ── Mock state (hoisted so mock factories can reference it) ─────────
const mocks = vi.hoisted(() => ({
  useMechanics: vi.fn(),
  usePayRates: vi.fn(),
  usePayrollRecords: vi.fn(),
  upsertMutateAsync: vi.fn().mockResolvedValue({}),
  calculateMutateAsync: vi.fn().mockResolvedValue([]),
  updateRecordMutateAsync: vi.fn().mockResolvedValue({}),
  reportServerError: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/lib/queries/use-organization", () => ({
  useCurrentOrg: () => ({ data: { orgId: "org-1" }, isPending: false }),
}));

vi.mock("@/lib/stores", () => ({
  useSelectedBranchId: () => "all",
}));

vi.mock("@/lib/queries/use-reports", () => ({
  useMechanics: mocks.useMechanics,
}));

vi.mock("@/lib/queries/use-payroll", () => ({
  usePayRates: mocks.usePayRates,
  usePayrollRecords: mocks.usePayrollRecords,
  usePayRateUpsert: () => ({
    mutateAsync: mocks.upsertMutateAsync,
    isPending: false,
  }),
  useCalculatePayroll: () => ({
    mutateAsync: mocks.calculateMutateAsync,
    isPending: false,
  }),
  useUpdatePayrollRecord: () => ({
    mutateAsync: mocks.updateRecordMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));

// ── Fixtures ────────────────────────────────────────────────────────

const mechanics = [
  { id: "m-1", full_name: "Bat Erdene" },
  { id: "m-2", full_name: null },
];

const payRates = [
  {
    mechanic_id: "m-1",
    hourly_rate: 15000,
    effective_from: "2026-01-01",
    mechanic_name: null,
  },
  {
    mechanic_id: "m-9",
    hourly_rate: 20000,
    effective_from: "2026-02-01",
    mechanic_name: "Ghost Rate",
  },
];

const records = [
  {
    id: "r-1",
    mechanic_id: "m-1",
    mechanic_name: "Bat Erdene",
    total_hours: 40,
    hourly_rate: 15000,
    gross_pay: 600000,
    ndsh_enabled: true,
    ndsh_employer_amount: 69000,
    ndsh_employee_amount: 60000,
    status: "draft",
  },
  {
    id: "r-2",
    mechanic_id: "m-2",
    mechanic_name: null,
    total_hours: 30,
    hourly_rate: 12000,
    gross_pay: 360000,
    ndsh_enabled: false,
    ndsh_employer_amount: 0,
    ndsh_employee_amount: 0,
    status: "approved",
  },
  {
    id: "r-3",
    mechanic_id: "m-1",
    mechanic_name: "Bat Erdene",
    total_hours: 20,
    hourly_rate: 15000,
    gross_pay: 300000,
    ndsh_enabled: false,
    ndsh_employer_amount: 0,
    ndsh_employee_amount: 0,
    status: "paid",
  },
];

function setQuery(
  hook: ReturnType<typeof vi.fn>,
  data: unknown,
  opts: { isPending?: boolean; error?: Error | null } = {},
) {
  hook.mockReturnValue({
    data,
    isPending: opts.isPending ?? false,
    error: opts.error ?? null,
  });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("PayrollPage", () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const effectiveFrom = `${year}-${String(month).padStart(2, "0")}-01`;

  beforeEach(() => {
    vi.clearAllMocks();
    setQuery(mocks.useMechanics, mechanics);
    setQuery(mocks.usePayRates, payRates);
    setQuery(mocks.usePayrollRecords, records);
  });

  it("shows skeletons while mechanics or rates are pending", () => {
    setQuery(mocks.useMechanics, [], { isPending: true });
    render(<PayrollPage />);
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("renders the stats cards with counts and gross payroll", async () => {
    render(<PayrollPage />);

    expect(
      await screen.findByText("payroll.activeMechanics"),
    ).toBeInTheDocument();
    // active mechanics card (2), rates configured (2), records (3)
    const values = screen.getAllByText(/^(2|3)$/);
    expect(values.length).toBeGreaterThanOrEqual(3);
    // gross payroll: 600000 + 360000 + 300000 = 1,260,000
    expect(screen.getAllByText(/₮ 1,260,000/).length).toBeGreaterThan(0);
  });

  it("lists mechanics and standalone rates with their current rate", async () => {
    render(<PayrollPage />);

    expect((await screen.findAllByText("Bat Erdene")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Ghost Rate")).toBeInTheDocument();
    // mechanic without a rate gets the noRate badge
    expect(screen.getByText("payroll.noRate")).toBeInTheDocument();
    expect(screen.getAllByText(/₮ 15,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₮ 20,000/).length).toBeGreaterThan(0);
  });

  it("shows the empty state when no mechanics or rates exist", async () => {
    setQuery(mocks.useMechanics, []);
    setQuery(mocks.usePayRates, []);
    render(<PayrollPage />);
    expect(await screen.findByText("payroll.noMechanics")).toBeInTheDocument();
  });

  it("saves an edited hourly rate for a mechanic", async () => {
    const user = userEvent.setup();
    render(<PayrollPage />);
    await screen.findAllByText("Bat Erdene");

    const batRow = screen.getAllByText("Bat Erdene")[0].closest("tr");
    if (!batRow) throw new Error("expected Bat Erdene row");
    const rateInput = within(batRow).getByRole("textbox", { name: /Currency/ });
    await user.click(rateInput);
    await user.keyboard("20000");
    await user.tab();

    await user.click(within(batRow).getByText("payroll.save"));
    expect(mocks.upsertMutateAsync).toHaveBeenCalledWith({
      mechanicId: "m-1",
      hourlyRate: 20000,
      effectiveFrom,
    });
    expect(mocks.toast.success).toHaveBeenCalledWith("payroll.saved");
  });

  it("keeps the save button disabled until the rate changes", async () => {
    render(<PayrollPage />);
    await screen.findAllByText("Bat Erdene");

    const batRow = screen.getAllByText("Bat Erdene")[0].closest("tr");
    if (!batRow) throw new Error("expected Bat Erdene row");
    expect(within(batRow).getByText("payroll.save")).toBeDisabled();
    expect(mocks.upsertMutateAsync).not.toHaveBeenCalled();
  });

  it("toasts an error when saving a rate fails", async () => {
    const user = userEvent.setup();
    mocks.upsertMutateAsync.mockRejectedValue(new Error("rate conflict"));
    render(<PayrollPage />);
    await screen.findAllByText("Bat Erdene");

    const batRow = screen.getAllByText("Bat Erdene")[0].closest("tr");
    if (!batRow) throw new Error("expected Bat Erdene row");
    const rateInput = within(batRow).getByRole("textbox", { name: /Currency/ });
    await user.click(rateInput);
    await user.keyboard("20000");
    await user.tab();
    await user.click(within(batRow).getByText("payroll.save"));

    await waitFor(() =>
      expect(mocks.toast.error).toHaveBeenCalledWith("rate conflict"),
    );
    expect(mocks.reportServerError).toHaveBeenCalled();
  });

  it("calculates payroll for the current period", async () => {
    const user = userEvent.setup();
    render(<PayrollPage />);
    await screen.findByText("payroll.calculate");

    await user.click(screen.getByText("payroll.calculate"));
    expect(mocks.calculateMutateAsync).toHaveBeenCalledWith({ year, month });
    expect(mocks.toast.success).toHaveBeenCalledWith("payroll.calculated");
  });

  it("approves a draft record", async () => {
    const user = userEvent.setup();
    render(<PayrollPage />);
    const draftRow = (await screen.findByText("payroll.approve")).closest("tr");
    if (!draftRow) throw new Error("expected draft row");

    await user.click(within(draftRow).getByText("payroll.approve"));
    expect(mocks.updateRecordMutateAsync).toHaveBeenCalledWith({
      recordId: "r-1",
      action: "approve",
      year,
      month,
    });
    expect(mocks.toast.success).toHaveBeenCalledWith("payroll.approvedMsg");
  });

  it("marks an approved record as paid", async () => {
    const user = userEvent.setup();
    render(<PayrollPage />);
    const payButton = await screen.findByText("payroll.markAsPaid");
    const approvedRow = payButton.closest("tr");
    if (!approvedRow) throw new Error("expected approved row");

    await user.click(payButton);
    expect(mocks.updateRecordMutateAsync).toHaveBeenCalledWith({
      recordId: "r-2",
      action: "pay",
      year,
      month,
    });
    expect(mocks.toast.success).toHaveBeenCalledWith("payroll.paidMsg");
  });

  it("renders per-status actions: approve, mark as paid and paid badge", async () => {
    render(<PayrollPage />);
    expect(await screen.findByText("payroll.approve")).toBeInTheDocument();
    expect(screen.getByText("payroll.markAsPaid")).toBeInTheDocument();
    // paid status shows in the status badge and the paid action badge
    expect(screen.getAllByText("payroll.paid").length).toBeGreaterThan(0);
  });

  it("shows the error alert when a query fails", async () => {
    setQuery(mocks.usePayRates, [], { error: new Error("rates down") });
    render(<PayrollPage />);
    expect(await screen.findByText("rates down")).toBeInTheDocument();
    expect(screen.getByText("somethingWentWrong")).toBeInTheDocument();
  });
});
