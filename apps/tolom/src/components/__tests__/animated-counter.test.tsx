import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedCounter } from "@/components/animated-counter";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  target: Element | null = null;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    this.target = target;
  }
  unobserve() {}
  disconnect() {}
  /** Simulate the observed element scrolling into view. */
  static triggerAll() {
    for (const instance of MockIntersectionObserver.instances) {
      if (instance.target) {
        instance.callback(
          [
            {
              isIntersecting: true,
              target: instance.target,
            } as IntersectionObserverEntry,
          ],
          instance as unknown as IntersectionObserver,
        );
      }
    }
  }
}

function makeMatchMedia(matches: boolean) {
  return vi.fn().mockReturnValue({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

describe("AnimatedCounter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    window.matchMedia = makeMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    MockIntersectionObserver.instances.length = 0;
  });

  it("renders the final value immediately (hydration-safe)", () => {
    const { container } = render(
      <AnimatedCounter end={1000} prefix="$" suffix="+" />,
    );
    expect(container.textContent).toBe("$1,000+");
  });

  it("formats decimals", () => {
    const { container } = render(<AnimatedCounter end={12.5} decimals={1} />);
    expect(container.textContent).toBe("12.5");
  });

  it("animates from 0 to the final value once the element is visible", async () => {
    const { container } = render(
      <AnimatedCounter end={1000} duration={1000} />,
    );
    expect(container.textContent).toBe("1,000");

    // Element scrolls into view: counter rewinds to 0 and animates
    await act(async () => {
      MockIntersectionObserver.triggerAll();
    });
    expect(container.textContent).toBe("0");

    // Run the rAF animation to completion
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(container.textContent).toBe("1,000");
  });

  it("skips the animation for users who prefer reduced motion", async () => {
    window.matchMedia = makeMatchMedia(true);
    const { container } = render(
      <AnimatedCounter end={1000} duration={1000} />,
    );
    expect(container.textContent).toBe("1,000");

    await act(async () => {
      MockIntersectionObserver.triggerAll();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(container.textContent).toBe("1,000");
  });
});
