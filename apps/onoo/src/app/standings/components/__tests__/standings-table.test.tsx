/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
  }),
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
    variant,
  }: {
    children?: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <table data-testid="table" className={className}>
      {children}
    </table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody data-testid="table-body">{children}</tbody>
  ),
  TableCaption: ({ children }: { children: React.ReactNode }) => (
    <caption data-testid="table-caption">{children}</caption>
  ),
  TableCell: ({
    children,
    className,
    colSpan,
  }: {
    children?: React.ReactNode;
    className?: string;
    colSpan?: number;
  }) => (
    <td data-testid="table-cell" className={className} colSpan={colSpan}>
      {children}
    </td>
  ),
  TableHead: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <th data-testid="table-head" className={className}>
      {children}
    </th>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead data-testid="table-header">{children}</thead>
  ),
  TableRow: ({
    children,
    className,
    style,
    onClick,
    tabIndex,
    role,
    onKeyDown,
    onMouseEnter,
    "aria-label": ariaLabel,
  }: {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    tabIndex?: number;
    role?: string;
    onKeyDown?: (e: unknown) => void;
    onMouseEnter?: () => void;
    "aria-label"?: string;
  }) => (
    <tr
      data-testid="table-row"
      className={className}
      style={style}
      onClick={onClick}
      tabIndex={tabIndex}
      role={role}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      aria-label={ariaLabel}
    >
      {children}
    </tr>
  ),
}));

vi.mock("lucide-react", () => {
  const createIcon =
    (name: string) =>
    ({
      className,
      "aria-hidden": ariaHidden,
    }: {
      className?: string;
      "aria-hidden"?: boolean | string;
    }) => (
      <span
        data-testid={`icon-${name}`}
        className={className}
        aria-hidden={ariaHidden}
      />
    );
  return {
    ChevronDown: createIcon("chevron-down"),
    ChevronRight: createIcon("chevron-right"),
    Minus: createIcon("minus"),
    TrendingDown: createIcon("trending-down"),
    TrendingUp: createIcon("trending-up"),
  };
});

vi.mock("@/app/standings/components/team-drawer", () => ({
  TeamDrawer: () => null,
}));

// ---------------------------------------------------------------------------
// Component under test
// ---------------------------------------------------------------------------

import type { StandingsTableRow } from "../standings-table";
import { StandingsTable } from "../standings-table";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function createRow(
  overrides: Partial<StandingsTableRow> & { id: string; name: string },
): StandingsTableRow {
  return {
    team_season_id: overrides.id,
    team_id: overrides.id,
    team_name: overrides.name,
    team_slug: overrides.name.toLowerCase().replace(/\s+/g, "-"),
    team_logo_url: null,
    team_short_code: overrides.name.slice(0, 3).toUpperCase(),
    team_primary_color: null,
    w: 0,
    l: 0,
    win_pct: 0,
    gb: null,
    streak: null,
    last10: null,
    points_for: null,
    points_against: null,
    ...overrides,
  };
}

