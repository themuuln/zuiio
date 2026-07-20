import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTableFilters } from "./use-table-filters";

// Mock nuqs — useTableFilters depends on useQueryState which needs a Next.js adapter
vi.mock("nuqs", () => {
  const mockState = vi.fn();
  const mockSetState = vi.fn();

  return {
    useQueryState: vi.fn((_key: string, options?: any) => {
      const defaultValue = options?.defaultValue ?? "";
      return [defaultValue, mockSetState];
    }),
    parseAsString: {
      withDefault: (def: string) => ({ defaultValue: def }),
    },
    parseAsInteger: {
      withDefault: (def: number) => ({ defaultValue: def }),
    },
  };
});

describe("useTableFilters", () => {
  it("returns default values", () => {
    const { result } = renderHook(() => useTableFilters());
    expect(result.current.search).toBe("");
    expect(result.current.page).toBe(1);
    expect(result.current.view).toBe("table");
    expect(result.current.activeCount).toBe(0);
  });

  it("returns provided defaults", () => {
    const { result } = renderHook(() =>
      useTableFilters(undefined, { search: "test", page: 2, view: "grid" }),
    );
    expect(result.current.search).toBe("test");
    expect(result.current.page).toBe(2);
    expect(result.current.view).toBe("grid");
  });

  it("resetAll resets to defaults", () => {
    const { result } = renderHook(() =>
      useTableFilters(undefined, { search: "default", view: "grid" }),
    );

    act(() => {
      result.current.resetAll();
    });

    // After resetAll, values should be back to defaults
    expect(result.current.search).toBe("default");
    expect(result.current.view).toBe("grid");
  });

  it("works with prefix", () => {
    const { result } = renderHook(() => useTableFilters("orders"));
    expect(result.current).toBeDefined();
    expect(result.current.search).toBe("");
  });
});
