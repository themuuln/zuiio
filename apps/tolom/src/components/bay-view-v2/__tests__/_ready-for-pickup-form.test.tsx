import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ReadyForPickupForm } from "../_ready-for-pickup-form";

// ── next-intl: render keys as text (stable assertions) ───────────────
// NOTE: useTranslations must return a STABLE function — components memoize
// effects on `t`; a fresh identity per render would re-run load effects.
const tStub = (key: string) => key;
vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useTranslations: () => tStub,
  useLocale: () => "mn",
}));

const reportServerErrorMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

const fees = { cash: 0, card: 1, bank_transfer: 0, manual: 0 };

const khanbank = {
  id: "khanbank",
  nameEn: "Khan Bank",
  nameMn: "Хаан банк",
  logo: "",
  brandColor: "#1f4e9c",
  accountNumber: "1234567890",
  isDefault: true,
};

function baseProps() {
  return {
    vehiclePlate: "3333MNO",
    currentOdometer: 60000,
    grandTotal: 120000,
    paymentMethodFees: fees,
    transferBanks: [] as never[],
    onConfirm: vi.fn().mockResolvedValue(undefined),
    onBack: vi.fn(),
  };
}

describe("ReadyForPickupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders plate, heading and prefilled odometer", () => {
    const props = baseProps();
    render(<ReadyForPickupForm {...props} />);

    expect(screen.getAllByText("markReady").length).toBeGreaterThan(0);
    expect(screen.getByText("3333MNO")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60000")).toBeInTheDocument();
  });

  it("submits the mapped payload", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<ReadyForPickupForm {...props} />);

    const odometerInput = screen.getByDisplayValue("60000");
    await user.click(odometerInput);
    await user.clear(odometerInput);
    await user.type(odometerInput, "62000");
    await user.type(screen.getByPlaceholderText("notePlaceholder"), "Ready");

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith({
        odometerReading: 62000,
        mechanicNotes: "Ready",
        paymentMethod: "bank_transfer",
        transferBankId: null,
      }),
    );
  });

  it("switches payment method and submits with the selected method", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<ReadyForPickupForm {...props} />);

    await user.click(screen.getByRole("button", { name: /^card/ }));
    // Summary card + fee breakdown both show the fee-adjusted total
    expect(screen.getAllByText("₮ 121,200").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: "card",
          odometerReading: 60000,
        }),
      ),
    );
  });

  it("shows the transfer bank picker and submits the default bank id", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    props.transferBanks = [khanbank];
    render(<ReadyForPickupForm {...props} />);

    // bank_transfer is the default method → picker visible
    expect(screen.getByText("Хаан банк")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: "bank_transfer",
          transferBankId: "khanbank",
        }),
      ),
    );
  });

  it("calls onBack when cancel is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<ReadyForPickupForm {...props} />);

    await user.click(screen.getByRole("button", { name: /cancel/ }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("disables actions and shows the saving label while onConfirm is pending", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    let resolveConfirm: (value: unknown) => void = () => {};
    props.onConfirm.mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );
    render(<ReadyForPickupForm {...props} />);

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    expect(
      await screen.findByRole("button", { name: /postServiceSaving/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/ })).toBeDisabled();

    resolveConfirm(undefined);
    await waitFor(() => expect(props.onConfirm).toHaveBeenCalledTimes(1));
    // Success path clears the saving state: actions re-enable
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /markReady/ })).toBeEnabled(),
    );
    expect(
      screen.queryByRole("button", { name: /postServiceSaving/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/ })).toBeEnabled();
  });

  it("shows an error banner when onConfirm rejects", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    props.onConfirm.mockRejectedValue(new Error("save failed"));
    render(<ReadyForPickupForm {...props} />);

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    expect(await screen.findByText("save failed")).toBeInTheDocument();
    expect(reportServerErrorMock).toHaveBeenCalled();
    // Catch path resets the saving state
    expect(screen.getByRole("button", { name: /markReady/ })).toBeEnabled();
  });
});