const mockRows: StandingsTableRow[] = [
  createRow({
    id: "ts-1",
    name: "Хасууд",
    w: 10,
    l: 2,
    win_pct: 0.833,
    gb: 0,
    streak: "W4",
    last10: "7-3",
    points_for: 890,
    points_against: 720,
  }),
  createRow({
    id: "ts-2",
    name: "Арслангууд",
    w: 9,
    l: 3,
    win_pct: 0.75,
    gb: 1,
    streak: "W2",
    last10: "6-4",
    points_for: 850,
    points_against: 740,
  }),
  createRow({
    id: "ts-3",
    name: "Титан",
    w: 8,
    l: 4,
    win_pct: 0.667,
    gb: 2,
    streak: "L1",
    last10: "5-5",
    points_for: 810,
    points_against: 760,
  }),
  createRow({
    id: "ts-4",
    name: "Шонхорууд",
    w: 7,
    l: 5,
    win_pct: 0.583,
    gb: 3,
    streak: "W1",
    last10: "6-4",
    points_for: 780,
    points_against: 770,
  }),
  createRow({
    id: "ts-5",
    name: "Монголчууд",
    w: 6,
    l: 6,
    win_pct: 0.5,
    gb: 4,
    streak: "L2",
    last10: "4-6",
    points_for: 740,
    points_against: 780,
  }),
  createRow({
    id: "ts-6",
    name: "Тэнгэрийн",
    w: 5,
    l: 7,
    win_pct: 0.417,
    gb: 5,
    streak: "L3",
    last10: "3-7",
    points_for: 700,
    points_against: 810,
  }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StandingsTable", () => {
  it("renders team rows with names and W-L records", () => {
    render(<StandingsTable rows={mockRows} />);

    // Each team name appears twice (desktop link + mobile card)
    expect(screen.getAllByText("Хасууд")).toHaveLength(2);
    expect(screen.getAllByText("Арслангууд")).toHaveLength(2);
    expect(screen.getAllByText("Титан")).toHaveLength(2);
    expect(screen.getAllByText("Шонхорууд")).toHaveLength(2);
    expect(screen.getAllByText("Монголчууд")).toHaveLength(2);
    expect(screen.getAllByText("Тэнгэрийн")).toHaveLength(2);

    // W values (10, 9, 8, 7, 6, 5) appear
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("9").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("6").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);

    // L values (2, 3, 4, 5, 6, 7) appear
    ["2", "3", "4", "5", "6", "7"].forEach((v) => {
      expect(screen.getAllByText(v).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows playoff line after specified position", () => {
    // Default playoffLineAfter=4: line appears after 4th team
    render(<StandingsTable rows={mockRows} />);

    const playoffLines = screen.getAllByText("Плэйоффийн шугам");
    // Desktop has one, mobile has one
    expect(playoffLines).toHaveLength(2);
    playoffLines.forEach((line) => {
      expect(line).toBeInTheDocument();
    });
  });

  it("positions playoff line correctly with custom playoffLineAfter", () => {
    // playoffLineAfter=2: line appears after 2nd team
    render(<StandingsTable rows={mockRows} playoffLineAfter={2} />);

    const playoffLines = screen.getAllByText("Плэйоффийн шугам");
    expect(playoffLines).toHaveLength(2);
  });

  it("renders streak and last-10", () => {
    render(<StandingsTable rows={mockRows} />);

    // Streak values rendered in badges
    expect(screen.getByText("W4")).toBeInTheDocument();
    expect(screen.getByText("L1")).toBeInTheDocument();
    expect(screen.getByText("W2")).toBeInTheDocument();
    expect(screen.getByText("W1")).toBeInTheDocument();
    expect(screen.getByText("L2")).toBeInTheDocument();
    expect(screen.getByText("L3")).toBeInTheDocument();

    // Badges should have variant "outline"
    const badges = screen.getAllByTestId("badge");
    badges.forEach((badge) => {
      expect(badge).toHaveAttribute("data-variant", "outline");
    });
    expect(badges.length).toBeGreaterThanOrEqual(6);

    // Last-10 values rendered (6-4 appears twice: Арслангууд and Шонхорууд)
    expect(screen.getAllByText("7-3")).toHaveLength(1);
    expect(screen.getAllByText("6-4")).toHaveLength(2);
    expect(screen.getByText("5-5")).toBeInTheDocument();
    expect(screen.getAllByText("4-6")).toHaveLength(1);
    expect(screen.getAllByText("3-7")).toHaveLength(1);
  });

  it("renders mobile view section", () => {
    const { container } = render(<StandingsTable rows={mockRows} />);

    // Mobile section has md:hidden class
    const mobileSection = container.querySelector(".md\\:hidden");
    expect(mobileSection).toBeInTheDocument();

    // Mobile section contains team cards with W-L text
    expect(
      screen.getByText(
        (content) => content.includes("10Я") && content.includes("83.3%"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes("9Я") && content.includes("75.0%"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes("8Я") && content.includes("66.7%"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes("7Я") && content.includes("58.3%"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes("6Я") && content.includes("50.0%"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes("5Я") && content.includes("41.7%"),
      ),
    ).toBeInTheDocument();
  });

  it("renders team logos for each row", () => {
    render(<StandingsTable rows={mockRows} />);

    const logos = screen.getAllByTestId("team-logo");
    expect(logos).toHaveLength(12); // 6 desktop + 6 mobile

    // Short codes rendered twice each (desktop + mobile)
    expect(screen.getAllByText("ХАС")).toHaveLength(2);
    expect(screen.getAllByText("АРС")).toHaveLength(2);
    expect(screen.getAllByText("ТИТ")).toHaveLength(2);
    expect(screen.getAllByText("ШОН")).toHaveLength(2);
    expect(screen.getAllByText("МОН")).toHaveLength(2);
    expect(screen.getAllByText("ТЭН")).toHaveLength(2);
  });

  it("renders links to team pages", () => {
    render(<StandingsTable rows={mockRows} />);

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(6);

    // Check first team link
    expect(links[0]).toHaveAttribute("href", "/teams/хасууд");
  });

  it("renders column headers in desktop table", () => {
    render(<StandingsTable rows={[]} />);

    expect(screen.getByText("Баг")).toBeInTheDocument();
    expect(screen.getByText("Я")).toBeInTheDocument();
    expect(screen.getByText("Х")).toBeInTheDocument();
  });

  it("renders empty state without crashing", () => {
    const { container } = render(<StandingsTable rows={[]} />);

    expect(screen.queryByText("Хасууд")).not.toBeInTheDocument();

    // Desktop table renders
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("table-header")).toBeInTheDocument();

    // Mobile section renders empty
    const mobileSection = container.querySelector(".md\\:hidden");
    expect(mobileSection).toBeInTheDocument();
    expect(mobileSection?.children.length).toBe(0);
  });
});
