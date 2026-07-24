/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock @/components/ui — avoids lucide-react dependency chain
vi.mock("@/components/ui", () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
  Table: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="table">{children}</table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
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
    <td data-testid="cell" className={className} colSpan={colSpan}>
      {children}
    </td>
  ),
  TableHead: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => <th className={className}>{children}</th>,
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...inputs: (string | undefined | null | false)[]) =>
    inputs.filter(Boolean).join(" "),
}));

import type { LiveBoxScoreProps } from "../components/live-box-score";
import { LiveBoxScore } from "../components/live-box-score";

function makeRow(overrides: Partial<LiveBoxScoreProps["rows"][0]> = {}) {
  return {
    playerId: "p1",
    playerName: "Тоглогч 1",
    teamSeasonId: "home-ts",
    pts: 12,
    fgm: 5,
    fga: 10,
    tpm: 2,
    tpa: 5,
    ftm: 0,
    fta: 1,
    oreb: 2,
    dreb: 3,
    ast: 4,
    stl: 1,
    blk: 0,
    tov: 2,
    pf: 3,
    ...overrides,
  };
}

function defaultProps(
  overrides: Partial<LiveBoxScoreProps> = {},
): LiveBoxScoreProps {
  return {
    homeTeamName: "Багууд",
    awayTeamName: "Хуурай",
    homeTeamSeasonId: "home-ts",
    awayTeamSeasonId: "away-ts",
    rows: [
      makeRow({
        playerId: "p1",
        playerName: "Тоглогч 1",
        teamSeasonId: "home-ts",
        pts: 10,
      }),
      makeRow({
        playerId: "p2",
        playerName: "Тоглогч 2",
        teamSeasonId: "home-ts",
        pts: 20,
      }),
      makeRow({
        playerId: "p3",
        playerName: "Тоглогч 3",
        teamSeasonId: "away-ts",
        pts: 15,
      }),
    ],
    ...overrides,
  };
}

describe("LiveBoxScore", () => {
  it("renders section heading with provisional badge", () => {
    render(<LiveBoxScore {...defaultProps()} />);
    expect(screen.getByText("Box Score")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toHaveTextContent("Урьдчилсан");
  });

  it("renders both team section headings", () => {
    render(<LiveBoxScore {...defaultProps()} />);
    expect(screen.getByText("Багууд")).toBeInTheDocument();
    expect(screen.getByText("Хуурай")).toBeInTheDocument();
  });

  it("filters rows per team and sorts home rows by pts descending", () => {
    render(<LiveBoxScore {...defaultProps()} />);

    const cells = screen.getAllByTestId("cell");
    const nameCells = cells.filter(
      (c) =>
        c.textContent === "Тоглогч 1" ||
        c.textContent === "Тоглогч 2" ||
        c.textContent === "Тоглогч 3",
    );

    // Home team: Тоглогч 2 (20pts) first, then Тоглогч 1 (10pts)
    expect(nameCells[0]).toHaveTextContent("Тоглогч 2");
    expect(nameCells[1]).toHaveTextContent("Тоглогч 1");
    // Away team: Тоглогч 3 (15pts)
    expect(nameCells[2]).toHaveTextContent("Тоглогч 3");
  });

  it("shows empty-state message in each team section when no rows", () => {
    render(<LiveBoxScore {...defaultProps({ rows: [] })} />);
    const messages = screen.getAllByText(
      "Тоглогчийн мөр хараахан гараагүй байна",
    );
    expect(messages).toHaveLength(2);
  });

  it("formats field goal stats as fgm/fga", () => {
    render(<LiveBoxScore {...defaultProps()} />);

    const cells = screen.getAllByTestId("cell");
    const fgCells = cells.filter((c) => c.textContent === "5/10");
    expect(fgCells.length).toBeGreaterThanOrEqual(1);
  });

  it("renders table structure on initial render", () => {
    const { container } = render(<LiveBoxScore {...defaultProps()} />);
    expect(container.querySelector("table")).toBeInTheDocument();
  });
});
