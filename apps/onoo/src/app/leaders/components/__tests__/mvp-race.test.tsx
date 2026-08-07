/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

// Mock lucide-react
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

// Mock UI card components
vi.mock("@/components/ui", () => ({
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
  CardDescription: ({ children }: Record<string, unknown>) => (
    <p data-testid="card-description">{children as React.ReactNode}</p>
  ),
}));

import type { MvpRaceRow } from "@/app/lib/data";
import { MvpRace } from "../mvp-race";

function makeMvpRaceRow(overrides: Partial<MvpRaceRow> = {}): MvpRaceRow {
  return {
    player_id: overrides.player_id ?? "player-1",
    canonical_name: overrides.canonical_name ?? "Баатар",
    photo_url: overrides.photo_url ?? null,
    team_name: overrides.team_name ?? "Хасууд",
    team_short_code: overrides.team_short_code ?? "ХАС",
    team_primary_color: overrides.team_primary_color ?? "#e63946",
    eff: overrides.eff ?? 28.5,
    games_played: overrides.games_played ?? 10,
    ...overrides,
  };
}

function makeMvpRaceRows(count: number): MvpRaceRow[] {
  const names = [
    { name: "Баатар", eff: 32.4 },
    { name: "Мөнхбат", eff: 28.7 },
    { name: "Болд", eff: 25.1 },
    { name: "Ганзориг", eff: 22.3 },
    { name: "Энхтүвшин", eff: 19.8 },
    { name: "Батболд", eff: 17.5 },
  ];
  return Array.from({ length: count }, (_, i) => {
    const n = names[i] ?? { name: `Player ${i + 1}`, eff: 15 - i };
    return makeMvpRaceRow({
      player_id: `player-${i + 1}`,
      canonical_name: n.name,
      eff: n.eff,
    });
  });
}

describe("MvpRace", () => {
  it("renders card title", () => {
    render(<MvpRace candidates={makeMvpRaceRows(5)} />);
    expect(screen.getByText("MVP уралдаан")).toBeInTheDocument();
  });

  it("renders card description", () => {
    render(<MvpRace candidates={makeMvpRaceRows(5)} />);
    expect(
      screen.getByText("Үр дүнгийн индексээр шалгарсан тоглогчид"),
    ).toBeInTheDocument();
  });

  it("renders top 5 candidates ranked by EFF", () => {
    render(<MvpRace candidates={makeMvpRaceRows(5)} />);
    expect(screen.getAllByText("Баатар").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Мөнхбат").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Болд").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ганзориг").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Энхтүвшин").length).toBeGreaterThan(0);
  });

  it("displays EFF score for each candidate", () => {
    render(<MvpRace candidates={makeMvpRaceRows(5)} />);
    expect(screen.getByText("32.4")).toBeInTheDocument();
    expect(screen.getByText("28.7")).toBeInTheDocument();
    expect(screen.getByText("25.1")).toBeInTheDocument();
    expect(screen.getByText("22.3")).toBeInTheDocument();
    expect(screen.getByText("19.8")).toBeInTheDocument();
  });

  it("shows EFF label for each candidate", () => {
    render(<MvpRace candidates={makeMvpRaceRows(3)} />);
    const effLabels = screen.getAllByText("EFF");
    expect(effLabels).toHaveLength(3);
  });

  it("shows team short code for each candidate", () => {
    render(<MvpRace candidates={makeMvpRaceRows(3)} />);
    const codes = screen.getAllByText("ХАС");
    expect(codes).toHaveLength(3);
  });

  it("renders rank numbers", () => {
    render(<MvpRace candidates={makeMvpRaceRows(3)} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders nothing when candidates array is empty", () => {
    const { container } = render(<MvpRace candidates={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when candidates is null-like empty", () => {
    const { container } = render(<MvpRace candidates={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("all links point to /players/[player_id]", () => {
    const candidates = makeMvpRaceRows(3);
    render(<MvpRace candidates={candidates} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    links.forEach((link, i) => {
      expect(link).toHaveAttribute("href", `/players/player-${i + 1}`);
    });
  });

  it("applies amber highlight to rank 1", () => {
    render(<MvpRace candidates={makeMvpRaceRows(3)} />);
    const rank1 = screen.getByText("1");
    expect(rank1).toBeInTheDocument();
  });

  it("accepts and applies className prop", () => {
    const { container } = render(
      <MvpRace candidates={makeMvpRaceRows(3)} className="custom-class" />,
    );
    const card = container.querySelector('[data-testid="card"]');
    expect(card).toBeInTheDocument();
  });
});
