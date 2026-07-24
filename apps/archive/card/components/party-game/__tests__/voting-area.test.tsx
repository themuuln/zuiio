import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VotingArea } from "../voting-area";
import type { PlayerInfo } from "../voting-area";

describe("VotingArea", () => {
  const mockPlayers: PlayerInfo[] = [
    { id: "p1", name: "Alice", emoji: "🦊" },
    { id: "p2", name: "Bob", emoji: "🐼" },
    { id: "p3", name: "Charlie", emoji: "🐨" },
  ];

  // ── Truth or Dare ──
  describe("truth-or-dare", () => {
    it("renders Truth and Dare buttons", () => {
      render(
        <VotingArea
          gameType="truth-or-dare"
          canVote={true}
          onSelect={vi.fn()}
        />
      );
      expect(screen.getByText("Truth")).toBeDefined();
      expect(screen.getByText("Dare")).toBeDefined();
    });

    it("calls onSelect with 'truth' when Truth is clicked", () => {
      const onSelect = vi.fn();
      render(
        <VotingArea
          gameType="truth-or-dare"
          canVote={true}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText("Truth"));
      expect(onSelect).toHaveBeenCalledWith("truth");
    });

    it("calls onSelect with 'dare' when Dare is clicked", () => {
      const onSelect = vi.fn();
      render(
        <VotingArea
          gameType="truth-or-dare"
          canVote={true}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText("Dare"));
      expect(onSelect).toHaveBeenCalledWith("dare");
    });

    it("disables buttons when canVote is false", () => {
      render(
        <VotingArea
          gameType="truth-or-dare"
          canVote={false}
          onSelect={vi.fn()}
        />
      );
      expect(screen.getByText("Waiting for your turn...")).toBeDefined();
      expect(screen.queryByText("Truth")).toBeNull();
    });

    it("disables buttons when disabled prop is true", () => {
      render(
        <VotingArea
          gameType="truth-or-dare"
          canVote={true}
          disabled={true}
          onSelect={vi.fn()}
        />
      );
      const truthButton = screen.getByText("Truth").closest("button");
      expect(truthButton?.disabled).toBe(true);
    });
  });

  // ── Never Have I Ever ──
  describe("never-have-i-ever", () => {
    it("renders I HAVE and I HAVEN'T buttons", () => {
      render(
        <VotingArea
          gameType="never-have-i-ever"
          canVote={true}
          onSelect={vi.fn()}
        />
      );
      expect(screen.getByText("I HAVE")).toBeDefined();
      expect(screen.getByText("I HAVEN'T")).toBeDefined();
    });

    it("calls onSelect with 'have' when I HAVE is clicked", () => {
      const onSelect = vi.fn();
      render(
        <VotingArea
          gameType="never-have-i-ever"
          canVote={true}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText("I HAVE"));
      expect(onSelect).toHaveBeenCalledWith("have");
    });

    it("calls onSelect with 'have-not' when I HAVEN'T is clicked", () => {
      const onSelect = vi.fn();
      render(
        <VotingArea
          gameType="never-have-i-ever"
          canVote={true}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText("I HAVEN'T"));
      expect(onSelect).toHaveBeenCalledWith("have-not");
    });
  });

  // ── Hot Takes ──
  describe("hot-takes", () => {
    it("renders Agree and Disagree buttons", () => {
      render(
        <VotingArea
          gameType="hot-takes"
          canVote={true}
          onSelect={vi.fn()}
        />
      );
      expect(screen.getByText("Agree")).toBeDefined();
      expect(screen.getByText("Disagree")).toBeDefined();
    });

    it("calls onSelect with 'agree' when Agree is clicked", () => {
      const onSelect = vi.fn();
      render(
        <VotingArea
          gameType="hot-takes"
          canVote={true}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText("Agree"));
      expect(onSelect).toHaveBeenCalledWith("agree");
    });

    it("calls onSelect with 'disagree' when Disagree is clicked", () => {
      const onSelect = vi.fn();
      render(
        <VotingArea
          gameType="hot-takes"
          canVote={true}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText("Disagree"));
      expect(onSelect).toHaveBeenCalledWith("disagree");
    });
  });

  // ── Most Likely To ──
  describe("most-likely-to", () => {
    it("renders player picker buttons", () => {
      render(
        <VotingArea
          gameType="most-likely-to"
          canVote={true}
          players={mockPlayers}
          onSelect={vi.fn()}
        />
      );
      expect(screen.getByText("Alice")).toBeDefined();
      expect(screen.getByText("Bob")).toBeDefined();
      expect(screen.getByText("Charlie")).toBeDefined();
    });

    it("calls onSelect with player ID when a player is clicked", () => {
      const onSelect = vi.fn();
      render(
        <VotingArea
          gameType="most-likely-to"
          canVote={true}
          players={mockPlayers}
          onSelect={onSelect}
        />
      );
      fireEvent.click(screen.getByText("Alice").closest("button")!);
      expect(onSelect).toHaveBeenCalledWith("p1");
    });

    it("shows no players available message when players array is empty", () => {
      render(
        <VotingArea
          gameType="most-likely-to"
          canVote={true}
          players={[]}
          onSelect={vi.fn()}
        />
      );
      expect(screen.getByText("No players available")).toBeDefined();
    });
  });

  // ── Touch targets ──
  it("has minimum touch target sizes (48x48px)", () => {
    render(
      <VotingArea
        gameType="truth-or-dare"
        canVote={true}
        onSelect={vi.fn()}
      />
    );
    const truthButton = screen.getByText("Truth").closest("button")!;
    const styles = getComputedStyle(truthButton);
    expect(truthButton.className).toContain("min-h-[48px]");
    expect(truthButton.className).toContain("min-w-[48px]");
  });
});
