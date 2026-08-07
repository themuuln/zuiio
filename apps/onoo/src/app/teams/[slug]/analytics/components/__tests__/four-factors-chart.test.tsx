/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeamSeasonAggregates } from "@/app/lib/shared";

// Mock recharts — make BarChart render data items so we can verify labels+descriptions
vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: Array<{ factor: string; desc: string }>;
  }) => (
    <div data-testid="bar-chart">
      {data?.map((item) => (
        <div key={item.factor}>
          <span>{item.factor}</span>
          <span>{item.desc}</span>
        </div>
      ))}
      {children}
    </div>
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@/components/ui/chart", () => ({
  ChartContainer: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="chart-container" className={className}>
      {children}
    </div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

import { FourFactorsChart } from "../four-factors-chart";

const baseAggregates: TeamSeasonAggregates = {
  games_played: 10,
  avg_ortg: 112.5,
  avg_drtg: 105.3,
  avg_net_rtg: 7.2,
  avg_pace: 74.1,
  avg_efg: 0.523,
  avg_tov_pct: 0.147,
  avg_oreb_pct: 0.312,
  avg_fta_rate: 0.248,
  avg_pie: 0.525,
  wins: 7,
  losses: 3,
};

const leagueAverages = {
  efg: 0.512,
  tovPct: 0.138,
  orebPct: 0.285,
  ftaRate: 0.221,
};

describe("FourFactorsChart", () => {
  describe("empty state", () => {
    it("shows no-data message when games_played is 0", () => {
      const emptyAggs: TeamSeasonAggregates = {
        ...baseAggregates,
        games_played: 0,
      };
      render(<FourFactorsChart aggregates={emptyAggs} />);
      expect(
        screen.getByText("Өгөгдөл бэлэн болоогүй байна."),
      ).toBeInTheDocument();
    });
  });

  describe("without leagueAverages", () => {
    it("renders the title", () => {
      render(<FourFactorsChart aggregates={baseAggregates} />);
      expect(
        screen.getByText("Тоглолтын дөрвөн хүчин зүйл"),
      ).toBeInTheDocument();
    });

    it("shows team bars only — no league legend", () => {
      render(<FourFactorsChart aggregates={baseAggregates} />);
      expect(screen.getByText("Багийн")).toBeInTheDocument();
      expect(screen.queryByText("Лигийн дундаж")).not.toBeInTheDocument();
    });

    it("renders all four factor labels", () => {
      render(<FourFactorsChart aggregates={baseAggregates} />);
      expect(screen.getByText("eFG%")).toBeInTheDocument();
      expect(screen.getByText("TOV%")).toBeInTheDocument();
      expect(screen.getByText("OREB%")).toBeInTheDocument();
      expect(screen.getByText("FTA Rate")).toBeInTheDocument();
    });

    it("renders description text for each factor", () => {
      render(<FourFactorsChart aggregates={baseAggregates} />);
      expect(screen.getByText("Үр дүнтэй шидэлт")).toBeInTheDocument();
      expect(screen.getByText("Алдааны хувь")).toBeInTheDocument();
      expect(screen.getByText("Довтолгооны самбар")).toBeInTheDocument();
      expect(screen.getByText("Чөлөөт шидэлтийн хувь")).toBeInTheDocument();
    });

    it("renders chart container", () => {
      render(<FourFactorsChart aggregates={baseAggregates} />);
      expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    });
  });

  describe("with leagueAverages", () => {
    it("shows league legend alongside team legend", () => {
      render(
        <FourFactorsChart
          aggregates={baseAggregates}
          leagueAverages={leagueAverages}
        />,
      );
      expect(screen.getByText("Багийн")).toBeInTheDocument();
      expect(screen.getByText("Лигийн дундаж")).toBeInTheDocument();
    });

    it("still renders all four factor labels", () => {
      render(
        <FourFactorsChart
          aggregates={baseAggregates}
          leagueAverages={leagueAverages}
        />,
      );
      expect(screen.getByText("eFG%")).toBeInTheDocument();
      expect(screen.getByText("TOV%")).toBeInTheDocument();
      expect(screen.getByText("OREB%")).toBeInTheDocument();
      expect(screen.getByText("FTA Rate")).toBeInTheDocument();
    });

    it("renders the title", () => {
      render(
        <FourFactorsChart
          aggregates={baseAggregates}
          leagueAverages={leagueAverages}
        />,
      );
      expect(
        screen.getByText("Тоглолтын дөрвөн хүчин зүйл"),
      ).toBeInTheDocument();
    });

    it("renders chart container", () => {
      render(
        <FourFactorsChart
          aggregates={baseAggregates}
          leagueAverages={leagueAverages}
        />,
      );
      expect(screen.getByTestId("chart-container")).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("applies custom className to the card", () => {
      const { container } = render(
        <FourFactorsChart aggregates={baseAggregates} className="test-class" />,
      );
      const card = container.querySelector(".test-class");
      expect(card).toBeInTheDocument();
    });
  });
});
