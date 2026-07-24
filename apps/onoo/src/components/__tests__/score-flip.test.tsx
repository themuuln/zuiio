/// <reference types="@testing-library/jest-dom/vitest" />
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScoreFlip } from "../score-flip";

// ---------------------------------------------------------------------------
// Environment mocks
// ---------------------------------------------------------------------------

beforeEach(() => {
  // jsdom does not implement window.matchMedia — provide a stub so the
  // component's effect doesn't throw when checking prefers-reduced-motion.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  // The component injects a <style> element on first render — clean it up
  // between tests so test isolation is preserved.
  const style = document.getElementById("score-flip-keyframes");
  if (style) style.remove();
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("ScoreFlip rendering", () => {
  it("renders single-digit value with 2-digit default padding", () => {
    const { container } = render(<ScoreFlip value={5} />);
    const digits = container.querySelectorAll(".score-flip-digit");
    expect(digits).toHaveLength(2);
    expect(digits[0]?.textContent).toBe("0");
    expect(digits[1]?.textContent).toBe("5");
  });

  it("renders with custom digit count", () => {
    const { container } = render(<ScoreFlip value={5} digits={3} />);
    const digits = container.querySelectorAll(".score-flip-digit");
    expect(digits).toHaveLength(3);
    expect(digits[0]?.textContent).toBe("0");
    expect(digits[1]?.textContent).toBe("0");
    expect(digits[2]?.textContent).toBe("5");
  });

  it("renders zero value", () => {
    const { container } = render(<ScoreFlip value={0} />);
    const digits = container.querySelectorAll(".score-flip-digit");
    expect(digits).toHaveLength(2);
    expect(digits[0]?.textContent).toBe("0");
    expect(digits[1]?.textContent).toBe("0");
  });

  it("renders double-digit value without extra padding", () => {
    const { container } = render(<ScoreFlip value={42} />);
    const digits = container.querySelectorAll(".score-flip-digit");
    expect(digits).toHaveLength(2);
    expect(digits[0]?.textContent).toBe("4");
    expect(digits[1]?.textContent).toBe("2");
  });

  it("renders value larger than digit count", () => {
    const { container } = render(<ScoreFlip value={100} digits={2} />);
    const digits = container.querySelectorAll(".score-flip-digit");
    expect(digits).toHaveLength(3);
    expect(digits[0]?.textContent).toBe("1");
    expect(digits[1]?.textContent).toBe("0");
    expect(digits[2]?.textContent).toBe("0");
  });

  it("renders negative value as zero-padded zero", () => {
    const { container } = render(<ScoreFlip value={-5} />);
    const digits = container.querySelectorAll(".score-flip-digit");
    expect(digits).toHaveLength(2);
    expect(digits[0]?.textContent).toBe("0");
    expect(digits[1]?.textContent).toBe("0");
  });

  it("applies className prop to the root element", () => {
    const { container } = render(
      <ScoreFlip value={42} className="custom-test-class" />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("custom-test-class");
  });

  it("sets accessible role and aria-label", () => {
    render(<ScoreFlip value={42} />);
    const el = screen.getByRole("status");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-label", "Score: 42");
  });
});

// ---------------------------------------------------------------------------
// Style injection
// ---------------------------------------------------------------------------

describe("ScoreFlip style injection", () => {
  it("injects animation keyframes into the document head", () => {
    render(<ScoreFlip value={42} />);
    const styleTag = document.getElementById("score-flip-keyframes");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain("score-flip-top");
    expect(styleTag?.textContent).toContain("score-flip-bottom");
  });

  it("does not duplicate the style element on rerender", () => {
    const { rerender } = render(<ScoreFlip value={1} />);
    rerender(<ScoreFlip value={2} />);
    const styles = document.querySelectorAll("#score-flip-keyframes");
    expect(styles).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Value change — animation lifecycle
// ---------------------------------------------------------------------------

describe("ScoreFlip value change", () => {
  it("updates displayed value after the animation timeout", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<ScoreFlip value={5} />);
    expect(container.querySelectorAll(".score-flip-digit")[1]?.textContent).toBe(
      "5",
    );

    // Trigger a value change — the effect sets up a 450 ms animation timer.
    rerender(<ScoreFlip value={8} />);

    // Fast-forward past the animation duration.
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // After the animation completes the display chars reflect the new value.
    expect(container.querySelectorAll(".score-flip-digit")[1]?.textContent).toBe(
      "8",
    );
    vi.useRealTimers();
  });
});
