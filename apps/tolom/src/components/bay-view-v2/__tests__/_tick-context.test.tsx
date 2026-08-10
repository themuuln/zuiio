import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BayViewTickProvider, useBayViewTick } from "../_tick-context";

function wrapper({ children }: { children: React.ReactNode }) {
  return <BayViewTickProvider>{children}</BayViewTickProvider>;
}

describe("BayViewTickProvider / useBayViewTick", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null outside the provider", () => {
    const { result } = renderHook(() => useBayViewTick());
    expect(result.current).toBeNull();
  });

  it("sets a numeric tick once mounted", async () => {
    const { result } = renderHook(() => useBayViewTick(), { wrapper });

    await waitFor(() => {
      expect(result.current).toEqual(expect.any(Number));
    });
  });

  it("updates the tick every 30 seconds", async () => {
    const { result } = renderHook(() => useBayViewTick(), { wrapper });

    await waitFor(() => {
      expect(result.current).toEqual(expect.any(Number));
    });
    const first = result.current;

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current).toEqual(expect.any(Number));
    expect(result.current).not.toBe(first);
  });

  it("stops updating after unmount (interval cleared)", async () => {
    const { result, unmount } = renderHook(() => useBayViewTick(), { wrapper });

    await waitFor(() => {
      expect(result.current).toEqual(expect.any(Number));
    });
    const before = result.current;

    unmount();
    await act(async () => {
      vi.advanceTimersByTime(90_000);
    });
    expect(result.current).toBe(before);
  });

  it("shares a single tick across consumers", async () => {
    const { result: a } = renderHook(() => useBayViewTick(), { wrapper });
    const { result: b } = renderHook(() => useBayViewTick(), { wrapper });

    await waitFor(() => {
      expect(a.current).toEqual(expect.any(Number));
      expect(b.current).toEqual(expect.any(Number));
    });
    expect(a.current).toBe(b.current);
  });
});
