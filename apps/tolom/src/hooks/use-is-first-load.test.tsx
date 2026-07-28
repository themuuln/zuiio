import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIsFirstLoad } from "./use-is-first-load";

describe("useIsFirstLoad", () => {
  it("returns true on initial render", () => {
    const { result } = renderHook(() => useIsFirstLoad(false));

    // ref starts at false → !false = true
    expect(result.current).toBe(true);
  });

  it("returns false after isReady=true and effect fires", async () => {
    const { result, rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) => useIsFirstLoad(isReady),
      { initialProps: { isReady: false } },
    );

    // Initially true
    expect(result.current).toBe(true);

    // Rerender with isReady=true — effect fires after commit, sets ref to true
    await act(async () => {
      rerender({ isReady: true });
    });

    // Re-render to read the updated ref value
    rerender({ isReady: true });

    expect(result.current).toBe(false);
  });

  it("returns true while isReady is false", () => {
    const { result, rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) => useIsFirstLoad(isReady),
      { initialProps: { isReady: false } },
    );

    // Still true after first render
    expect(result.current).toBe(true);

    // Re-render with isReady still false — effect doesn't fire, ref stays false
    rerender({ isReady: false });

    // Still true
    expect(result.current).toBe(true);
  });
});
