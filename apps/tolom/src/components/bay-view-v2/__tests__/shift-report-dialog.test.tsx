import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ShiftReportDialog } from "../shift-report-dialog";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

const mocks = vi.hoisted(() => {
  const getShiftReport = vi.fn();
  return { getShiftReport };
});

vi.mock("@/lib/services/bay-view-service.actions", () => ({
  getShiftReport: mocks.getShiftReport,
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const report = {
  completedToday: 5,
  revenueToday: 600000,
  avgDurationMinutes: 95,
  bayUtilization: 75,
  bayCount: 10,
  activeJobs: 4,
  revenuePerLaborHour: 20000,
};

describe("ShiftReportDialog", () => {
  it("does not load the report while closed", () => {
    render(<ShiftReportDialog open={false} onOpenChange={vi.fn()} />);
    expect(mocks.getShiftReport).not.toHaveBeenCalled();
  });

  it("shows a loading spinner while fetching", async () => {
    mocks.getShiftReport.mockReturnValue(new Promise(() => {}));
    render(<ShiftReportDialog open onOpenChange={vi.fn()} />);
    await act(async () => {});
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("renders the shift report metrics on success", async () => {
    mocks.getShiftReport.mockResolvedValue(report);
    render(<ShiftReportDialog open onOpenChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("5")).toBeTruthy());
    expect(screen.getByText("₮ 600,000")).toBeTruthy();
    expect(screen.getByText("1h 35m")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("renders the error state with a close action", async () => {
    mocks.getShiftReport.mockRejectedValue(new Error("boom"));
    const onOpenChange = vi.fn();
    render(<ShiftReportDialog open onOpenChange={onOpenChange} />);
    await waitFor(() => expect(screen.getByText("boom")).toBeTruthy());
    screen.getByRole("button", { name: "close" }).click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
