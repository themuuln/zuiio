/**
 * Tests for BranchProvider and useBranchContext.
 */
import { renderHook, act } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { BranchProvider, useBranchContext, type BranchOption } from "../branch-context";

// Mock localStorage for jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

beforeAll(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
});

const branches: BranchOption[] = [
  { id: "b1", name: "Салбар 1", slug: "salbar-1", is_default: true },
  { id: "b2", name: "Салбар 2", slug: "salbar-2", is_default: false },
  { id: "b3", name: "Салбар 3", slug: "salbar-3", is_default: false },
];

describe("BranchProvider", () => {
  it("provides branches and isBranchScoped=true for scoped user", () => {
    const { result } = renderHook(() => useBranchContext(), {
      wrapper: ({ children }) => (
        <BranchProvider branches={branches} userBranchId="b1">
          {children}
        </BranchProvider>
      ),
    });

    expect(result.current.branches).toEqual(branches);
    expect(result.current.isBranchScoped).toBe(true);
    expect(result.current.userBranchId).toBe("b1");
  });

  it("provides isBranchScoped=false for org-wide user", () => {
    const { result } = renderHook(() => useBranchContext(), {
      wrapper: ({ children }) => (
        <BranchProvider branches={branches} userBranchId={null}>
          {children}
        </BranchProvider>
      ),
    });

    expect(result.current.isBranchScoped).toBe(false);
    expect(result.current.userBranchId).toBeNull();
  });

  it("sets selectedBranchId on initial render for scoped user", () => {
    const { result } = renderHook(() => useBranchContext(), {
      wrapper: ({ children }) => (
        <BranchProvider branches={branches} userBranchId="b1">
          {children}
        </BranchProvider>
      ),
    });

    expect(result.current.selectedBranchId).toBe("b1");
  });

  it("org-wide user starts with null selectedBranchId", () => {
    const { result } = renderHook(() => useBranchContext(), {
      wrapper: ({ children }) => (
        <BranchProvider branches={branches} userBranchId={null}>
          {children}
        </BranchProvider>
      ),
    });

    expect(result.current.selectedBranchId).toBeNull();
  });

  it("setSelectedBranchId updates selection", () => {
    const { result } = renderHook(() => useBranchContext(), {
      wrapper: ({ children }) => (
        <BranchProvider branches={branches} userBranchId={null}>
          {children}
        </BranchProvider>
      ),
    });

    act(() => {
      result.current.setSelectedBranchId("b2");
    });

    expect(result.current.selectedBranchId).toBe("b2");
  });

  it("scoped user cannot change branch via setSelectedBranchId", () => {
    const { result } = renderHook(() => useBranchContext(), {
      wrapper: ({ children }) => (
        <BranchProvider branches={branches} userBranchId="b1">
          {children}
        </BranchProvider>
      ),
    });

    act(() => {
      result.current.setSelectedBranchId("b2");
    });

    expect(result.current.selectedBranchId).toBe("b1");
  });

  it("useBranchContext throws outside provider", () => {
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      renderHook(() => useBranchContext());
    }).toThrow();

    console.error = originalError;
  });
});
