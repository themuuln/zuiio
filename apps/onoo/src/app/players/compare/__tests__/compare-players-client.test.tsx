/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock next/dynamic — return a simple placeholder
vi.mock("next/dynamic", () => ({
  default: vi.fn(() => {
    const DynamicComp = (_props: Record<string, unknown>) => (
      <div data-testid="dynamic-component" />
    );
    DynamicComp.displayName = "DynamicComponent";
    return DynamicComp;
  }),
}));

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className, ...rest }: { className?: string }) => (
    <span data-testid="icon" className={className} {...rest} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = Icon;
  }
  return mocked;
});

// Mock PlayerAvatar
vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name, size }: { name: string; size?: string }) => (
    <span data-testid="player-avatar" data-size={size}>
      {name}
    </span>
  ),
}));

// Mock TeamLogo
vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: Record<string, unknown>) => (
    <span data-testid="badge" {...props}>
      {children as React.ReactNode}
    </span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="card" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  CardAction: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-action">{children as React.ReactNode}</div>
  ),
  CardContent: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-content">{children as React.ReactNode}</div>
  ),
  CardDescription: ({ children }: Record<string, unknown>) => (
    <p data-testid="card-description">{children as React.ReactNode}</p>
  ),
  CardHeader: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-header">{children as React.ReactNode}</div>
  ),
  CardTitle: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-title">{children as React.ReactNode}</div>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => (
    <input data-testid="input" {...props} />
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className, ...props }: Record<string, unknown>) => (
    <div data-testid="skeleton" className={className as string} {...props} />
  ),
}));

// Mock CompareBars
vi.mock("../components/compare-bars", () => ({
  CompareBars: ({
    leftName,
    rightName,
  }: {
    leftName: string;
    rightName: string;
  }) => (
    <div data-testid="compare-bars">
      <span data-testid="bars-left">{leftName}</span>
      <span data-testid="bars-right">{rightName}</span>
    </div>
  ),
}));

// Mock PublicEmptyState
vi.mock("@/app/components/public-empty-state", () => ({
  PublicEmptyState: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div data-testid="public-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));
const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
}));

import type { PlayerDirectoryRow } from "@/app/lib/data";
import { ComparePlayersClient } from "../compare-players-client";

function makePlayer(
  overrides: Partial<PlayerDirectoryRow> = {},
): PlayerDirectoryRow {
  return {
    player_id: overrides.player_id ?? "player-1",
    player_name: overrides.player_name ?? "Баатар",
    player_name_latin: overrides.player_name_latin ?? "Baatar",
    photo_url: overrides.photo_url ?? null,
    team_id: overrides.team_id ?? "team-1",
    team_slug: overrides.team_slug ?? "khasuud",
    team_name: overrides.team_name ?? "Хасууд",
    team_short_code: overrides.team_short_code ?? "ХАС",
    team_primary_color: overrides.team_primary_color ?? "#e63946",
    team_logo_url: overrides.team_logo_url ?? null,
  };
}

function makePlayers(): PlayerDirectoryRow[] {
  return [
    makePlayer({
      player_id: "player-1",
      player_name: "Баатар",
      team_name: "Хасууд",
      team_short_code: "ХАС",
    }),
    makePlayer({
      player_id: "player-2",
      player_name: "Мөнхбат",
      team_name: "Арслангууд",
      team_short_code: "АРС",
    }),
    makePlayer({
      player_id: "player-3",
      player_name: "Болд",
      team_name: "Талхчин",
      team_short_code: "ТАЛ",
    }),
  ];
}

