import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { BayViewWalkthrough } from "../_walkthrough";

const mocks = vi.hoisted(() => {
  // Stable identity — the component's steps/positionTooltip memos depend on t
  const t = (key: string) => key;
  return { t };
});

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => mocks.t,
  };
});

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

describe("BayViewWalkthrough", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("appears after the start delay and shows the first step", async () => {
    render(<BayViewWalkthrough />);
    expect(screen.queryByText("walkthroughToolbarTitle")).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByText("walkthroughToolbarTitle")).toBeTruthy();
    expect(screen.getByText("walkthroughToolbarDesc")).toBeTruthy();
  });

  it("advances and goes back through the steps", async () => {
    render(<BayViewWalkthrough />);
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    const next = screen.getByRole("button", { name: "next" });
    act(() => next.click());
    expect(screen.getByText("walkthroughKpiTitle")).toBeTruthy();
    // Back is now enabled
    const back = screen.getByRole("button", { name: "back" });
    act(() => back.click());
    expect(screen.getByText("walkthroughToolbarTitle")).toBeTruthy();
  });

  it("completes the tour and records it as seen", async () => {
    render(<BayViewWalkthrough />);
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    const next = screen.getByRole("button", { name: "next" });
    act(() => next.click());
    act(() => next.click());
    act(() => next.click());
    // Last step shows the got-it button
    const gotIt = screen.getByRole("button", { name: "gotIt" });
    act(() => gotIt.click());
    expect(screen.queryByText("walkthroughBaysTitle")).toBeNull();
    expect(localStorage.getItem("tolom_bay_view_walkthrough_seen")).toBe(
      "true",
    );
  });

  it("skips the tour and records it as seen", async () => {
    render(<BayViewWalkthrough />);
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    act(() => screen.getByRole("button", { name: "skip" }).click());
    expect(screen.queryByText("walkthroughToolbarTitle")).toBeNull();
    expect(localStorage.getItem("tolom_bay_view_walkthrough_seen")).toBe(
      "true",
    );
  });

  it("does not show the tour to returning users", async () => {
    localStorage.setItem("tolom_bay_view_walkthrough_seen", "true");
    render(<BayViewWalkthrough />);
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.queryByText("walkthroughToolbarTitle")).toBeNull();
  });
});
