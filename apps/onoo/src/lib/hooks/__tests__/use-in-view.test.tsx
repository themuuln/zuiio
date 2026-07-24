import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// IntersectionObserver mock is needed for useInView
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();

class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: readonly number[] = [0];

  constructor(
    readonly callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}

  observe(el: Element) {
    observe(el);
  }
  unobserve(el: Element) {
    unobserve(el);
  }
  disconnect() {
    disconnect();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

describe("useInView", () => {
  it("returns false initially", async () => {
    const { useInView } = await import("@/lib/animations");
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInView(ref));
    expect(result.current).toBe(false);
    expect(observe).toHaveBeenCalledWith(ref.current);
  });

  it("returns false when ref is null", async () => {
    const { useInView } = await import("@/lib/animations");
    const ref = { current: null };
    const { result } = renderHook(() => useInView(ref));
    expect(result.current).toBe(false);
  });
});
