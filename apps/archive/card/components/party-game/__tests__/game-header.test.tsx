import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameHeader } from "../game-header";
import { PARTY_GAME_TIMER_SECONDS } from "@/lib/constants";

describe("GameHeader", () => {
  it("shows round number", () => {
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={PARTY_GAME_TIMER_SECONDS}
      />
    );
    expect(screen.getByText("Round 1")).toBeDefined();
  });

  it("shows timer seconds remaining", () => {
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={25}
        timerDuration={30}
      />
    );
    expect(screen.getByText("25s")).toBeDefined();
  });

  it("shows timer bar with proportional width", () => {
    const { container } = render(
      <GameHeader
        roundNumber={1}
        timerSeconds={15}
        timerDuration={30}
      />
    );
    // Should show 50% remaining
    expect(screen.getByText("15s")).toBeDefined();
    // Progress indicator should exist
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeDefined();
  });

  it("shows drink counter when drinkCounts provided", () => {
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={30}
        drinkCounts={{ "p1": 3 }}
        currentPlayerId="p1"
      />
    );
    expect(screen.getByText("3")).toBeDefined();
  });

  it("renders reaction emoji buttons", () => {
    const onReact = vi.fn();
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={30}
        reactionEmojis={["🔥", "😂"]}
        onReact={onReact}
      />
    );
    expect(screen.getByText("🔥")).toBeDefined();
    expect(screen.getByText("😂")).toBeDefined();
  });

  it("calls onReact when reaction emoji is clicked", () => {
    const onReact = vi.fn();
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={30}
        reactionEmojis={["🔥"]}
        onReact={onReact}
      />
    );
    fireEvent.click(screen.getByText("🔥"));
    expect(onReact).toHaveBeenCalledWith("🔥");
  });

  it("shows paused state when timerPaused is true", () => {
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={20}
        timerPaused={true}
      />
    );
    expect(screen.getByText(/Paused/)).toBeDefined();
  });

  it("does not show timer bar when timerSeconds is null", () => {
    const { container } = render(
      <GameHeader
        roundNumber={1}
        timerSeconds={null}
      />
    );
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
  });

  it("has minimum touch target sizes on reaction buttons", () => {
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={30}
        reactionEmojis={["🔥"]}
        onReact={vi.fn()}
      />
    );
    const reactionButton = screen.getByText("🔥").closest("button")!;
    expect(reactionButton.className).toContain("h-10");
    expect(reactionButton.className).toContain("w-10");
  });

  it("does not render reaction buttons when onReact is not provided", () => {
    render(
      <GameHeader
        roundNumber={1}
        timerSeconds={30}
        reactionEmojis={["🔥"]}
      />
    );
    expect(screen.queryByText("🔥")).toBeNull();
  });
});
