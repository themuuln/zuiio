import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBayCountMutation } from "../_use-bay-count-mutation";

describe("useBayCountMutation", () => {
  it("initializes input value from the current bay count", () => {
    const { result } = renderHook(() =>
      useBayCountMutation({
        currentBayCount: 10,
        onApply: vi.fn(),
        onRefetch: vi.fn(),
      }),
    );
    expect(result.current.inputValue).toBe(10);
    expect(result.current.pending).toBe(false);
  });

  it("syncs the input when currentBayCount changes", () => {
    const onApply = vi.fn();
    const { result, rerender } = renderHook(
      ({ currentBayCount }) =>
        useBayCountMutation({ currentBayCount, onApply, onRefetch: vi.fn() }),
      { initialProps: { currentBayCount: 10 } },
    );

    rerender({ currentBayCount: 8 });
    expect(result.current.inputValue).toBe(8);
  });

  it("does nothing when applying the current bay count", async () => {
    const onApply = vi.fn();
    const onRefetch = vi.fn();
    const { result } = renderHook(() =>
      useBayCountMutation({ currentBayCount: 10, onApply, onRefetch }),
    );

    await act(async () => {
      await result.current.apply(10);
    });

    expect(onApply).not.toHaveBeenCalled();
    expect(onRefetch).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
  });

  it("applies the new count then refetches, toggling pending around the call", async () => {
    let resolveApply: () => void = () => {};
    const onApply = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveApply = resolve;
        }),
    );
    const onRefetch = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBayCountMutation({ currentBayCount: 10, onApply, onRefetch }),
    );

    let applyPromise: Promise<void>;
    act(() => {
      applyPromise = result.current.apply(12);
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      resolveApply();
      await applyPromise;
    });

    expect(onApply).toHaveBeenCalledWith(12);
    expect(onRefetch).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(false);
  });

  it("resets pending and propagates errors when onApply rejects", async () => {
    const onApply = vi.fn().mockRejectedValue(new Error("boom"));
    const onRefetch = vi.fn();
    const { result } = renderHook(() =>
      useBayCountMutation({ currentBayCount: 10, onApply, onRefetch }),
    );

    await act(async () => {
      await expect(result.current.apply(12)).rejects.toThrow("boom");
    });

    expect(onRefetch).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
    // The in-flight guard is released — a retry can proceed
    onApply.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.apply(12);
    });
    expect(onApply).toHaveBeenCalledTimes(2);
  });

  it("still resets pending when onRefetch rejects", async () => {
    const onApply = vi.fn().mockResolvedValue(undefined);
    const onRefetch = vi.fn().mockRejectedValue(new Error("refetch failed"));
    const { result } = renderHook(() =>
      useBayCountMutation({ currentBayCount: 10, onApply, onRefetch }),
    );

    await act(async () => {
      await expect(result.current.apply(12)).rejects.toThrow("refetch failed");
    });

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(false);
  });

  it("ignores concurrent apply calls while one is in flight", async () => {
    let resolveApply: () => void = () => {};
    const onApply = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveApply = resolve;
        }),
    );
    const onRefetch = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useBayCountMutation({ currentBayCount: 10, onApply, onRefetch }),
    );

    let first: Promise<void>;
    let second: Promise<void>;
    act(() => {
      first = result.current.apply(12);
      second = result.current.apply(14);
    });

    await act(async () => {
      resolveApply();
      await Promise.all([first, second]);
    });

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(12);
    expect(onRefetch).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(false);
  });

  it("exposes setInputValue for local editing", () => {
    const { result } = renderHook(() =>
      useBayCountMutation({
        currentBayCount: 10,
        onApply: vi.fn(),
        onRefetch: vi.fn(),
      }),
    );

    act(() => {
      result.current.setInputValue("12");
    });
    expect(result.current.inputValue).toBe("12");
  });
});
