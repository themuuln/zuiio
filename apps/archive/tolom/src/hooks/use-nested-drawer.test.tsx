import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useNestedDrawer } from "./use-nested-drawer";

describe("useNestedDrawer", () => {
  it("initial state: childOpen is false", () => {
    const { result } = renderHook(() => useNestedDrawer(false));

    expect(result.current.childOpen).toBe(false);
  });

  it("openChild sets childOpen to true", () => {
    const { result } = renderHook(() => useNestedDrawer(true));

    act(() => {
      result.current.openChild();
    });

    expect(result.current.childOpen).toBe(true);
  });

  it("closeChild sets childOpen to false", () => {
    const { result } = renderHook(() => useNestedDrawer(true));

    act(() => {
      result.current.openChild();
    });

    expect(result.current.childOpen).toBe(true);

    act(() => {
      result.current.closeChild();
    });

    expect(result.current.childOpen).toBe(false);
  });

  it("parent closing resets childOpen to false", () => {
    const { result, rerender } = renderHook(
      ({ parentOpen }: { parentOpen: boolean }) => useNestedDrawer(parentOpen),
      { initialProps: { parentOpen: true } },
    );

    // Open the child
    act(() => {
      result.current.openChild();
    });

    expect(result.current.childOpen).toBe(true);

    // Close the parent — child should reset
    rerender({ parentOpen: false });

    expect(result.current.childOpen).toBe(false);
  });

  it("stays closed when parent was never open", () => {
    const { result, rerender } = renderHook(
      ({ parentOpen }: { parentOpen: boolean }) => useNestedDrawer(parentOpen),
      { initialProps: { parentOpen: false } },
    );

    // Initial state
    expect(result.current.childOpen).toBe(false);

    // Re-render with parent still closed
    rerender({ parentOpen: false });

    // Still closed — no accidental auto-open
    expect(result.current.childOpen).toBe(false);
  });
});
