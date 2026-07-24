/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
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

// Mock UI card components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="card" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  CardContent: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-content">{children as React.ReactNode}</div>
  ),
  CardHeader: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-header">{children as React.ReactNode}</div>
  ),
  CardTitle: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-title">{children as React.ReactNode}</div>
  ),
}));

// Mock Badge
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: Record<string, unknown>) => (
    <span data-testid="badge" {...props}>
      {children as React.ReactNode}
    </span>
  ),
}));

// Mock Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

import type { LeaderRow } from "@/app/lib/data";
import AwardsPage from "../page";

function makeLeader(overrides: Partial<LeaderRow> = {}): LeaderRow {
  return {
    player_id: `player-${overrides.player_name?.toLowerCase() ?? "default"}`,
    player_name: overrides.player_name ?? "Баатар",
    player_name_latin: overrides.player_name_latin ?? "Baatar",
    photo_url: overrides.photo_url ?? null,
    team_id: overrides.team_id ?? "team-1",
    team_name: overrides.team_name ?? "Хасууд",
    team_short_code: overrides.team_short_code ?? "ХАС",
    team_slug: overrides.team_slug ?? "khasuud",
    team_primary_color: overrides.team_primary_color ?? "#e63946",
    team_logo_url: overrides.team_logo_url ?? null,
    player_photo_url: overrides.player_photo_url ?? null,
    gp: overrides.gp ?? 10,
    pts: overrides.pts ?? 25,
    oreb: overrides.oreb ?? 2,
    dreb: overrides.dreb ?? 5,
    ast: overrides.ast ?? 4,
    stl: overrides.stl ?? 2,
    blk: overrides.blk ?? 1,
    tov: overrides.tov ?? 3,
    fga: overrides.fga ?? 18,
    fgm: overrides.fgm ?? 9,
    threepa: overrides.threepa ?? 5,
    threepm: overrides.threepm ?? 2,
    fta: overrides.fta ?? 4,
    ftm: overrides.ftm ?? 3,
  };
}

function makeLeaders(count: number): LeaderRow[] {
  const names = [
    { name: "Баатар", latin: "Baatar" },
    { name: "Мөнхбат", latin: "Munkhbat" },
    { name: "Болд", latin: "Bold" },
    { name: "Ганзориг", latin: "Ganzorig" },
    { name: "Энхтүвшин", latin: "Enkhtuvshin" },
    { name: "Батболд", latin: "Batbold" },
    { name: "Цогтгэрэл", latin: "Tsogterel" },
    { name: "Тэмүүлэн", latin: "Temuulen" },
  ];
  return Array.from({ length: count }, (_, i) => {
    const n = names[i] ?? { name: `Player ${i + 1}`, latin: `Player${i + 1}` };
    return makeLeader({
      player_name: n.name,
      player_name_latin: n.latin,
      player_id: `player-${i + 1}`,
      pts: 30 - i * 3,
      ast: 8 - i,
      stl: 3 - Math.floor(i / 3),
      blk: 2 - Math.floor(i / 4),
      gp: 10 - Math.floor(i / 2),
    });
  });
}

const { mockGetLeaders } = vi.hoisted(() => ({
  mockGetLeaders: vi.fn(),
}));

vi.mock("@/app/lib/data", () => ({
  getLeaders: mockGetLeaders,
}));

describe("AwardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and description", async () => {
    mockGetLeaders.mockResolvedValue(makeLeaders(5));
    render(await AwardsPage());
    expect(screen.getByText("Наградууд")).toBeInTheDocument();
    expect(screen.getByText("Долооны шилдэг тоглогч")).toBeInTheDocument();
  });

  it("shows MVP race section when leaders exist", async () => {
    mockGetLeaders.mockResolvedValue(makeLeaders(5));
    render(await AwardsPage());
    expect(screen.getByText("MVP УРАЛДААН")).toBeInTheDocument();
    expect(screen.getByText("MVP УРАЛДААН")).toBeVisible();
  });

  it("shows Player of the Week card when leaders exist", async () => {
    mockGetLeaders.mockResolvedValue(makeLeaders(5));
    render(await AwardsPage());
    expect(screen.getByText("ИЛДЭР ТОГЛОГЧ")).toBeInTheDocument();
  });

  it("shows top player name in Player of the Week", async () => {
    const leaders = makeLeaders(5);
    mockGetLeaders.mockResolvedValue(leaders);
    render(await AwardsPage());
    // Top player by composite score is the first one (highest pts)
    expect(screen.getAllByText(leaders[0].player_name).length).toBeGreaterThan(
      0,
    );
  });

  it("renders stat pills for Player of the Week", async () => {
    mockGetLeaders.mockResolvedValue(makeLeaders(5));
    render(await AwardsPage());
    expect(screen.getByText("Оноо")).toBeInTheDocument();
    expect(screen.getByText("Давсан")).toBeInTheDocument();
    expect(screen.getByText("Олгосон")).toBeInTheDocument();
    expect(screen.getByText("Булаасан")).toBeInTheDocument();
    expect(screen.getByText("Хаасан")).toBeInTheDocument();
  });

  it("shows games played badge for POTW", async () => {
    mockGetLeaders.mockResolvedValue(makeLeaders(5));
    render(await AwardsPage());
    // GP badge rendered
    expect(screen.getByText(/тоглолт/)).toBeInTheDocument();
  });

  it("shows Мэдээлэл байхгүй empty state when no leaders", async () => {
    mockGetLeaders.mockResolvedValue([]);
    render(await AwardsPage());
    expect(screen.getByText("Мэдээлэл байхгүй байна")).toBeInTheDocument();
  });

  it("renders links pointing to player detail pages", async () => {
    mockGetLeaders.mockResolvedValue(makeLeaders(3));
    render(await AwardsPage());
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });
});
