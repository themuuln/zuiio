import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useInView } from "@/lib/animations";

// ---------------------------------------------------------------------------
// IntersectionObserver mock — captures callbacks so tests can simulate
// intersection / non-intersection entries.
// ---------------------------------------------------------------------------

const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();

/** Captured callback + observer from the latest constructed mock. */
let captureCallback: IntersectionObserverCallback = () => {};
let captureObserver: IntersectionObserver = null as unknown as IntersectionObserver;

class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: readonly number[] = [0];

  constructor(
    callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {
    captureCallback = callback;
    captureObserver = this;
  }

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

/** Fire an intersection entry for the current observer. */
function simulateIntersection(
  isIntersecting: boolean,
  el?: Element,
): void {
  captureCallback(
    [{ isIntersecting, target: el ?? document.createElement("div") } as IntersectionObserverEntry],
    captureObserver,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  observe.mockClear();
  unobserve.mockClear();
  disconnect.mockClear();
  captureCallback = () => {};
  captureObserver = null as unknown as IntersectionObserver;
});

describe("useInView", () => {
  it("returns false initially", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInView(ref));
    expect(result.current).toBe(false);
    expect(observe).toHaveBeenCalledWith(ref.current);
  });

  it("returns false when ref is null", () => {
    const ref = { current: null };
    const { result } = renderHook(() => useInView(ref));
    expect(result.current).toBe(false);
    expect(observe).not.toHaveBeenCalled();
  });

  it("sets inView to true when element enters viewport (once=true default)", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInView(ref));

    act(() => {
      simulateIntersection(true, ref.current);
    });
    expect(result.current).toBe(true);
  });

  it("returns to false when element leaves viewport (once=false)", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInView(ref, { once: false }));

    act(() => {
      simulateIntersection(true, ref.current);
    });
    expect(result.current).toBe(true);

    act(() => {
      simulateIntersection(false, ref.current);
    });
    expect(result.current).toBe(false);
  });

  it("stays true after leaving viewport when once=true", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInView(ref, { once: true }));

    act(() => {
      simulateIntersection(true, ref.current);
    });
    expect(result.current).toBe(true);

    act(() => {
      simulateIntersection(false, ref.current);
    });
    expect(result.current).toBe(true);
  });

  it("calls unobserve when once=true and element enters", () => {
    const ref = { current: document.createElement("div") };
    renderHook(() => useInView(ref, { once: true }));

    act(() => {
      simulateIntersection(true, ref.current);
    });
    expect(unobserve).toHaveBeenCalledWith(ref.current);
  });

  it("passes rootMargin to the observer", () => {
    let capturedOptions: IntersectionObserverInit | undefined;

    const OrigMock = vi.mocked(window.IntersectionObserver);
    vi.stubGlobal(
      "IntersectionObserver",
      class extends OrigMock {
        constructor(
          callback: IntersectionObserverCallback,
          options?: IntersectionObserverInit,
        ) {
          super(callback, options);
          capturedOptions = options;
        }
      },
    );

    const ref = { current: document.createElement("div") };
    renderHook(() => useInView(ref, { margin: "100px" }));

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions!.rootMargin).toBe("100px");

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("uses default rootMargin when no margin option provided", () => {
    let capturedOptions: IntersectionObserverInit | undefined;

    const OrigMock = vi.mocked(window.IntersectionObserver);
    vi.stubGlobal(
      "IntersectionObserver",
      class extends OrigMock {
        constructor(
          callback: IntersectionObserverCallback,
          options?: IntersectionObserverInit,
        ) {
          super(callback, options);
          capturedOptions = options;
        }
      },
    );

    const ref = { current: document.createElement("div") };
    renderHook(() => useInView(ref));

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions!.rootMargin).toBe("0px");

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("handles empty entries array gracefully", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInView(ref));

    act(() => {
      captureCallback([], captureObserver);
    });
    expect(result.current).toBe(false);
  });

  it("disconnects observer on unmount", () => {
    const ref = { current: document.createElement("div") };
    const { unmount } = renderHook(() => useInView(ref));

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("returns boolean type", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInView(ref));
    expect(typeof result.current).toBe("boolean");
  });
});
