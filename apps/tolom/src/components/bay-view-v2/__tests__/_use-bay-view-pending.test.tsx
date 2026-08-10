import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBayViewPending } from "../_use-bay-view-pending";

describe("useBayViewPending", () => {
  it("starts with no pending intercept", () => {
    const { result } = renderHook(() => useBayViewPending());
    expect(result.current.pending).toBeNull();
  });

  it("requests a status change with woId and status", () => {
    const { result } = renderHook(() => useBayViewPending());

    act(() => {
      result.current.requestStatusChange("wo-1", "Completed");
    });

    expect(result.current.pending).toEqual({
      type: "status",
      woId: "wo-1",
      status: "Completed",
    });
  });

  it("requests a post-service intercept with full vehicle data", () => {
    const { result } = renderHook(() => useBayViewPending());

    act(() => {
      result.current.requestPostService(
        "wo-1",
        "veh-1",
        "1234 ABC",
        45_000,
        "Ready for Pickup",
        150_000,
      );
    });

    expect(result.current.pending).toEqual({
      type: "postService",
      woId: "wo-1",
      vehicleId: "veh-1",
      vehiclePlate: "1234 ABC",
      currentOdometer: 45_000,
      newStatus: "Ready for Pickup",
      totalCost: 150_000,
    });
  });

  it("requests a pickup-complete intercept", () => {
    const { result } = renderHook(() => useBayViewPending());

    act(() => {
      result.current.requestPickupComplete(
        "wo-1",
        "veh-1",
        "1234 ABC",
        "Completed",
        90_000,
      );
    });

    expect(result.current.pending).toEqual({
      type: "pickupComplete",
      woId: "wo-1",
      vehicleId: "veh-1",
      vehiclePlate: "1234 ABC",
      newStatus: "Completed",
      totalCost: 90_000,
    });
  });

  it("handles null odometer in post-service requests", () => {
    const { result } = renderHook(() => useBayViewPending());

    act(() => {
      result.current.requestPostService(
        "wo-1",
        "veh-1",
        "1234 ABC",
        null,
        "Completed",
        0,
      );
    });

    expect(result.current.pending).toMatchObject({
      type: "postService",
      currentOdometer: null,
      totalCost: 0,
    });
  });

  it("replaces the previous intercept when a new one is requested", () => {
    const { result } = renderHook(() => useBayViewPending());

    act(() => {
      result.current.requestStatusChange("wo-1", "Diagnosing");
    });
    act(() => {
      result.current.requestStatusChange("wo-1", "In Progress");
    });

    expect(result.current.pending).toEqual({
      type: "status",
      woId: "wo-1",
      status: "In Progress",
    });
  });

  it("clears the pending intercept", () => {
    const { result } = renderHook(() => useBayViewPending());

    act(() => {
      result.current.requestStatusChange("wo-1", "Completed");
    });
    expect(result.current.pending).not.toBeNull();

    act(() => {
      result.current.clearPending();
    });
    expect(result.current.pending).toBeNull();
  });
});
