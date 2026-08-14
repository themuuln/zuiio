import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { PickupCompleteForm } from "../pickup-complete-form";

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

// Fixed clock — avoids the 1s interval in useClientNow
vi.mock("@/hooks/use-client-now", () => ({
  useClientNow: () => new Date("2026-08-09T00:00:00Z"),
}));

const reportServerErrorMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: reportServerErrorMock,
}));

function baseProps() {
  return {
    vehiclePlate: "4444PQR",
    onConfirm: vi.fn().mockResolvedValue(undefined),
    onBack: vi.fn(),
  };
}

describe("PickupCompleteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title, plate and all optional sections", () => {
    const props = baseProps();
    render(<PickupCompleteForm {...props} />);

    expect(screen.getByText("pickupCompleteTitle")).toBeInTheDocument();
    expect(screen.getByText("4444PQR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 star" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 stars" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/pickupSummaryFeedback/),
    ).toBeInTheDocument();
  });

  it("submits with the selected star rating and feedback", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PickupCompleteForm {...props} />);

    await user.click(screen.getByRole("button", { name: "3 stars" }));
    await user.type(
      screen.getByPlaceholderText(/pickupSummaryFeedback/),
      "Great service",
    );

    await user.click(screen.getByRole("button", { name: /complete/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith({
        customerSatisfaction: 3,
        customerFeedback: "Great service",
        nextAppointmentDate: null,
      }),
    );
  });

  it("clears the rating when the clear button is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PickupCompleteForm {...props} />);

    await user.click(screen.getByRole("button", { name: "4 stars" }));
    await user.click(screen.getByRole("button", { name: /clearDate/ }));

    await user.click(screen.getByRole("button", { name: /complete/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ customerSatisfaction: null }),
      ),
    );
  });

  it("skips the review and submits empty optional values", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PickupCompleteForm {...props} />);

    await user.click(screen.getByRole("button", { name: /skipReview/ }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith({
        customerSatisfaction: null,
        customerFeedback: "",
        nextAppointmentDate: null,
      }),
    );
  });

  it("submits a selected appointment date from the date picker", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PickupCompleteForm {...props} />);

    await user.click(screen.getByRole("button", { name: /selectDate/ }));
    const tomorrowButton = (await screen.findAllByText("tomorrow"))[0];
    await user.click(tomorrowButton);

    await user.click(screen.getByRole("button", { name: /complete/ }));

    const expected = addDays(new Date(), 1).toISOString().split("T")[0];
    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ nextAppointmentDate: expected }),
      ),
    );
  });

  it("calls onBack when cancel is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<PickupCompleteForm {...props} />);

    await user.click(screen.getByRole("button", { name: /cancel/ }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("shows an error banner when onConfirm rejects", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    props.onConfirm.mockRejectedValue(new Error("complete failed"));
    render(<PickupCompleteForm {...props} />);

    await user.click(screen.getByRole("button", { name: /complete/ }));

    expect(await screen.findByText("complete failed")).toBeInTheDocument();
    expect(reportServerErrorMock).toHaveBeenCalled();
  });
});
