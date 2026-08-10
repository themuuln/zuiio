import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { ElapsedText, ElapsedTimer } from "../_elapsed-display";
import { BayViewTickProvider } from "../_tick-context";

// The tick provider computes Date.now() on mount and refreshes on a 30s
// interval; fake timers keep the clock (and interval) deterministic.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-09T10:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("ElapsedText", () => {
  it("renders an em dash without a startedAt", () => {
    render(<ElapsedText startedAt={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("renders an em dash when no tick provider is present", () => {
    render(<ElapsedText startedAt="2026-08-09T09:55:00Z" />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("formats elapsed minutes from the shared tick", async () => {
    render(
      <BayViewTickProvider>
        <ElapsedText startedAt="2026-08-09T09:55:00Z" />
      </BayViewTickProvider>,
    );
    await act(async () => {});
    expect(screen.getByText("5m")).toBeTruthy();
  });

  it("formats hours and minutes for long jobs", async () => {
    render(
      <BayViewTickProvider>
        <ElapsedText startedAt="2026-08-09T08:30:00Z" />
      </BayViewTickProvider>,
    );
    await act(async () => {});
    expect(screen.getByText("1h 30m")).toBeTruthy();
  });

  it("renders a sub-minute elapsed time as <1m", async () => {
    render(
      <BayViewTickProvider>
        <ElapsedText startedAt="2026-08-09T09:59:30Z" />
      </BayViewTickProvider>,
    );
    await act(async () => {});
    expect(screen.getByText("<1m")).toBeTruthy();
  });

  it("renders an em dash for future start times", async () => {
    render(
      <BayViewTickProvider>
        <ElapsedText startedAt="2026-08-09T10:30:00Z" />
      </BayViewTickProvider>,
    );
    await act(async () => {});
    expect(screen.getByText("—")).toBeTruthy();
  });
});

describe("ElapsedTimer", () => {
  it("renders nothing without a startedAt", () => {
    const { container } = render(
      <BayViewTickProvider>
        <ElapsedTimer startedAt={null} />
      </BayViewTickProvider>,
    );
    expect(container.querySelector("button")).toBeNull();
  });

  it("shows the elapsed time and pauses on click", async () => {
    render(
      <BayViewTickProvider>
        <ElapsedTimer startedAt="2026-08-09T09:57:00Z" />
      </BayViewTickProvider>,
    );
    await act(async () => {});
    const button = screen.getByRole("button");
    expect(button.textContent).toContain("3m");

    fireEvent.click(button);
    await act(async () => {});
    expect(button.textContent).toContain("paused");
  });

  it("switches to warning styling after two hours", async () => {
    render(
      <BayViewTickProvider>
        <ElapsedTimer startedAt="2026-08-09T07:50:00Z" />
      </BayViewTickProvider>,
    );
    await act(async () => {});
    const button = screen.getByRole("button");
    expect(button.textContent).toContain("2h 10m");
    expect(button.className).toContain("text-amber-500");
  });

  it("switches to critical styling after three hours", async () => {
    render(
      <BayViewTickProvider>
        <ElapsedTimer startedAt="2026-08-09T06:50:00Z" />
      </BayViewTickProvider>,
    );
    await act(async () => {});
    const button = screen.getByRole("button");
    expect(button.textContent).toContain("3h 10m");
    expect(button.className).toContain("text-destructive");
  });
});
