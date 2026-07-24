import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBayViewDialogs } from "./_use-bay-view-dialogs";

describe("useBayViewDialogs", () => {
  it("starts with all dialogs closed and no extra state", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    // All dialog keys start closed
    expect(result.current.open.shiftReport).toBe(false);
    expect(result.current.open.vehicleReg).toBe(false);
    expect(result.current.open.batchComplete).toBe(false);
    expect(result.current.open.assign).toBe(false);

    // No bay/work order state
    expect(result.current.assignBay).toBeNull();
    expect(result.current.detailWoId).toBeNull();
    expect(result.current.directAssignBayNumber).toBeNull();
    expect(result.current.drawerInitialAction).toBeNull();

    // anyOpen should be false
    expect(result.current.anyOpen).toBe(false);
  });

  it("opens a dialog via set()", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.set("vehicleReg", true);
    });

    expect(result.current.open.vehicleReg).toBe(true);
    expect(result.current.anyOpen).toBe(true);
  });

  it("closes a dialog via set()", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.set("vehicleReg", true);
    });
    act(() => {
      result.current.set("vehicleReg", false);
    });

    expect(result.current.open.vehicleReg).toBe(false);
    expect(result.current.anyOpen).toBe(false);
  });

  it("opens and closes via show() and hide()", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.show("vehicleReg");
    });
    expect(result.current.open.vehicleReg).toBe(true);

    act(() => {
      result.current.hide("vehicleReg");
    });
    expect(result.current.open.vehicleReg).toBe(false);
  });

  it("sets directAssignBayNumber correctly", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    expect(result.current.directAssignBayNumber).toBeNull();

    act(() => {
      result.current.setDirectAssignBayNumber(5);
    });

    expect(result.current.directAssignBayNumber).toBe(5);
    // anyOpen should be true when directAssignBayNumber is set
    expect(result.current.anyOpen).toBe(true);

    act(() => {
      result.current.setDirectAssignBayNumber(null);
    });

    expect(result.current.directAssignBayNumber).toBeNull();
    expect(result.current.anyOpen).toBe(false);
  });

  it("anyOpen is true when any dialog or state is active", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    // Test with shiftReport
    act(() => result.current.set("shiftReport", true));
    expect(result.current.anyOpen).toBe(true);
    act(() => result.current.set("shiftReport", false));
    expect(result.current.anyOpen).toBe(false);

    // Test with assign
    act(() => result.current.openAssign(3));
    expect(result.current.anyOpen).toBe(true);
    act(() => result.current.closeAssign());
    expect(result.current.anyOpen).toBe(false);

    // Test with detailWoId
    act(() => result.current.openDetail("wo-1"));
    expect(result.current.anyOpen).toBe(true);
    act(() => result.current.closeDetail());
    expect(result.current.anyOpen).toBe(false);

    // Test with directAssignBayNumber
    act(() => result.current.setDirectAssignBayNumber(3));
    expect(result.current.anyOpen).toBe(true);
    act(() => result.current.setDirectAssignBayNumber(null));
    expect(result.current.anyOpen).toBe(false);
  });

  it("sets multiple independent states correctly", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.set("vehicleReg", true);
      result.current.setDirectAssignBayNumber(3);
    });

    expect(result.current.open.vehicleReg).toBe(true);
    expect(result.current.directAssignBayNumber).toBe(3);
    expect(result.current.anyOpen).toBe(true);

    // Close the dialog without affecting directAssignBayNumber
    act(() => {
      result.current.set("vehicleReg", false);
    });

    expect(result.current.open.vehicleReg).toBe(false);
    expect(result.current.directAssignBayNumber).toBe(3); // Still set
    expect(result.current.anyOpen).toBe(true); // Still true because directAssignBayNumber is set
  });

  it("does not have emptyBayBayNumber state (removed in refactor)", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    // Verify the removed state properties don't exist
    expect(
      (result.current as Record<string, unknown>).emptyBayBayNumber,
    ).toBeUndefined();
    expect(
      (result.current as Record<string, unknown>).setEmptyBayBayNumber,
    ).toBeUndefined();
    expect(
      (result.current as Record<string, unknown>).openEmptyBay,
    ).toBeUndefined();
    expect(
      (result.current as Record<string, unknown>).closeEmptyBay,
    ).toBeUndefined();
  });
});
