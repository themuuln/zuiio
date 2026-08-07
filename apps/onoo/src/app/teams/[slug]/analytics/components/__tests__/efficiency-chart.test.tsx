/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeamAdvancedStatsPerGame } from "@/app/lib/shared";
import { EfficiencyChart } from "../efficiency-chart";

// Mock recharts components
vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

// Mock chart container
vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="chart-container" className={className}>
      {children}
    </div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

const baseGame: TeamAdvancedStatsPerGame = {
  game_id: "g1",
  scheduled_at: "2025-01-15T00:00:00Z",
  opponent_name: "Өрсөлдөгч",
  opponent_slug: "opponent",
  home_away: "home",
  team_score: 80,
  opp_score: 70,
  result: "W",
  ortg: 110.5,
  drtg: 100.2,
  net_rtg: 10.3,
  pace: 98.5,
  efg: 0.52,
  tov_pct: 0.12,
  oreb_pct: 0.3,
  fta_rate: 0.25,
  pie: 0.55,
};

function createGames(count: number): TeamAdvancedStatsPerGame[] {
  return Array.from({ length: count }, (_, i) => ({
    ...baseGame,
    game_id: `g${i + 1}`,
    scheduled_at: `2025-01-${15 + i}T00:00:00Z`,
    opponent_name: `Баг ${i + 1}`,
    result: i % 2 === 0 ? ("W" as const) : ("L" as const),
    team_score: 80 + i * 2,
    opp_score: 70 - i * 2,
    ortg: 110.5 + i * 2,
    drtg: 100.2 - i,
  }));
}

describe("EfficiencyChart", () => {
  describe("empty state", () => {
    it("shows placeholder when no games provided", () => {
      render(<EfficiencyChart games={[]} />);
      expect(screen.getByText("Үзүүлэлтийн хандлага")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Хандалтыг харуулахад хамгийн багадаа 2 тоглолт шаардлагатай.",
        ),
      ).toBeInTheDocument();
    });

    it("shows placeholder when only one game provided", () => {
      render(<EfficiencyChart games={createGames(1)} />);
      expect(screen.getByText("Үзүүлэлтийн хандлага")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Хандалтыг харуулахад хамгийн багадаа 2 тоглолт шаардлагатай.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("normal state", () => {
    it("renders chart container when 3+ games provided", () => {
      render(<EfficiencyChart games={createGames(3)} />);
      expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    });

    it("renders chart container for exactly 2 games (boundary)", () => {
      render(<EfficiencyChart games={createGames(2)} />);
      expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    });

    it("renders title with offensive and defensive labels", () => {
      render(<EfficiencyChart games={createGames(3)} />);
      expect(screen.getByText("Үзүүлэлтийн хандлага")).toBeInTheDocument();
      expect(screen.getByText("ORtg (довтолгоо)")).toBeInTheDocument();
      expect(screen.getByText("DRtg (хамгаалалт)")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <EfficiencyChart games={createGames(3)} className="custom-class" />,
      );
      const card = container.querySelector(".custom-class");
      expect(card).toBeInTheDocument();
    });

    it("renders chart container with correct height class", () => {
      render(<EfficiencyChart games={createGames(3)} />);
      const chartContainer = screen.getByTestId("chart-container");
      expect(chartContainer.className).toContain("h-56");
    });
  });
});
