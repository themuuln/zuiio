import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import type { PickupCompleteData } from "../pickup-complete-dialog";
import { PickupCompleteDialog } from "../pickup-complete-dialog";

const tMock = vi.hoisted(() => ({
  t: (key: string) => key,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => tMock.t,
  };
});

vi.mock("@/components/ui/detail-drawer", () => ({
  DetailDrawer: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div data-testid="detail-drawer">{children}</div> : null,
    {
      Header: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-header">{children}</div>
      ),
      Title: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-title">{children}</div>
      ),
      Description: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-description">{children}</div>
      ),
      Body: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-body">{children}</div>
      ),
      Footer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer">{children}</div>
      ),
      FooterActions: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drawer-footer-actions">{children}</div>
      ),
    },
  ),
}));

vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-08-09T10:00:00"),
}));

vi.mock("@/components/ui/appointment-date-picker", () => ({
  AppointmentDatePicker: () => (
    <div data-testid="appointment-date-picker">date picker</div>
  ),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const onConfirm = vi.fn();
const onOpenChange = vi.fn();

function renderDialog(open = true) {
  return render(
    <PickupCompleteDialog
      open={open}
      onOpenChange={onOpenChange}
      woId="wo-1"
      vehiclePlate="ABC 1234"
      totalCost={250000}
      onConfirm={onConfirm}
    />,
  );
}

describe("PickupCompleteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onConfirm.mockResolvedValue(undefined);
  });

  it("renders nothing when closed", () => {
    renderDialog(false);
    expect(screen.queryByTestId("detail-drawer")).not.toBeInTheDocument();
  });

  it("renders the title with the vehicle plate when open", () => {
    renderDialog();
    expect(screen.getByText("pickupCompleteTitle")).toBeInTheDocument();
    expect(screen.getByText("ABC 1234")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "complete" }),
    ).toBeInTheDocument();
  });

  it("submits the rating and feedback payload on confirm", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "4 stars" }));
    await user.type(
      screen.getByPlaceholderText("pickupSummaryFeedback..."),
      "  Great service  ",
    );
    await user.click(screen.getByRole("button", { name: "complete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const payload: PickupCompleteData = onConfirm.mock.calls[0][0];
    expect(payload).toEqual({
      customerSatisfaction: 4,
      customerFeedback: "Great service",
      nextAppointmentDate: null,
    });
  });

  it("submits empty optional values via the skip-review button", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "skipReview" }));

    expect(onConfirm).toHaveBeenCalledWith({
      customerSatisfaction: null,
      customerFeedback: "",
      nextAppointmentDate: null,
    });
  });

  it("clears the rating when the clear button is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "5 stars" }));
    await user.click(screen.getByRole("button", { name: "clearDate" }));
    await user.click(screen.getByRole("button", { name: "skipReview" }));

    expect(onConfirm).toHaveBeenCalledWith({
      customerSatisfaction: null,
      customerFeedback: "",
      nextAppointmentDate: null,
    });
  });

  it("shows the error message when the confirmation fails", async () => {
    onConfirm.mockRejectedValue(new Error("Payment gateway down"));
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "skipReview" }));

    expect(await screen.findByText("Payment gateway down")).toBeInTheDocument();
  });

  it("closes via the cancel button", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
