import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVirtualList } from "./use-virtual-list";

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

// Import the mocked version (guaranteed by vi.mock hoisting)
import { useVirtualizer } from "@tanstack/react-virtual";

describe("useVirtualList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns correct shape with expected keys and types", () => {
    getVirtualItems.mockReturnValue([]);
    getTotalSize.mockReturnValue(0);

    const { result } = renderHook(() => useVirtualList({ items: ["x"] }));

    expect(result.current).toHaveProperty("parentRef");
    expect(result.current.parentRef).toHaveProperty("current", null);

    expect(result.current).toHaveProperty("virtualizer");
    expect(typeof result.current.totalSize).toBe("number");
    expect(Array.isArray(result.current.virtualItems)).toBe(true);
  });

  it("returns empty virtualItems and zero totalSize with empty items", () => {
    getVirtualItems.mockReturnValue([]);
    getTotalSize.mockReturnValue(0);

    const { result } = renderHook(() => useVirtualList({ items: [] }));

    expect(result.current.virtualItems).toEqual([]);
    expect(result.current.totalSize).toBe(0);
  });

  it("returns virtual items for a non-empty list", () => {
    const items = ["a", "b", "c"];
    const mockItems = items.map((_, i) => ({
      key: i,
      index: i,
      start: i * 48,
      end: (i + 1) * 48,
      size: 48,
      lane: 0,
    }));
    getVirtualItems.mockReturnValue(mockItems);
    getTotalSize.mockReturnValue(3 * 48);

    const { result } = renderHook(() => useVirtualList({ items }));

    expect(result.current.virtualItems).toHaveLength(3);
    expect(result.current.virtualItems[0].index).toBe(0);
    expect(result.current.virtualItems[1].index).toBe(1);
    expect(result.current.virtualItems[2].index).toBe(2);
    expect(result.current.totalSize).toBe(144);
  });

  it("passes custom estimatedItemHeight as the estimateSize return", () => {
    getVirtualItems.mockReturnValue([]);
    getTotalSize.mockReturnValue(0);

    renderHook(() =>
      useVirtualList({ items: ["item"], estimatedItemHeight: 72 }),
    );

    expect(useVirtualizer).toHaveBeenCalledTimes(1);
    const options = vi.mocked(useVirtualizer).mock.calls[0][0];
    expect(options.count).toBe(1);
    expect(options.estimateSize()).toBe(72);
    // Default overscan still applied
    expect(options.overscan).toBe(5);
  });

  it("preserves default estimatedItemHeight (48) when not provided", () => {
    getVirtualItems.mockReturnValue([]);
    getTotalSize.mockReturnValue(0);

    renderHook(() => useVirtualList({ items: ["item"] }));

    const options = vi.mocked(useVirtualizer).mock.calls[0][0];
    expect(options.estimateSize()).toBe(48);
  });

  it("accepts custom overscan value", () => {
    getVirtualItems.mockReturnValue([]);
    getTotalSize.mockReturnValue(0);

    renderHook(() => useVirtualList({ items: ["item"], overscan: 10 }));

    const options = vi.mocked(useVirtualizer).mock.calls[0][0];
    expect(options.overscan).toBe(10);
  });
});
