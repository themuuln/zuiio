/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StandingsTableRow } from "../standings-table";
import { TeamDrawer } from "../team-drawer";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockUseQueryResult: {
  data: unknown;
  isPending: boolean;
  error: Error | null;
} = { data: null, isPending: true, error: null };

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => mockUseQueryResult,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => {
  const Icon = ({
    className,
    "aria-hidden": ariaHidden,
  }: {
    className?: string;
    "aria-hidden"?: boolean;
  }) => (
    <span className={className} aria-hidden={ariaHidden} data-testid="icon" />
  );
  return {
    ChevronRight: Icon,
    ExternalLink: Icon,
    BarChart3: Icon,
    Eye: Icon,
    TrendingUp: Icon,
    TrendingDown: Icon,
    Minus: Icon,
  };
});

vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode, size }: { shortCode: string; size?: string }) => (
    <span data-testid="team-logo" data-size={size}>
      {shortCode}
    </span>
  ),
}));

vi.mock("@/components/player-avatar", () => ({
  PlayerAvatar: ({ name, size }: { name: string; size?: string }) => (
    <span data-testid="player-avatar" data-size={size}>
      {name}
    </span>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
    size,
    ...props
  }: {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
  }) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({
    open,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (next: boolean) => void;
    children?: React.ReactNode;
  }) => (
    <div data-testid="drawer" data-open={open}>
      {open && children}
      {open && (
        <button
          data-testid="drawer-close-btn"
          onClick={() => onOpenChange?.(false)}
        >
          Close
        </button>
      )}
    </div>
  ),
  DrawerContent: ({
    children,
    className,
    contentClassName,
    showCloseButton,
  }: {
    children?: React.ReactNode;
    className?: string;
    contentClassName?: string;
    showCloseButton?: boolean;
  }) => (
    <div data-testid="drawer-content" className={className}>
      <div className={contentClassName}>{children}</div>
    </div>
  ),
  DrawerTitle: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => <h2 className={className}>{children}</h2>,
  DrawerDescription: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => <p className={className}>{children}</p>,
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTeam(
  overrides: Partial<StandingsTableRow> & { rank?: number } = {},
) {
  return {
    team_season_id: "ts-1",
    team_id: "team-1",
    team_name: "Хасууд",
    team_slug: "khasuud",
    team_logo_url: null,
    team_short_code: "ХАС",
    team_primary_color: "#e53e3e",
    w: 10,
    l: 2,
    win_pct: 0.833,
    gb: 0,
    streak: "W4",
    last10: "7-3",
    points_for: 890,
    points_against: 720,
    rank: 1,
    ...overrides,
  } as StandingsTableRow & { rank: number };
}

function makeQuickViewData(overrides: Record<string, unknown> = {}) {
  return {
    recentGames: [
      {
        id: "g1",
        status: "official",
        home_team_id: "team-1",
        home_team_name: "Хасууд",
        home_team_short_code: "ХАС",
        home_team_logo_url: null,
        home_team_primary_color: null,
        home_team_slug: "khasuud",
        home_score: 85,
        away_team_id: "team-2",
        away_team_name: "Арслангууд",
        away_team_short_code: "АРС",
        away_team_logo_url: null,
        away_team_primary_color: null,
        away_team_slug: "arslan",
        away_score: 72,
        scheduled_at: "2026-07-22T12:00:00Z",
      },
    ],
    leaders: [
      {
        player_id: "p1",
        player_name: "Б. Төгөлдөр",
        player_photo_url: null,
        team_primary_color: "#e53e3e",
        pts: 22.5,
        oreb: 2.0,
        dreb: 5.0,
        ast: 4.5,
        gp: 8,
      },
    ],
    nextGame: {
      id: "g-next",
      status: "scheduled",
      scheduled_at: "2026-07-28T19:00:00Z",
      home_team_id: "team-1",
      home_team_name: "Хасууд",
      home_team_short_code: "ХАС",
      home_team_logo_url: null,
      home_team_primary_color: null,
      home_team_slug: "khasuud",
      home_score: null,
      away_team_id: "team-3",
      away_team_name: "Титан",
      away_team_short_code: "ТИТ",
      away_team_logo_url: null,
      away_team_primary_color: null,
      away_team_slug: "titan",
      away_score: null,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TeamDrawer", () => {
  beforeEach(() => {
    mockUseQueryResult = { data: null, isPending: true, error: null };
  });

  it("does not render drawer content when closed", () => {
    render(<TeamDrawer team={null} open={false} onClose={vi.fn()} />);

    expect(screen.queryByTestId("drawer-content")).not.toBeInTheDocument();
  });

  it("renders team header with rank, name, record, and streak", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Хасууд")).toBeInTheDocument();
    expect(screen.getByText(/10Я — 2Х/)).toBeInTheDocument();
    expect(screen.getByText(/W4/)).toBeInTheDocument();
  });

  it("renders key stats quad (PPG, OPP PPG, Diff, GB)", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    // Points for: 890 / 12 games = 74.2
    expect(screen.getByText("74.2")).toBeInTheDocument();
    // Points against: 720 / 12 = 60.0
    expect(screen.getByText("60.0")).toBeInTheDocument();
    // Diff: 890 - 720 = +170
    expect(screen.getByText("+170")).toBeInTheDocument();
    // GB: 0
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders team logo with short code", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    const logos = screen.getAllByTestId("team-logo");
    expect(logos.length).toBeGreaterThanOrEqual(1);
    expect(logos[0]).toHaveTextContent("ХАС");
  });

  it("shows loading skeletons while query is pending", () => {
    mockUseQueryResult = { data: null, isPending: true, error: null };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    // Team identity + stats quad render instantly
    expect(screen.getByText("Хасууд")).toBeInTheDocument();

    // Lazy sections show skeletons
    const skeletons = screen.getAllByTestId("skeleton");
    // 5 (form) + 3 (leaders) + 1 (next game) = 9 skeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(9);
  });

  it("renders recent games when data loads", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    // Opponent name appears (@ or vs)
    expect(screen.getByText(/Арслангууд/)).toBeInTheDocument();
    // Score appears (85:72)
    expect(screen.getByText("85:72")).toBeInTheDocument();
    // W/L badge
    expect(screen.getByText("W")).toBeInTheDocument();
  });

  it("renders team leaders when data loads", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);
    expect(screen.getAllByText("Б. Төгөлдөр").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("22.5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("PPG")).toBeInTheDocument();
  });

  it("renders next game when data loads", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    expect(screen.getByText("Титан")).toBeInTheDocument();
    // Game is home for team-1
    expect(screen.getByText(/Гэрт/)).toBeInTheDocument();
  });

  it("renders action links for team page, analytics, scout", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/teams/khasuud");
    expect(hrefs).toContain("/teams/khasuud/analytics");
    expect(hrefs).toContain("/teams/khasuud/scout");
  });

  it("shows empty state when no games exist", () => {
    mockUseQueryResult = {
      data: { recentGames: [], leaders: [], nextGame: null },
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    expect(screen.getByText("Тоглолт хараахан байхгүй")).toBeInTheDocument();
    expect(screen.getByText("Тоглогчийн өгөгдөл байхгүй")).toBeInTheDocument();
    expect(
      screen.getByText("Дараагийн тоглолт товлогдоогүй"),
    ).toBeInTheDocument();
  });

  it("shows error state when query fails", () => {
    mockUseQueryResult = {
      data: null,
      isPending: false,
      error: new Error("Network error"),
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    // All three lazy sections should show error message
    const errorMessages = screen.getAllByText("Ачаалахад алдаа гарлаа");
    expect(errorMessages).toHaveLength(3);

    // Instant sections (header, stats quad) still render
    expect(screen.getByText("Хасууд")).toBeInTheDocument();
    expect(screen.getByText("74.2")).toBeInTheDocument();
  });

  it("calls onClose when drawer close button is clicked", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };
    const onClose = vi.fn();

    render(<TeamDrawer team={makeTeam()} open={true} onClose={onClose} />);

    const closeBtn = screen.getByTestId("drawer-close-btn");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders away game indicator for non-home next game", () => {
    mockUseQueryResult = {
      data: {
        ...makeQuickViewData(),
        nextGame: {
          id: "g-next",
          status: "scheduled",
          scheduled_at: "2026-07-28T19:00:00Z",
          home_team_id: "team-3",
          home_team_name: "Титан",
          home_team_short_code: "ТИТ",
          home_team_logo_url: null,
          home_team_primary_color: null,
          home_team_slug: "titan",
          home_score: null,
          away_team_id: "team-1",
          away_team_name: "Хасууд",
          away_team_short_code: "ХАС",
          away_team_logo_url: null,
          away_team_primary_color: null,
          away_team_slug: "khasuud",
          away_score: null,
        },
      },
      isPending: false,
      error: null,
    };

    render(<TeamDrawer team={makeTeam()} open={true} onClose={vi.fn()} />);

    expect(screen.getByText("Титан")).toBeInTheDocument();
    expect(screen.getByText(/Зочилсон/)).toBeInTheDocument();
  });

  it("shows rank badge and primary color accent when present", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(
      <TeamDrawer
        team={makeTeam({ rank: 3, team_primary_color: "#ff6600" })}
        open={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("handles team with no streak gracefully", () => {
    mockUseQueryResult = {
      data: makeQuickViewData(),
      isPending: false,
      error: null,
    };

    render(
      <TeamDrawer
        team={makeTeam({ streak: null })}
        open={true}
        onClose={vi.fn()}
      />,
    );

    // Should still render team header without streak
    expect(screen.getByText(/10Я — 2Х/)).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });
});
