import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBayViewDialogs } from "../_use-bay-view-dialogs";

describe("useBayViewDialogs", () => {
  it("starts with all dialogs closed", () => {
    const { result } = renderHook(() => useBayViewDialogs());
    expect(result.current.open).toEqual({
      shiftReport: false,
      vehicleReg: false,
      batchComplete: false,
      assign: false,
    });
    expect(result.current.anyOpen).toBe(false);
    expect(result.current.assignBay).toBeNull();
    expect(result.current.detailWoId).toBeNull();
    expect(result.current.directAssignBayNumber).toBeNull();
  });

  it("show and hide toggle a dialog without touching the others", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.show("vehicleReg");
    });
    expect(result.current.open.vehicleReg).toBe(true);
    expect(result.current.open.shiftReport).toBe(false);
    expect(result.current.anyOpen).toBe(true);

    act(() => {
      result.current.hide("vehicleReg");
    });
    expect(result.current.open.vehicleReg).toBe(false);
    expect(result.current.anyOpen).toBe(false);
  });

  it("set writes an explicit value", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.set("batchComplete", true);
    });
    expect(result.current.open.batchComplete).toBe(true);

    act(() => {
      result.current.set("batchComplete", false);
    });
    expect(result.current.open.batchComplete).toBe(false);
  });

  it("openAssign stores the bay number and opens the assign dialog", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.openAssign(7);
    });
    expect(result.current.assignBay).toBe(7);
    expect(result.current.open.assign).toBe(true);
    expect(result.current.anyOpen).toBe(true);

    act(() => {
      result.current.closeAssign();
    });
    expect(result.current.assignBay).toBeNull();
    expect(result.current.open.assign).toBe(false);
  });

  it("openDetail stores the woId and optional initial action", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.openDetail("wo-9", "add-part");
    });
    expect(result.current.detailWoId).toBe("wo-9");
    expect(result.current.drawerInitialAction).toBe("add-part");
    expect(result.current.anyOpen).toBe(true);

    act(() => {
      result.current.openDetail("wo-9");
    });
    expect(result.current.drawerInitialAction).toBeNull();

    act(() => {
      result.current.closeDetail();
    });
    expect(result.current.detailWoId).toBeNull();
    expect(result.current.drawerInitialAction).toBeNull();
    expect(result.current.anyOpen).toBe(false);
  });

  it("direct assign bay number feeds anyOpen", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.setDirectAssignBayNumber(3);
    });
    expect(result.current.directAssignBayNumber).toBe(3);
    expect(result.current.anyOpen).toBe(true);

    act(() => {
      result.current.setDirectAssignBayNumber(null);
    });
    expect(result.current.anyOpen).toBe(false);
  });

  it("exposes direct setters for detail state", () => {
    const { result } = renderHook(() => useBayViewDialogs());

    act(() => {
      result.current.setDetailWoId("wo-4");
      result.current.setDrawerInitialAction("add-service");
    });
    expect(result.current.detailWoId).toBe("wo-4");
    expect(result.current.drawerInitialAction).toBe("add-service");
  });
});
