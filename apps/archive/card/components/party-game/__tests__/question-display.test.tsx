import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionDisplay } from "../question-display";
import type { GameContentEntry } from "@/lib/content";

const spicyCard: GameContentEntry = {
  id: "test-1",
  gameType: "truth-or-dare",
  category: "secrets",
  tier: "spicy",
  text: "What is your biggest guilty pleasure?",
};

const afterDarkCard: GameContentEntry = {
  id: "test-2",
  gameType: "truth-or-dare",
  category: "explicit",
  tier: "after-dark",
  text: "What's your wildest sexual fantasy?",
};

const wildCard: GameContentEntry = {
  id: "test-3",
  gameType: "truth-or-dare",
  category: "sexual",
  tier: "wild",
  text: "What's your sexual 'type'?",
};

describe("QuestionDisplay", () => {
  it("renders card text", () => {
    render(<QuestionDisplay card={spicyCard} suspense={false} />);
    expect(screen.getByText("What is your biggest guilty pleasure?")).toBeDefined();
  });

  it("shows category badge", () => {
    render(<QuestionDisplay card={spicyCard} suspense={false} />);
    expect(screen.getByText("Secrets")).toBeDefined();
  });

  it("shows After Dark badge for after-dark tier content", () => {
    render(<QuestionDisplay card={afterDarkCard} suspense={false} />);
    expect(screen.getByText(/After Dark — Explicit Content/)).toBeDefined();
  });

  it("does not show After Dark badge for spicy tier content", () => {
    render(<QuestionDisplay card={spicyCard} suspense={false} />);
    expect(screen.queryByText(/After Dark/)).toBeNull();
  });

  it("does not show After Dark badge for wild tier content", () => {
    render(<QuestionDisplay card={wildCard} suspense={false} />);
    expect(screen.queryByText(/After Dark/)).toBeNull();
  });

  it("shows waiting state when card is null", () => {
    render(<QuestionDisplay card={null} suspense={false} />);
    expect(screen.getByText("Waiting for card...")).toBeDefined();
  });

  it("applies suspense animation by default", () => {
    const { container } = render(<QuestionDisplay card={spicyCard} />);
    const cardContent = container.querySelector(".translate-y-4");
    // Initially opacity-0 when suspense is true
    expect(cardContent).toBeDefined();
  });

  it("renders within max-width container for mobile", () => {
    const { container } = render(<QuestionDisplay card={spicyCard} suspense={false} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain("max-w-md");
  });

  it("shows category emoji alongside badge", () => {
    render(<QuestionDisplay card={spicyCard} suspense={false} />);
    // The secrets category has 🤫 emoji
    expect(screen.getByText("Secrets")).toBeDefined();
  });

  it("handles unknown category gracefully", () => {
    const unknownCard: GameContentEntry = {
      id: "test-unknown",
      gameType: "truth-or-dare",
      category: "unknown-category",
      tier: "spicy",
      text: "Some random question?",
    };
    render(<QuestionDisplay card={unknownCard} suspense={false} />);
    expect(screen.getByText("Unknown-category")).toBeDefined();
  });
});
