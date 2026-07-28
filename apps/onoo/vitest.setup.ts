import "@testing-library/jest-dom/vitest";

// Mock navigator.sendBeacon for ViewBeacon component tests
Object.defineProperty(navigator, "sendBeacon", {
  value: vi.fn().mockReturnValue(true),
  writable: true,
  configurable: true,
});

// Mock IntersectionObserver for ProductDetailClient sticky buy bar
if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "0px";
    readonly thresholds: ReadonlyArray<number> = [0];

    constructor(
      private callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}

    observe(_target: Element) {}
    unobserve(_target: Element) {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: MockIntersectionObserver,
    writable: true,
    configurable: true,
  });
}
