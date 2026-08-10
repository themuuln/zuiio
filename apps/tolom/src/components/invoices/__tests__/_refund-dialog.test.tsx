import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { RefundDialog } from "../_refund-dialog";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  reportServerError: vi.fn(),
}));

vi.mock("@/lib/queries/use-refunds", () => ({
  useRecordRefund: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

beforeEach(() => {
  mocks.mutateAsync.mockReset();
  mocks.reportServerError.mockReset();
});

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    invoiceId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    orgId: "org-1",
    invoiceTotal: 450000,
    amountPaid: 300000,
    amountRefunded: 50000,
    invoiceNumber: "2026-0042",
    ...overrides,
  };
}

function renderDialog(overrides: Record<string, unknown> = {}) {
  const props = baseProps(overrides);
  render(<RefundDialog {...props} />);
  return props;
}

async function fillAmount(amount: string) {
  const user = userEvent.setup();
  const input = screen.getByLabelText("Currency");
  await user.click(input);
  await user.clear(input);
  await user.type(input, amount);
  await user.tab();
}

describe("RefundDialog", () => {
  it("renders the invoice summary with the exact max refundable amount", () => {
    renderDialog();

    expect(screen.getByText("invoice.recordRefund")).toBeInTheDocument();
    expect(screen.getByText(/2026-0042/)).toBeInTheDocument();
    // Total / paid / refunded / max refundable = 300k - 50k
    expect(screen.getByText("₮ 450,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 300,000")).toBeInTheDocument();
    expect(screen.getByText("-₮ 50,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 250,000")).toBeInTheDocument();
    // The amount input is pre-filled with the max refundable
    expect(
      (screen.getByLabelText("Currency") as HTMLInputElement).value,
    ).toContain("250,000");
  });

  it("hides the already-refunded row when nothing was refunded", () => {
    renderDialog({ amountRefunded: 0 });

    expect(screen.queryByText("-₮ 50,000")).not.toBeInTheDocument();
    // Paid amount and max refundable are both ₮ 300,000 here
    expect(screen.getAllByText("₮ 300,000").length).toBeGreaterThanOrEqual(2);
  });

  it("disables submission when nothing is refundable", () => {
    renderDialog({ amountPaid: 50000, amountRefunded: 50000 });

    expect(
      screen.getByRole("button", { name: "common.continue" }),
    ).toBeDisabled();
  });

  it("rejects an over-long reference and stays on the form", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("invoice.refundReferencePlaceholder"),
      "x".repeat(201),
    );
    await user.click(screen.getByRole("button", { name: "common.continue" }));

    expect(
      await screen.findByText("Reference must be under 200 characters"),
    ).toBeInTheDocument();
    // Still on the form step — the confirm alert is not shown
    expect(screen.queryByText("refund.confirmTitle")).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("rejects over-long notes", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText("invoice.refundNotesPlaceholder"),
      "y".repeat(501),
    );
    await user.click(screen.getByRole("button", { name: "common.continue" }));

    expect(
      await screen.findByText("Notes must be under 500 characters"),
    ).toBeInTheDocument();
  });

  it("submits the refund payload and closes the dialog on success", async () => {
    const user = userEvent.setup();
    mocks.mutateAsync.mockResolvedValue({ id: "ref-1" });
    const props = renderDialog();

    // Move to the confirm step — handleSubmit validates asynchronously, so
    // the click's microtask continuations must run inside act()
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "common.continue" }));
    });

    // Confirm step shows the alert, the amount and the method
    expect(await screen.findByText("refund.confirmTitle")).toBeInTheDocument();
    expect(screen.getByText("-₮ 250,000")).toBeInTheDocument();
    expect(screen.getByText("payment.cash")).toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", { name: "invoice.confirmRefund" }),
    );

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        invoice_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        amount: 250000,
        method: "cash",
        reason: "",
        reference: "",
        notes: "",
      }),
    );
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses the edited amount and selected method in the refund payload", async () => {
    const user = userEvent.setup();
    mocks.mutateAsync.mockResolvedValue({ id: "ref-2" });
    renderDialog();

    await fillAmount("100000");
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "common.continue" }));
    });

    // Summary reflects the edited amount
    expect(await screen.findByText("-₮ 100,000")).toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", { name: "invoice.confirmRefund" }),
    );

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 100000, method: "cash" }),
      ),
    );
  });

  it("clamps an entered amount to the max refundable", async () => {
    renderDialog();

    await fillAmount("9999999");

    expect(
      (screen.getByLabelText("Currency") as HTMLInputElement).value,
    ).toContain("250,000");
  });

  it("goes back from the confirm step to the form", async () => {
    const user = userEvent.setup();
    renderDialog();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "common.continue" }));
    });
    await user.click(
      await screen.findByRole("button", { name: "common.back" }),
    );

    expect(screen.queryByText("refund.confirmTitle")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.continue" }),
    ).toBeInTheDocument();
  });

  it("closes the dialog from the cancel button", async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(screen.getByRole("button", { name: "common.cancel" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("reports refund failures and keeps the dialog open", async () => {
    const user = userEvent.setup();
    const failure = new Error("refund endpoint down");
    mocks.mutateAsync.mockRejectedValue(failure);
    const props = renderDialog();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "common.continue" }));
    });
    await user.click(
      await screen.findByRole("button", { name: "invoice.confirmRefund" }),
    );

    await waitFor(() =>
      expect(mocks.reportServerError).toHaveBeenCalledWith(
        "Unexpected error",
        failure,
      ),
    );
    expect(props.onOpenChange).not.toHaveBeenCalled();
    // Still on the confirm step
    expect(screen.getByText("refund.confirmTitle")).toBeInTheDocument();
  });
});
