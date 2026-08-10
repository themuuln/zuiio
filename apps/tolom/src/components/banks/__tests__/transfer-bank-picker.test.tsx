import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedTransferBank } from "@/lib/payments/org-bank-accounts";
import { render } from "@/test/test-utils";
import { TransferBankPicker } from "../transfer-bank-picker";

vi.mock("next-intl", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@/components/banks/bank-logo", () => ({
  BankLogo: () => <span data-testid="bank-logo" />,
}));

const BANKS: ResolvedTransferBank[] = [
  {
    id: "khanbank",
    nameEn: "Khan Bank",
    nameMn: "Хан банк",
    brandColor: "#0f8b8d",
    logo: "/banks/khan.svg",
    accountNumber: "5000123456",
    accountHolder: "ACME LLC",
    isDefault: true,
  },
  {
    id: "golomt",
    nameEn: "Golomt Bank",
    nameMn: "Голомт банк",
    brandColor: "#7a1f5f",
    logo: "/banks/golomt.svg",
    accountNumber: "2000456789",
    accountHolder: undefined,
    isDefault: false,
  },
];

describe("TransferBankPicker", () => {
  it("renders bank names, account numbers and the default marker", () => {
    render(
      <TransferBankPicker banks={BANKS} value={null} onChange={vi.fn()} />,
      { locale: "en" },
    );

    expect(screen.getByText("Khan Bank")).toBeInTheDocument();
    expect(screen.getByText("Golomt Bank")).toBeInTheDocument();
    expect(screen.getByText("5000123456")).toBeInTheDocument();
    expect(screen.getByText("2000456789")).toBeInTheDocument();
    expect(screen.getByText("ACME LLC")).toBeInTheDocument();
    expect(screen.getByText("transferBankDefault")).toBeInTheDocument();
    // 2 radio buttons, one per bank
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("marks the selected bank as checked", () => {
    render(
      <TransferBankPicker banks={BANKS} value="golomt" onChange={vi.fn()} />,
      { locale: "en" },
    );

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
  });

  it("reports the picked bank id via onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TransferBankPicker banks={BANKS} value={null} onChange={onChange} />,
      {
        locale: "en",
      },
    );

    await user.click(screen.getByRole("radio", { name: /Golomt Bank/ }));
    expect(onChange).toHaveBeenCalledWith("golomt");
  });

  it("renders the error message when provided", () => {
    render(
      <TransferBankPicker
        banks={BANKS}
        value={null}
        onChange={vi.fn()}
        error="Please pick a transfer bank"
      />,
      { locale: "en" },
    );
    expect(screen.getByText("Please pick a transfer bank")).toBeInTheDocument();
  });

  it("shows a hint instead of options when no banks are configured", () => {
    render(<TransferBankPicker banks={[]} value={null} onChange={vi.fn()} />, {
      locale: "en",
    });
    expect(screen.getByText("transferBankNotConfigured")).toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
