import { describe, expect, it } from "vitest";

// Extract swipe logic for testing
const REVEAL_WIDTH = 140;
const THRESHOLD = 40;

function calculateSwipeOffset(startX: number, currentX: number): number {
  const diff = startX - currentX;
  return Math.min(Math.max(0, diff), REVEAL_WIDTH);
}

function shouldReveal(offset: number): boolean {
  return offset > THRESHOLD;
}

describe("SwipeableGameCard swipe logic", () => {
  it("calculates left swipe offset", () => {
    expect(calculateSwipeOffset(100, 60)).toBe(40);
  });

  it("limits to max reveal width", () => {
    expect(calculateSwipeOffset(200, 0)).toBe(REVEAL_WIDTH);
  });

  it("prevents right swipe (negative offset)", () => {
    expect(calculateSwipeOffset(50, 100)).toBe(0);
  });

  it("snaps to reveal when above threshold", () => {
    expect(shouldReveal(45)).toBe(true);
  });

  it("snaps back when below threshold", () => {
    expect(shouldReveal(30)).toBe(false);
  });

  it("snaps back at exactly threshold", () => {
    expect(shouldReveal(THRESHOLD)).toBe(false);
  });
});
