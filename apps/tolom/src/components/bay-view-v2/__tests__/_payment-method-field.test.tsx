import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PaymentMethodField } from "../_payment-method-field";

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

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    value: "bank_transfer" as const,
    onChange: vi.fn(),
    transferBankId: null,
    onTransferBankChange: vi.fn(),
    subtotal: 100000,
    fees,
    transferBanks: [] as never[],
    ...overrides,
  };
}

describe("PaymentMethodField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all four payment method buttons", () => {
    render(<PaymentMethodField {...baseProps()} />);

    expect(screen.getByRole("button", { name: /^cash/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^card/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^bankTransfer/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^manual/ })).toBeInTheDocument();
  });

  it("calls onChange with the clicked method", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PaymentMethodField {...props} />);

    await user.click(screen.getByRole("button", { name: /^card/ }));
    expect(props.onChange).toHaveBeenCalledWith("card");

    await user.click(screen.getByRole("button", { name: /^manual/ }));
    expect(props.onChange).toHaveBeenCalledWith("manual");
  });

  it("shows the fee percentage badge on methods with a fee", () => {
    render(<PaymentMethodField {...baseProps({ value: "cash" })} />);

    expect(screen.getByText("(+1%)")).toBeInTheDocument();
  });

  it("shows subtotal, fee and total for a method with a fee", () => {
    render(<PaymentMethodField {...baseProps({ value: "card" })} />);

    expect(screen.getByText("₮ 100,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 1,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 101,000")).toBeInTheDocument();
  });

  it("does not render a fee row when the selected method has no fee", () => {
    render(<PaymentMethodField {...baseProps({ value: "cash" })} />);

    // Subtotal and total rows both show the same amount when the fee is 0
    expect(screen.getAllByText("₮ 100,000").length).toBeGreaterThan(0);
    expect(screen.queryByText("₮ 1,000")).not.toBeInTheDocument();
  });

  it("renders the transfer bank picker for bank_transfer and notifies changes", async () => {
    const user = userEvent.setup();
    const props = baseProps({ transferBanks: [khanbank] });
    render(<PaymentMethodField {...props} />);

    expect(screen.getByText("Хаан банк")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Хаан банк/ }));
    expect(props.onTransferBankChange).toHaveBeenCalledWith("khanbank");
  });

  it("auto-selects the default transfer bank when switching to bank_transfer", async () => {
    const user = userEvent.setup();
    const props = baseProps({
      value: "cash",
      transferBanks: [khanbank],
    });
    const { rerender } = render(<PaymentMethodField {...props} />);

    await user.click(screen.getByRole("button", { name: /^bankTransfer/ }));
    expect(props.onChange).toHaveBeenCalledWith("bank_transfer");

    // Simulate the parent updating the value, then the effect auto-selects
    rerender(<PaymentMethodField {...props} value="bank_transfer" />);
    expect(props.onTransferBankChange).toHaveBeenCalledWith("khanbank");
  });

  it("does not auto-select a bank when one is already selected", () => {
    const props = baseProps({
      value: "bank_transfer",
      transferBankId: "golomt",
      transferBanks: [khanbank],
    });
    render(<PaymentMethodField {...props} />);

    expect(props.onTransferBankChange).not.toHaveBeenCalled();
  });

  it("renders the passed error message", () => {
    render(
      <PaymentMethodField
        {...baseProps({ value: "cash", error: "Payment method required" })}
      />,
    );

    expect(screen.getByText("Payment method required")).toBeInTheDocument();
  });

  it("shows the no-fee hint when subtotal is zero", () => {
    render(<PaymentMethodField {...baseProps({ subtotal: 0 })} />);

    expect(screen.getByText("paymentNoFeeOnZero")).toBeInTheDocument();
  });
});
