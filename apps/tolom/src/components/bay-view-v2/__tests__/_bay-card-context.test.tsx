import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import type { BayCardContextValue } from "../_bay-card-context";
import { BayCardProvider, useBayCardContext } from "../_bay-card-context";

function makeValue(
  overrides: Partial<BayCardContextValue> = {},
): BayCardContextValue {
  return {
    woId: "wo-1",
    status: "In Progress",
    isPending: false,
    isKanbanMode: false,
    mechanics: [{ id: "m1", full_name: "Mechanic One" }],
    onStatusChange: vi.fn(),
    onOpenDetail: vi.fn(),
    ...overrides,
  };
}

function wrapper(value: BayCardContextValue) {
  return ({ children }: { children: React.ReactNode }) => (
    <BayCardProvider value={value}>{children}</BayCardProvider>
  );
}

describe("useBayCardContext", () => {
  it("throws when used outside BayCardProvider", () => {
    expect(() => {
      renderHook(() => useBayCardContext());
    }).toThrow("useBayCardContext must be used within BayCardProvider");
  });

  it("returns the provider value", () => {
    const value = makeValue({ isKanbanMode: true });
    const { result } = renderHook(() => useBayCardContext(), {
      wrapper: wrapper(value),
    });
    expect(result.current).toEqual(value);
  });

  it("exposes optional handlers when provided", () => {
    const onRemoveFromBay = vi.fn();
    const value = makeValue({
      onRemoveFromBay,
      onRemoveHelper: vi.fn(),
      onAssignMechanic: vi.fn(),
    });
    const { result } = renderHook(() => useBayCardContext(), {
      wrapper: wrapper(value),
    });

    act(() => {
      result.current.onRemoveFromBay?.("wo-1");
    });
    expect(onRemoveFromBay).toHaveBeenCalledWith("wo-1");
  });
});
