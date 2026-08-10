import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VirtualList } from "@/components/virtual-list";

const virtState = vi.hoisted(() => ({ height: 600 }));

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (options: {
    count: number;
    getScrollElement: () => HTMLElement | null;
    estimateSize: () => number;
    overscan: number;
  }) => {
    const scrollEl = options.getScrollElement();
    if (scrollEl) {
      Object.defineProperty(scrollEl, "clientHeight", {
        configurable: true,
        value: virtState.height,
      });
    }
    return {
      getVirtualItems: () => {
        const el = options.getScrollElement();
        const scrollTop = el?.scrollTop ?? 0;
        const size = options.estimateSize();
        const overscan = options.overscan;
        const from = Math.max(0, Math.floor(scrollTop / size) - overscan);
        const to = Math.min(
          options.count - 1,
          Math.floor((scrollTop + virtState.height) / size) + overscan,
        );
        const items: Array<{
          index: number;
          key: number;
          start: number;
          size: number;
          end: number;
        }> = [];
        for (let i = from; i <= to; i += 1) {
          items.push({
            index: i,
            key: i,
            start: i * size,
            size,
            end: (i + 1) * size,
          });
        }
        return items;
      },
      getTotalSize: () => options.count * options.estimateSize(),
    };
  },
}));

const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);

describe("VirtualList", () => {
  it("renders only the visible window of items", () => {
    const { container } = render(
      <VirtualList items={items}>{(item) => <div>{item}</div>}</VirtualList>,
    );
    expect(screen.getByText("Item 0")).toBeInTheDocument();
    expect(screen.getByText("Item 17")).toBeInTheDocument();
    expect(screen.queryByText("Item 99")).not.toBeInTheDocument();
    expect(container.querySelector('[role="list"]')).toHaveAttribute(
      "aria-rowcount",
      "100",
    );
  });

  it("renders the total size container for the scrollbar", () => {
    const { container } = render(
      <VirtualList items={items}>{(item) => <div>{item}</div>}</VirtualList>,
    );
    const spacer = container.querySelector(
      '[role="list"] > div',
    ) as HTMLElement;
    expect(spacer.style.height).toBe("4800px"); // 100 items x 48px
  });

  it("shifts the rendered window when the container scrolls", () => {
    const { container, rerender } = render(
      <VirtualList items={items}>{(item) => <div>{item}</div>}</VirtualList>,
    );
    expect(screen.getByText("Item 0")).toBeInTheDocument();

    const list = container.querySelector('[role="list"]') as HTMLElement;
    list.scrollTop = 2400;
    fireEvent.scroll(list);

    // Rerender forces getVirtualItems() to be recomputed from the new scrollTop
    rerender(
      <VirtualList items={items}>{(item) => <div>{item}</div>}</VirtualList>,
    );

    expect(screen.queryByText("Item 0")).not.toBeInTheDocument();
    expect(screen.getByText("Item 45")).toBeInTheDocument();
    expect(screen.getByText("Item 67")).toBeInTheDocument();
  });

  it("renders the empty state when there are no items", () => {
    render(
      <VirtualList items={[]} emptyState={<div>Nothing here</div>}>
        {(item) => <div>{item}</div>}
      </VirtualList>,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