describe("ComparePlayersClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("renders player selection section", () => {
    const players = makePlayers();
    render(<ComparePlayersClient players={players} />);
    expect(screen.getByText("Хоёр тоглогч сонгох")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<ComparePlayersClient players={makePlayers()} />);
    expect(
      screen.getByText(/Нэр бичиж жагсаалтаас сонгоно/),
    ).toBeInTheDocument();
  });

  it("renders two input fields for player selection", () => {
    render(<ComparePlayersClient players={makePlayers()} />);
    const inputs = screen.getAllByTestId("input");
    expect(inputs).toHaveLength(2);
  });

  it("shows empty state when no players selected", () => {
    render(<ComparePlayersClient players={makePlayers()} />);
    expect(screen.getByText("Хоёр өөр тоглогч сонгоно уу")).toBeInTheDocument();
  });

  it("shows swap button", () => {
    render(<ComparePlayersClient players={makePlayers()} />);
    const swapButton = screen.getByLabelText("Тоглогчдын байрыг солих");
    expect(swapButton).toBeInTheDocument();
    expect(swapButton).toBeDisabled();
  });

  it("swap button is enabled when both players selected", () => {
    render(
      <ComparePlayersClient
        players={makePlayers()}
        initialPlayerIds={["player-1", "player-2"]}
      />,
    );
    const swapButton = screen.getByLabelText("Тоглогчдын байрыг солих");
    expect(swapButton).toBeEnabled();
  });

  it("shows datalist options from players list", () => {
    render(<ComparePlayersClient players={makePlayers()} />);
    const datalist = document.getElementById("comparison-player-options");
    expect(datalist).toBeInTheDocument();
    expect(datalist?.childNodes).toHaveLength(3);
  });

  it("shows loading skeleton when query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(
      <ComparePlayersClient
        players={makePlayers()}
        initialPlayerIds={["player-1", "player-2"]}
      />,
    );
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows error state when query fails", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    });
    render(
      <ComparePlayersClient
        players={makePlayers()}
        initialPlayerIds={["player-1", "player-2"]}
      />,
    );
    expect(
      screen.getByText("Харьцуулалт гаргаж чадсангүй"),
    ).toBeInTheDocument();
  });

  it("shows comparison result when data returns", () => {
    const mockComparisonData = [
      {
        id: "player-1",
        name: "Баатар",
        nameLatin: "Baatar",
        photoUrl: null,
        position: "PG",
        team: {
          id: "team-1",
          name: "Хасууд",
          slug: "khasuud",
          shortCode: "ХАС",
          logoUrl: null,
          primaryColor: "#e63946",
        },
        competition: { id: "comp-1", name: "MBL", season: "2024-25" },
        stats: {
          gamesPlayed: 10,
          points: 25.5,
          rebounds: 8.2,
          assists: 6.1,
          steals: 2.3,
          blocks: 1.1,
          turnovers: 2.5,
          fieldGoalPercent: 52.3,
          threePointPercent: 38.1,
          freeThrowPercent: 85.0,
          assistTurnoverRatio: 2.44,
        },
      },
      {
        id: "player-2",
        name: "Мөнхбат",
        nameLatin: "Munkhbat",
        photoUrl: null,
        position: "SG",
        team: {
          id: "team-2",
          name: "Арслангууд",
          slug: "arslanuud",
          shortCode: "АРС",
          logoUrl: null,
          primaryColor: "#1d3557",
        },
        competition: { id: "comp-1", name: "MBL", season: "2024-25" },
        stats: {
          gamesPlayed: 10,
          points: 22.1,
          rebounds: 5.4,
          assists: 4.8,
          steals: 1.9,
          blocks: 0.5,
          turnovers: 2.1,
          fieldGoalPercent: 48.7,
          threePointPercent: 35.2,
          freeThrowPercent: 82.3,
          assistTurnoverRatio: 2.29,
        },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockComparisonData,
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <ComparePlayersClient
        players={makePlayers()}
        initialPlayerIds={["player-1", "player-2"]}
      />,
    );

    // "Үзүүлэлтийн тулаан" appears in both card and CompareBars
    expect(screen.getAllByText("Үзүүлэлтийн тулаан").length).toBeGreaterThan(0);
    expect(screen.getByTestId("compare-bars")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-component")).toBeInTheDocument();
  });

  it("renders season badge in result view", () => {
    const mockData = [
      {
        id: "player-1",
        name: "Баатар",
        nameLatin: "Baatar",
        photoUrl: null,
        position: "PG",
        team: {
          id: "team-1",
          name: "Хасууд",
          slug: "khasuud",
          shortCode: "ХАС",
          logoUrl: null,
          primaryColor: "#e63946",
        },
        competition: { id: "comp-1", name: "MBL", season: "2024-25" },
        stats: {
          gamesPlayed: 10,
          points: 25.5,
          rebounds: 8.2,
          assists: 6.1,
          steals: 2.3,
          blocks: 1.1,
          turnovers: 2.5,
          fieldGoalPercent: 52.3,
          threePointPercent: 38.1,
          freeThrowPercent: 85.0,
          assistTurnoverRatio: 2.44,
        },
      },
      {
        id: "player-2",
        name: "Мөнхбат",
        nameLatin: "Munkhbat",
        photoUrl: null,
        position: "SG",
        team: {
          id: "team-2",
          name: "Арслангууд",
          slug: "arslanuud",
          shortCode: "АРС",
          logoUrl: null,
          primaryColor: "#1d3557",
        },
        competition: { id: "comp-1", name: "MBL", season: "2024-25" },
        stats: {
          gamesPlayed: 10,
          points: 22.1,
          rebounds: 5.4,
          assists: 4.8,
          steals: 1.9,
          blocks: 0.5,
          turnovers: 2.1,
          fieldGoalPercent: 48.7,
          threePointPercent: 35.2,
          freeThrowPercent: 82.3,
          assistTurnoverRatio: 2.29,
        },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockData,
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <ComparePlayersClient
        players={makePlayers()}
        initialPlayerIds={["player-1", "player-2"]}
      />,
    );

    // Season badges
    const badges = screen.getAllByTestId("badge");
    expect(badges.length).toBeGreaterThan(0);
  });
});
