import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { RevealOverlay } from "../reveal-overlay";
import type { RevealResult } from "../reveal-overlay";

const mockResult: RevealResult = {
  counts: { agree: 3, disagree: 2 },
  breakdown: [
    {
      value: "agree",
      players: [
        { playerId: "p1", playerName: "Alice" },
        { playerId: "p2", playerName: "Bob" },
        { playerId: "p3", playerName: "Charlie" },
      ],
      count: 3,
    },
    {
      value: "disagree",
      players: [
        { playerId: "p4", playerName: "Diana" },
        { playerId: "p5", playerName: "Eve" },
      ],
      count: 2,
    },
  ],
  totalResponses: 5,
};

describe("RevealOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <RevealOverlay
        open={false}
        result={null}
        onComplete={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows countdown when open is true", () => {
    render(
      <RevealOverlay
        open={true}
        result={mockResult}
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("Ready...")).toBeDefined();
  });

  it("progresses through countdown steps", () => {
    render(
      <RevealOverlay
        open={true}
        result={mockResult}
        onComplete={vi.fn()}
      />
    );

    // Should start at 3
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("Ready...")).toBeDefined();

    // Advance by PARTY_GAME_REVEAL_DELAY_SECONDS / 3
    act(() => {
      vi.advanceTimersByTime(1000); // 3s / 3 = 1s per step
    });

    // Should be at 2 now
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("Steady...")).toBeDefined();
  });

  it("shows results after countdown completes", () => {
    render(
      <RevealOverlay
        open={true}
        result={mockResult}
        onComplete={vi.fn()}
      />
    );

    // Advance through all countdown steps
    act(() => {
      vi.advanceTimersByTime(1000); // 3 → 2
    });
    act(() => {
      vi.advanceTimersByTime(1000); // 2 → 1
    });
    act(() => {
      vi.advanceTimersByTime(1000); // 1 → results
    });

    // Should show results
    expect(screen.getByText("Results")).toBeDefined();
    expect(screen.getByText(/3\/5/)).toBeDefined();
    expect(screen.getByText(/2\/5/)).toBeDefined();
  });

  it("shows voter names in results", () => {
    render(
      <RevealOverlay
        open={true}
        result={mockResult}
        onComplete={vi.fn()}
      />
    );

    // Advance through all countdown steps
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
    expect(screen.getByText("Diana")).toBeDefined();
    expect(screen.getByText("Eve")).toBeDefined();
  });

  it("highlights current player with '(You)' label", () => {
    render(
      <RevealOverlay
        open={true}
        result={mockResult}
        currentPlayerId="p1"
        onComplete={vi.fn()}
      />
    );

    // Advance through all countdown steps
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Alice (You)")).toBeDefined();
  });

  it("calls onComplete when countdown finishes", () => {
    const onComplete = vi.fn();
    render(
      <RevealOverlay
        open={true}
        result={mockResult}
        onComplete={onComplete}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows 'no results' message when result is null after countdown", () => {
    render(
      <RevealOverlay
        open={true}
        result={null}
        onComplete={vi.fn()}
      />
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("No results to display.")).toBeDefined();
  });
});
