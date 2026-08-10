import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ElapsedTimer } from "../elapsed-timer";

describe("ElapsedTimer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a dash when there is no start time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    render(<ElapsedTimer since={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    render(<ElapsedTimer since={undefined} />);
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("renders sub-minute elapsed time as <1m", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    render(<ElapsedTimer since="2026-08-09T11:59:30Z" />);
    expect(screen.getByText("<1m")).toBeInTheDocument();
  });

  it("renders minutes, hours and mixed hour/minute formats", () => {
    vi.useFakeTimers();
    const renderAt = (since: string) => {
      const now = new Date("2026-08-09T12:00:00Z");
      vi.setSystemTime(now);
      const view = render(<ElapsedTimer since={since} />);
      return view;
    };

    renderAt("2026-08-09T11:30:00Z");
    expect(screen.getByText("30m")).toBeInTheDocument();

    renderAt("2026-08-09T11:00:00Z");
    expect(screen.getByText("1h")).toBeInTheDocument();

    renderAt("2026-08-09T10:30:00Z");
    expect(screen.getByText("1h 30m")).toBeInTheDocument();

    // Exact hours drop the minutes part
    renderAt("2026-08-09T08:00:00Z");
    expect(screen.getByText("4h")).toBeInTheDocument();
  });

  it("re-computes on the 30s interval", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    render(<ElapsedTimer since="2026-08-09T10:30:00Z" />);
    expect(screen.getByText("1h 30m")).toBeInTheDocument();

    // Interval fires every 30s; the last tick inside the window lands at
    // 12:01:00 → 91 minutes elapsed.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("1h 31m")).toBeInTheDocument();
  });
});
