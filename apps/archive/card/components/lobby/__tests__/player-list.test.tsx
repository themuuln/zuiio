import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerList } from "../player-list";

const basePlayers = [
  {
    id: "host-1",
    display_name: "Alex",
    avatar_emoji: "🦊",
    is_host: true,
    is_spectator: false,
    joined_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "player-2",
    display_name: "Jordan",
    avatar_emoji: "🐼",
    is_host: false,
    is_spectator: false,
    joined_at: "2026-01-01T00:01:00Z",
  },
  {
    id: "player-3",
    display_name: "Sam",
    avatar_emoji: "🐨",
    is_host: false,
    is_spectator: false,
    joined_at: "2026-01-01T00:02:00Z",
  },
];

describe("PlayerList", () => {
  it("renders all non-spectator players with emoji avatars", () => {
    render(<PlayerList players={basePlayers} />);

    expect(screen.getByText("🦊")).toBeDefined();
    expect(screen.getByText("🐼")).toBeDefined();
    expect(screen.getByText("🐨")).toBeDefined();
  });

  it("renders display names for each player", () => {
    render(<PlayerList players={basePlayers} />);

    expect(screen.getByText("Alex")).toBeDefined();
    expect(screen.getByText("Jordan")).toBeDefined();
    expect(screen.getByText("Sam")).toBeDefined();
  });

  it("shows host badge for the host player", () => {
    render(<PlayerList players={basePlayers} />);

    // There should be exactly one host badge
    const hostBadges = screen.getAllByText("Host");
    expect(hostBadges.length).toBe(1);
  });

  it("does not show host badge for non-host players", () => {
    render(<PlayerList players={basePlayers} />);

    // Only Alex (host) should have the "You" tag when it's their ID
    expect(screen.getByText("Host")).toBeDefined();
  });

  it("shows 'You' tag for the current player", () => {
    render(<PlayerList players={basePlayers} currentPlayerId="player-2" />);

    expect(screen.getByText("You")).toBeDefined();
  });

  it("shows player count", () => {
    render(<PlayerList players={basePlayers} />);

    expect(screen.getByText("Players (3)")).toBeDefined();
  });

  it("shows waiting message when only host is present", () => {
    const onlyHost = [basePlayers[0]]; // Just the host
    render(<PlayerList players={onlyHost} />);

    expect(
      screen.getByText("Share the code above to invite friends")
    ).toBeDefined();
  });

  it("shows waiting placeholder when no players", () => {
    render(<PlayerList players={[]} />);

    expect(screen.getByText("Waiting for players...")).toBeDefined();
  });

  it("hides waiting message when 2+ players present", () => {
    render(<PlayerList players={basePlayers} />);

    expect(
      screen.queryByText("Share the code above to invite friends")
    ).toBeNull();
  });

  it("filters out spectator players", () => {
    const playersWithSpectator = [
      ...basePlayers,
      {
        id: "spectator-1",
        display_name: "Spectator",
        avatar_emoji: "👻",
        is_host: false,
        is_spectator: true,
        joined_at: "2026-01-01T00:03:00Z",
      },
    ];

    render(<PlayerList players={playersWithSpectator} />);

    // Spectator should not appear — only 3 players shown
    expect(screen.getByText("Players (3)")).toBeDefined();
    expect(screen.queryByText("Spectator")).toBeNull();
  });

  it("applies highlighted styling for current player", () => {
    const { container } = render(
      <PlayerList players={basePlayers} currentPlayerId="player-2" />
    );

    // The current player's row should have specific styling
    const playerRows = container.querySelectorAll(".border-primary\\/30");
    expect(playerRows.length).toBe(1);
  });

  it("shows correct player count with varying players", () => {
    const singlePlayer = [basePlayers[0]];
    const { rerender } = render(<PlayerList players={singlePlayer} />);
    expect(screen.getByText("Players (1)")).toBeDefined();

    rerender(<PlayerList players={basePlayers} />);
    expect(screen.getByText("Players (3)")).toBeDefined();
  });
});
