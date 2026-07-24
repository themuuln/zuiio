import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PartyLobby } from "../party-lobby";
import { AVAILABLE_GAMES } from "@/lib/games";

describe("PartyLobby", () => {
  const partyGames = AVAILABLE_GAMES.filter(
    (g) =>
      g.id === "truth-or-dare" ||
      g.id === "never-have-i-ever" ||
      g.id === "hot-takes" ||
      g.id === "most-likely-to"
  );

  it("shows header", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    expect(screen.getByText("Party Games")).toBeDefined();
  });

  it("shows all 4 party games", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    expect(screen.getByText("Truth or Dare")).toBeDefined();
    expect(screen.getByText("Never Have I Ever")).toBeDefined();
    expect(screen.getByText("Hot Takes")).toBeDefined();
    expect(screen.getByText("Most Likely To")).toBeDefined();
  });

  it("shows vibe tier display", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    expect(screen.getByText("Spicy")).toBeDefined();
  });

  it("shows drinking config section", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    expect(screen.getByText("Drinking Config")).toBeDefined();
    expect(screen.getByText("Drinking enabled")).toBeDefined();
  });

  it("calls onStartGame with game ID when a game is selected", () => {
    const onStartGame = vi.fn();
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={onStartGame}
      />
    );
    fireEvent.click(screen.getByText("Truth or Dare"));
    expect(onStartGame).toHaveBeenCalledWith(
      "truth-or-dare",
      expect.objectContaining({
        vibeTier: "spicy",
        drinkingEnabled: true,
        maxDrinksPerRound: 3,
      })
    );
  });

  it("shows player count", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    expect(screen.getByText(/4 player/)).toBeDefined();
  });

  it("shows empty state when no games available", () => {
    // Use games that require more players than we have
    render(
      <PartyLobby
        games={[]}
        playerCount={1}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    expect(
      screen.getByText(/No party games available/)
    ).toBeDefined();
  });

  it("shows dry mode label when drinking is disabled", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={false}
        drinkingEnabled={false}
        maxDrinksPerRound={0}
        onStartGame={vi.fn()}
      />
    );
    // Badge with "Dry mode" is shown when not host and drinking is disabled
    expect(screen.getByText("Dry mode")).toBeDefined();
  });

  it("allows host to see vibe tier buttons", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
        onChangeVibeTier={vi.fn()}
      />
    );
    // Should have 3 tier buttons for spicy, wild, after-dark
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(3);
  });

  it("does not show After Dark badge for spicy tier", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="spicy"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    expect(screen.queryByText(/After Dark/)).toBeNull();
  });

  it("shows After Dark indicator when vibe tier is after-dark", () => {
    render(
      <PartyLobby
        games={partyGames}
        playerCount={4}
        vibeTier="after-dark"
        isHost={true}
        drinkingEnabled={true}
        maxDrinksPerRound={3}
        onStartGame={vi.fn()}
      />
    );
    // Multiple elements match "After Dark" (label + footer), so use getAllByText
    const afterDarkElements = screen.getAllByText(/After Dark/);
    expect(afterDarkElements.length).toBeGreaterThanOrEqual(1);
  });
});
