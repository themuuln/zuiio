import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { BaySlotData } from "@/lib/services/bay-view-service.types";
import { render } from "@/test/test-utils";
import { Toolbar } from "../_toolbar";

const mocks = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
  reportServerError: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: mocks.reportServerError,
}));

const t = (key: string) => key;

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    viewMode: "grid" as const,
    setViewMode: vi.fn(),
    userIsMechanic: true,
    myJobsOnly: false,
    setMyJobsOnly: vi.fn(),
    fetchData: vi.fn().mockResolvedValue(undefined),
    baySearchQuery: "",
    setBaySearchQuery: vi.fn(),
    readyWosCount: 0,
    t,
    batchCompletePending: false,
    setBatchCompleteDialogOpen: vi.fn(),
    setShowVehicleReg: vi.fn(),
    setShowShiftReport: vi.fn(),
    bayCountMutationInFlightRef: { current: false },
    bayCountPending: false,
    bayCountInputValue: 4,
    setBayCountInputValue: vi.fn(),
    applyBayCountChange: vi.fn().mockResolvedValue(undefined),
    bayCount: 4,
    branches: [{ id: "b1", name: "Main" }],
    selectedBranchId: "all",
    onBranchChange: vi.fn(),
    statusFilter: null,
    setStatusFilter: vi.fn(),
    showQueueRail: false,
    onToggleQueue: vi.fn(),
    bays: [] as BaySlotData[],
    ...overrides,
  };
}

function renderToolbar(overrides: Record<string, unknown> = {}) {
  const props = makeProps(overrides);
  render(<Toolbar {...props} />);
  return props;
}

describe("Toolbar", () => {
  it("renders the primary row: search, view selector and my-jobs toggle", () => {
    renderToolbar();

    expect(
      screen.getByPlaceholderText("queueSearchPlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "gridView" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "kanbanView" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "listView" }),
    ).toBeInTheDocument();
    // myJobsOnly=false → the toggle reads allJobs
    expect(screen.getByRole("button", { name: "allJobs" })).toBeInTheDocument();
  });

  it("updates the search query and clears it with the X button", async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ baySearchQuery: "prius" });

    await user.type(
      screen.getByPlaceholderText("queueSearchPlaceholder"),
      "abc",
    );
    expect(props.setBaySearchQuery).toHaveBeenCalledWith(
      expect.stringContaining("prius"),
    );

    // The icon-only clear button lives next to the search input
    const clearButton = screen
      .getByPlaceholderText("queueSearchPlaceholder")
      .parentElement?.querySelector("button");
    if (!clearButton) throw new Error("clear search button not found");
    await user.click(clearButton);
    expect(props.setBaySearchQuery).toHaveBeenCalledWith("");
  });

  it("does not render the clear button when the query is empty", () => {
    renderToolbar();

    const clearButton = screen
      .getByPlaceholderText("queueSearchPlaceholder")
      .parentElement?.querySelector("button");
    expect(clearButton).toBeNull();
  });

  it("toggles my jobs only for mechanics", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "allJobs" }));
    expect(props.setMyJobsOnly).toHaveBeenCalledWith(true);
  });

  it("hides the my-jobs toggle for non-mechanics", () => {
    renderToolbar({ userIsMechanic: false });

    expect(
      screen.queryByRole("button", { name: "allJobs" }),
    ).not.toBeInTheDocument();
  });

  it("expands the secondary row and applies status filters", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Expand toolbar" }));
    // After expansion the chevron toggles to collapse
    await user.click(screen.getByRole("button", { name: "inProgress" }));

    expect(props.setStatusFilter).toHaveBeenCalledWith("In Progress");
  });

  it("refreshes data from the refresh button", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "refresh" }));

    expect(props.fetchData).toHaveBeenCalledTimes(1);
  });

  it("toggles the queue rail", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Queue" }));

    expect(props.onToggleQueue).toHaveBeenCalledTimes(1);
  });

  it("shows the batch-complete action only with 2+ ready work orders", async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ readyWosCount: 3 });

    await user.click(screen.getByRole("button", { name: "batchComplete" }));

    expect(props.setBatchCompleteDialogOpen).toHaveBeenCalledWith(true);
  });

  it("omits the batch-complete action for a single ready work order", () => {
    renderToolbar({ readyWosCount: 1 });

    expect(
      screen.queryByRole("button", { name: "batchComplete" }),
    ).not.toBeInTheDocument();
  });

  it("opens the vehicle registration and shift report dialogs", async () => {
    const user = userEvent.setup();
    const props = renderToolbar();

    await user.click(screen.getByRole("button", { name: "registerVehicle" }));
    await user.click(screen.getByRole("button", { name: "shiftReport" }));

    expect(props.setShowVehicleReg).toHaveBeenCalledWith(true);
    expect(props.setShowShiftReport).toHaveBeenCalledWith(true);
  });
});
