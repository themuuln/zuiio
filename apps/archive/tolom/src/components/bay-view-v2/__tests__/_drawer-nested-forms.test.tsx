import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { render } from "@/test/test-utils";
import { DrawerNestedForms } from "../_drawer-nested-forms";

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

const wo = {
  id: "wo-1",
  status: "In Progress",
  vehicle: {
    plate_number: "5555STU",
    odometer: 70000,
  },
} as unknown as WorkOrderDetail;

function baseProps() {
  return {
    wo,
    showReadyForm: true,
    grandTotal: 80000,
    paymentMethodFees: fees,
    transferBanks: [] as never[],
    onReadyFormClose: vi.fn(),
    onReadyForPickupSubmit: vi.fn().mockResolvedValue(undefined),
  };
}

describe("DrawerNestedForms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there is no work order", () => {
    const props = baseProps();
    props.wo = null;
    render(<DrawerNestedForms {...props} />);

    expect(
      document.querySelector('[data-slot="detail-drawer"]'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("5555STU")).not.toBeInTheDocument();
  });

  it("does not show the ready-for-pickup form when showReadyForm is false", () => {
    const props = baseProps();
    props.showReadyForm = false;
    render(<DrawerNestedForms {...props} />);

    expect(screen.queryByText("5555STU")).not.toBeInTheDocument();
  });

  it("shows the ready-for-pickup form with the vehicle plate when open", () => {
    render(<DrawerNestedForms {...baseProps()} />);

    expect(screen.getByText("5555STU")).toBeInTheDocument();
    expect(screen.getAllByText("markReady").length).toBeGreaterThan(0);
  });

  it("submits the form payload to onReadyForPickupSubmit", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<DrawerNestedForms {...props} />);

    const odometerInput = screen.getByDisplayValue("70000");
    await user.click(odometerInput);
    await user.clear(odometerInput);
    await user.type(odometerInput, "72000");
    await user.type(screen.getByPlaceholderText("notePlaceholder"), "All good");

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onReadyForPickupSubmit).toHaveBeenCalledWith({
        odometerReading: 72000,
        mechanicNotes: "All good",
        paymentMethod: "bank_transfer",
        transferBankId: null,
      }),
    );
  });

  it("closes the form via the cancel button", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<DrawerNestedForms {...props} />);

    await user.click(screen.getByRole("button", { name: /cancel/ }));
    expect(props.onReadyFormClose).toHaveBeenCalledTimes(1);
  });
});
