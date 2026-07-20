import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDraftSave } from "./use-draft-save";

describe("useDraftSave", () => {
  const mockDeps = {
    selectedCustomerId: "cust-1",
    selectedVehicleId: "veh-1",
    complaint: "Engine noise",
    diagnosisLabelId: "label-1",
    description: "Check engine",
    selectedMechanicId: "mech-1",
    serviceLines: [{ serviceName: "Oil Change", quantity: 1, unitPrice: 30000 }],
    partLines: [{ partName: "Filter", quantity: 1, unitPrice: 5000 }],
  } as any;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null draftData initially", () => {
    const { result } = renderHook(() => useDraftSave("org-123", mockDeps));
    expect(result.current.draftData).toBeNull();
  });

  it("discardDraft removes draft from localStorage", () => {
    localStorage.setItem("wizard-draft-org-123", JSON.stringify({ savedAt: Date.now() }));

    const { result } = renderHook(() => useDraftSave("org-123", mockDeps));

    act(() => {
      result.current.discardDraft();
    });

    expect(localStorage.getItem("wizard-draft-org-123")).toBeNull();
    expect(result.current.draftData).toBeNull();
  });

  it("does nothing when orgId is undefined", () => {
    const { result } = renderHook(() => useDraftSave(undefined, mockDeps));
    expect(result.current.draftData).toBeNull();
  });
});
