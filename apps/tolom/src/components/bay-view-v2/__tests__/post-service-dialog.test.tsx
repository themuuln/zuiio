import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PostServiceDialog } from "../post-service-dialog";

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

const servicesMock = vi.hoisted(() => vi.fn());
const partsMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/post-service-service", () => ({
  getWorkOrderServicesWithIntervals: servicesMock,
  getWorkOrderParts: partsMock,
}));

const fees = { cash: 0, card: 1, bank_transfer: 0, manual: 0 };

/** Drawer content is transiently detached during Base UI's open animation —
 *  wait until the loaded content is stably connected before asserting. */
async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.getByText("Brake Check")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30000")).toBeInTheDocument();
  });
}

function baseProps() {
  return {
    open: true,
    onOpenChange: vi.fn(),
    woId: "wo-1",
    vehicleId: "veh-1",
    vehiclePlate: "2222XYZ",
    currentOdometer: 30000,
    bayData: {} as never,
    newStatus: "In Progress",
    grandTotal: 45000,
    paymentMethodFees: fees,
    transferBanks: [] as never[],
    onConfirm: vi.fn().mockResolvedValue(undefined),
  };
}

describe("PostServiceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    servicesMock.mockResolvedValue([
      {
        id: "svc-1",
        service_name: "Brake Check",
        service_catalog_id: null,
        catalog_interval_months: null,
        catalog_interval_km: null,
      },
    ]);
    partsMock.mockResolvedValue([
      {
        id: "p-1",
        part_name: "Brake Pad",
        part_number: null,
        quantity: 1,
        unit_price: 45000,
        final_price: 45000,
      },
    ]);
  });

  it("shows loading spinners then renders loaded content", async () => {
    const svc = [
      {
        id: "svc-1",
        service_name: "Brake Check",
        service_catalog_id: null,
        catalog_interval_months: null,
        catalog_interval_km: null,
      },
    ];
    const part = [
      {
        id: "p-1",
        part_name: "Brake Pad",
        part_number: null,
        quantity: 1,
        unit_price: 45000,
        final_price: 45000,
      },
    ];
    servicesMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(svc), 50)),
    );
    partsMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(part), 50)),
    );

    render(<PostServiceDialog {...baseProps()} />);

    // Loading spinners are visible before the mocks resolve
    expect(document.querySelectorAll(".animate-spin").length).toBeGreaterThan(
      0,
    );

    // Wait for the deferred mock promises to settle and the drawer content
    // to become connected
    await waitForLoaded();
  });
  it("renders services, parts, odometer and notes after loading", async () => {
    render(<PostServiceDialog {...baseProps()} />);

    await waitForLoaded();
    expect(screen.getByText("Brake Pad")).toBeInTheDocument();
    expect(screen.getAllByText("₮ 45,000").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText("notePlaceholder")).toBeInTheDocument();
  });

  it("submits the mapped payload when markReady is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceDialog {...props} />);

    await waitForLoaded();

    const odometerInput = screen.getByDisplayValue("30000");
    await user.click(odometerInput);
    await user.clear(odometerInput);
    await user.type(odometerInput, "32000");
    await user.type(screen.getByPlaceholderText("notePlaceholder"), "Done");

    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith({
        odometerReading: 32000,
        recommendations: [
          {
            workOrderServiceId: "svc-1",
            serviceName: "Brake Check",
            serviceCatalogId: null,
            intervalMonths: null,
            intervalKm: null,
            priority: "standard",
            notes: undefined,
          },
        ],
        mechanicNotes: "Done",
        paymentMethod: "bank_transfer",
        transferBankId: null,
      }),
    );
  });

  it("clears the saving state after a successful submit", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    const { promise, resolve: resolveConfirm } =
      Promise.withResolvers<unknown>();
    props.onConfirm.mockReturnValue(promise);
    render(<PostServiceDialog {...props} />);

    await waitForLoaded();
    await user.click(screen.getByRole("button", { name: /markReady/ }));

    expect(
      await screen.findByRole("button", { name: /postServiceSaving/ }),
    ).toBeDisabled();

    await act(async () => {
      resolveConfirm(undefined);
    });

    // Success path clears the saving state: the submit button re-enables
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /markReady/ })).toBeEnabled(),
    );
    expect(
      screen.queryByRole("button", { name: /postServiceSaving/ }),
    ).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PostServiceDialog {...props} />);

    await waitForLoaded();
    await user.click(screen.getByRole("button", { name: /cancel/ }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows an error banner when onConfirm rejects", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    props.onConfirm.mockRejectedValue(new Error("post failed"));
    render(<PostServiceDialog {...props} />);

    await waitForLoaded();
    await user.click(screen.getByRole("button", { name: /markReady/ }));

    await waitFor(() => {
      expect(screen.getByText("post failed")).toBeInTheDocument();
    });
    expect(reportServerErrorMock).toHaveBeenCalled();
  });

  it("shows a failure banner when services fail to load", async () => {
    servicesMock.mockRejectedValue(new Error("load failed"));
    render(<PostServiceDialog {...baseProps()} />);

    expect(await screen.findByText("failedToLoadServices")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const props = baseProps();
    props.open = false;
    render(<PostServiceDialog {...props} />);

    expect(
      document.querySelector('[data-slot="detail-drawer"]'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("postServiceTitle")).not.toBeInTheDocument();
  });
});
