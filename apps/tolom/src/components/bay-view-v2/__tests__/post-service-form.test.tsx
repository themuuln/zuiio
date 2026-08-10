import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import type { WorkOrderServiceItem } from "../_schema";
import { PostServiceForm, PostServiceFormBody } from "../post-service-form";

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

// ── Fixtures ──────────────────────────────────────────────────────────

const services: WorkOrderServiceItem[] = [
  {
    id: "svc-1",
    service_name: "Oil Change",
    service_catalog_id: "cat-1",
    catalog_interval_months: 6,
    catalog_interval_km: 10000,
  },
  {
    id: "svc-2",
    service_name: "Brake Inspection",
    service_catalog_id: null,
    catalog_interval_months: null,
    catalog_interval_km: null,
  },
];

const parts = [
  {
    id: "p-1",
    part_name: "Oil Filter",
    part_number: "OF-1",
    quantity: 2,
    unit_price: 15000,
    final_price: 30000,
  },
];

const fees = { cash: 0, card: 1, bank_transfer: 0, manual: 0 };

function baseProps() {
  return {
    woId: "wo-1",
    vehicleId: "veh-1",
    vehiclePlate: "1111ABC",
    currentOdometer: 50000,
    services,
    parts,
    newStatus: "In Progress",
    grandTotal: 100000,
    paymentMethodFees: fees,
    transferBanks: [] as never[],
    onConfirm: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    onBack: vi.fn(),
  };
}

describe("PostServiceFormBody", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders plate, services, parts and totals", () => {
    const props = baseProps();
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    expect(screen.getByText("1111ABC")).toBeInTheDocument();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("Brake Inspection")).toBeInTheDocument();
    expect(screen.getByText("Oil Filter")).toBeInTheDocument();
    expect(screen.getByText("2 x ₮ 15,000")).toBeInTheDocument();
    expect(screen.getByText("₮ 30,000")).toBeInTheDocument();
    // Odometer prefilled from currentOdometer
    expect(screen.getByDisplayValue("50000")).toBeInTheDocument();
    // PaymentMethodField subtotal + total (no fee for default bank_transfer)
    expect(screen.getAllByText("₮ 100,000").length).toBeGreaterThan(0);
  });

  it("submits the mapped payload with parsed odometer and recommendations", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    const odometerInput = screen.getByDisplayValue("50000");
    await user.click(odometerInput);
    await user.clear(odometerInput);
    await user.type(odometerInput, "52000");
    await user.type(
      screen.getByPlaceholderText("notePlaceholder"),
      "Oil changed",
    );

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith({
        odometerReading: 52000,
        recommendations: [
          {
            workOrderServiceId: "svc-1",
            serviceName: "Oil Change",
            serviceCatalogId: "cat-1",
            intervalMonths: 6,
            intervalKm: 10000,
            priority: "standard",
            notes: undefined,
          },
          {
            workOrderServiceId: "svc-2",
            serviceName: "Brake Inspection",
            serviceCatalogId: null,
            intervalMonths: null,
            intervalKm: null,
            priority: "standard",
            notes: undefined,
          },
        ],
        mechanicNotes: "Oil changed",
        paymentMethod: "bank_transfer",
        transferBankId: null,
      }),
    );
  });

  it("switches payment method to card and submits with it", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    await user.click(screen.getByRole("button", { name: /^card/ }));
    // 1% fee on ₮100,000
    expect(screen.getByText("(+1%)")).toBeInTheDocument();
    expect(screen.getByText("₮ 101,000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: "card",
          odometerReading: 50000,
        }),
      ),
    );
  });

  it("updates service priority and notes and includes them in the payload", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    // Type notes into the first service card
    const notesInput = screen.getAllByLabelText("notesLabel")[0];
    await user.type(notesInput, "Use synthetic oil");

    // Change priority via the radix select
    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(
      await screen.findByRole("option", {
        name: "postServicePriorityImportant",
      }),
    );

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() => {
      const payload = props.onConfirm.mock.calls[0][0];
      expect(payload.recommendations[0]).toEqual(
        expect.objectContaining({
          workOrderServiceId: "svc-1",
          priority: "important",
          notes: "Use synthetic oil",
        }),
      );
      expect(payload.recommendations[1].priority).toBe("standard");
    });
  });

  it("collapses and expands all service cards", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    const notesInput = screen.getAllByLabelText("notesLabel")[0];
    expect(notesInput).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /collapseToggle/ }));
    expect(screen.queryByLabelText("notesLabel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expandToggle/ }));
    expect(screen.queryAllByLabelText("notesLabel").length).toBe(2);
  });

  it("calls onBack when cancel is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    await user.click(screen.getByRole("button", { name: /cancel/ }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("shows saving state while onConfirm is pending", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    let resolveConfirm: (value: unknown) => void = () => {};
    props.onConfirm.mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    const savingButton = await screen.findByRole("button", {
      name: /postServiceSaving/,
    });
    expect(savingButton).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/ })).toBeDisabled();

    resolveConfirm(undefined);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /markReady/ })).toBeEnabled(),
    );
  });

  it("shows an error banner when onConfirm rejects", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    props.onConfirm.mockRejectedValue(new Error("backend down"));
    render(<PostServiceFormBody {...props} onBack={props.onBack} />);

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    expect(await screen.findByText("backend down")).toBeInTheDocument();
    expect(reportServerErrorMock).toHaveBeenCalled();
  });
});

describe("PostServiceForm (dialog wrapper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the drawer title with plate and cancels via button", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceForm {...props} />);

    expect(screen.getByText("postServiceTitle")).toBeInTheDocument();
    expect(screen.getByText("1111ABC")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/ }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels on Escape key", async () => {
    const props = baseProps();
    render(<PostServiceForm {...props} />);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("submits from the footer button", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceForm {...props} />);

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          odometerReading: 50000,
          paymentMethod: "bank_transfer",
        }),
      ),
    );
  });

  it("renders complete title and hides payment fields when newStatus is Completed", () => {
    const props = baseProps();
    props.newStatus = "Completed";
    render(<PostServiceForm {...props} />);

    expect(screen.getByText("postServiceCompleteTitle")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("paymentMethod")).not.toBeInTheDocument();
  });
});
