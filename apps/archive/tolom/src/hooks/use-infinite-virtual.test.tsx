import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock @tanstack/react-virtual so jsdom layout constraints don't matter
const getVirtualItems = vi.fn();
const getTotalSize = vi.fn();

const mockVirtualizer = {
  getVirtualItems,
  getTotalSize,
  scrollToIndex: vi.fn(),
  scrollToOffset: vi.fn(),
  scrollBy: vi.fn(),
  scrollToEnd: vi.fn(),
  measure: vi.fn(),
  setOptions: vi.fn(),
  containerRef: vi.fn(),
  getDistanceFromEnd: vi.fn(),
};

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi.fn(() => mockVirtualizer),
  useWindowVirtualizer: vi.fn(),
}));

import type { VirtualItem } from "@tanstack/react-virtual";
import { useInfiniteVirtual } from "./use-infinite-virtual";

describe("useInfiniteVirtual", () => {
  const defaultProps = {
    items: [] as string[],
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns correct shape with empty items", () => {
    getVirtualItems.mockReturnValue([]);
    getTotalSize.mockReturnValue(0);

    const { result } = renderHook(() => useInfiniteVirtual(defaultProps));

    expect(result.current).toHaveProperty("parentRef");
    expect(result.current.parentRef).toHaveProperty("current", null);
    expect(result.current).toHaveProperty("virtualItems");
    expect(Array.isArray(result.current.virtualItems)).toBe(true);
    expect(result.current.virtualItems).toEqual([]);
    expect(result.current.totalSize).toBe(0);
  });

  it("returns virtual items", () => {
    const items = ["a", "b", "c"];
    const mockItems = items.map((_, i) => ({
      key: i,
      index: i,
      start: i * 64,
      end: (i + 1) * 64,
      size: 64,
      lane: 0,
    }));
    getVirtualItems.mockReturnValue(mockItems);
    getTotalSize.mockReturnValue(3 * 64);

    const { result } = renderHook(() =>
      useInfiniteVirtual({ ...defaultProps, items }),
    );

    expect(result.current.virtualItems).toHaveLength(3);
    expect(result.current.virtualItems[0].index).toBe(0);
    expect(result.current.virtualItems[1].index).toBe(1);
    expect(result.current.virtualItems[2].index).toBe(2);
    expect(result.current.totalSize).toBe(192);
  });

  it("totalSize reflects virtualizer", () => {
    const items = ["a", "b"];
    getVirtualItems.mockReturnValue([
      { key: 0, index: 0, start: 0, end: 64, size: 64, lane: 0 },
      { key: 1, index: 1, start: 64, end: 128, size: 64, lane: 0 },
    ]);
    getTotalSize.mockReturnValue(500);

    const { result } = renderHook(() =>
      useInfiniteVirtual({ ...defaultProps, items }),
    );

    // totalSize comes from getTotalSize, not from computing item heights
    expect(result.current.totalSize).toBe(500);
    expect(getTotalSize).toHaveBeenCalled();
  });

  it("calls fetchNextPage when sentinel is visible + hasNextPage", () => {
    const fetchNextPage = vi.fn();
    // items.length = 2, so sentinel index = 2 (last virtual item)
    const sentinel: VirtualItem = {
      key: 2,
      index: 2,
      start: 128,
      end: 192,
      size: 64,
      lane: 0,
    };
    getVirtualItems.mockReturnValue([
      { key: 0, index: 0, start: 0, end: 64, size: 64, lane: 0 },
      { key: 1, index: 1, start: 64, end: 128, size: 64, lane: 0 },
      sentinel,
    ]);
    getTotalSize.mockReturnValue(192);

    renderHook(() =>
      useInfiniteVirtual({
        items: ["a", "b"],
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
      }),
    );

    // Sentinel index (2) >= items.length (2) => triggers fetch
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not call fetchNextPage when isFetchingNextPage is true", () => {
    const fetchNextPage = vi.fn();
    const sentinel: VirtualItem = {
      key: 2,
      index: 2,
      start: 128,
      end: 192,
      size: 64,
      lane: 0,
    };
    getVirtualItems.mockReturnValue([
      { key: 0, index: 0, start: 0, end: 64, size: 64, lane: 0 },
      { key: 1, index: 1, start: 64, end: 128, size: 64, lane: 0 },
      sentinel,
    ]);
    getTotalSize.mockReturnValue(192);

    renderHook(() =>
      useInfiniteVirtual({
        items: ["a", "b"],
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage,
      }),
    );

    // Even though sentinel is visible and hasNextPage is true,
    // isFetchingNextPage prevents the call
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
