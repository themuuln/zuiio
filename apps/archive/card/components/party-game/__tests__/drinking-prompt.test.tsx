import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DrinkingPrompt } from "../drinking-prompt";

describe("DrinkingPrompt", () => {
  it("does not render when open is false", () => {
    const { container } = render(
      <DrinkingPrompt
        open={false}
        playerId="p1"
        playerName="Alice"
        action="sip"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows sip prompt with correct content", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(screen.getByText("Take a Sip")).toBeDefined();
    expect(screen.getByText(/Alice, take a sip!/)).toBeDefined();
  });

  it("shows shot prompt with correct content", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Bob"
        action="shot"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(screen.getByText("Take a Shot!")).toBeDefined();
    expect(screen.getByText(/Bob, take a shot!/)).toBeDefined();
  });

  it("shows group-shot prompt", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Charlie"
        action="group-shot"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(screen.getByText("Group Shot!")).toBeDefined();
    expect(screen.getByText(/Everyone take a shot!/)).toBeDefined();
  });

  it("shows waterfall prompt", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Diana"
        action="waterfall"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(screen.getByText("Waterfall!")).toBeDefined();
  });

  it("always includes pass option with exact text", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(
      screen.getByText("Skip / Always ok to pass — no pressure")
    ).toBeDefined();
  });

  it("calls onComplete when done button is clicked", () => {
    const onComplete = vi.fn();
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        onComplete={onComplete}
        onPass={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Done — took a sip"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows pass confirmation when pass is clicked", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    fireEvent.click(
      screen.getByText("Skip / Always ok to pass — no pressure")
    );
    expect(screen.getByText("Are you sure you want to skip?")).toBeDefined();
  });

  it("calls onPass when pass is confirmed", () => {
    const onPass = vi.fn();
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        onComplete={vi.fn()}
        onPass={onPass}
      />
    );
    // Click pass
    fireEvent.click(
      screen.getByText("Skip / Always ok to pass — no pressure")
    );
    // Confirm pass
    fireEvent.click(screen.getByText("Yes, skip"));
    expect(onPass).toHaveBeenCalledTimes(1);
  });

  it("shows penalty messaging in dry mode", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        drinkingDisabled={true}
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(screen.getByText("Penalty Point!")).toBeDefined();
    expect(
      screen.getByText(/Playing in dry mode/)
    ).toBeDefined();
  });

  it("shows completed state when completed is true", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        completed={true}
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    expect(screen.getByText("Drink recorded!")).toBeDefined();
  });

  it("has minimum touch target sizes on buttons", () => {
    render(
      <DrinkingPrompt
        open={true}
        playerId="p1"
        playerName="Alice"
        action="sip"
        onComplete={vi.fn()}
        onPass={vi.fn()}
      />
    );
    const doneButton = screen.getByText("Done — took a sip").closest("button")!;
    expect(doneButton.className).toContain("min-h-[48px]");
    expect(doneButton.className).toContain("min-w-[48px]");
  });
});
