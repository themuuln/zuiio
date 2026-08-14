import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNow } from "./use-client-now";

describe("useClientNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a Date", () => {
    const { result } = renderHook(() => useClientNow());
    expect(result.current).toBeInstanceOf(Date);
  });

  it("updates after an interval tick", () => {
    const base = new Date("2026-05-29T08:00:00Z");
    vi.setSystemTime(base);

    const { result } = renderHook(() => useClientNow());

    // Effect fires in renderHook, setting now to base.
    // Advance 1000ms triggers interval tick -> now = base + 1000
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.getTime()).toBe(base.getTime() + 1000);
  });

  it("continues to tick every second", () => {
    const base = new Date("2026-05-29T08:00:00Z");
    vi.setSystemTime(base);

    const { result } = renderHook(() => useClientNow());

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const firstTick = result.current.getTime();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const secondTick = result.current.getTime();

    expect(secondTick - firstTick).toBe(1000);
  });
});
