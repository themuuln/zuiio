import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MonthlyStatRow } from "@/app/lib/data";

// Mock recharts — SVG components that interfere with jsdom
vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: () => null,
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: () => null,
  XAxis: () => null,
  YAxis: () => null,
  // TabsTrigger uses this
  ReferenceLine: () => null,
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

import { MonthlyProgression } from "../monthly-progression";

function makeMonth(overrides: Partial<MonthlyStatRow> = {}): MonthlyStatRow {
  return {
    month: "2026-07",
    monthLabel: "2026 оны 7-р сар",
    gamesPlayed: 2,
    avgPts: 15,
    avgReb: 5,
    avgAst: 4,
    avgStl: 1.5,
    avgBlk: 1,
    avgTov: 2,
    avgMpg: 12.5,
    avgEff: 28.5,
    fgp: 48.5,
    tpp: 35.0,
    ftp: 78.0,
    ...overrides,
  };
}

describe("MonthlyProgression", () => {
  it("renders empty state when less than 2 months of data", () => {
    render(<MonthlyProgression monthlyStats={[makeMonth()]} />);

    expect(screen.getByText("Сарын дундаж үзүүлэлт")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Хандлага харуулахад хамгийн багадаа 2 сарын өгөгдөл шаардлагатай.",
      ),
    ).toBeInTheDocument();
  });

  it("renders chart when 2+ months of data exist", () => {
    render(
      <MonthlyProgression
        monthlyStats={[
          makeMonth({ month: "2026-06", monthLabel: "2026 оны 6-р сар" }),
          makeMonth({ month: "2026-07", monthLabel: "2026 оны 7-р сар" }),
        ]}
      />,
    );

    expect(screen.getByText("Сарын дундаж үзүүлэлт")).toBeInTheDocument();
    expect(
      screen.getByText("Сар бүрийн дундаж үзүүлэлтийн хандлага"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });

  it("renders stat selector tabs with label texts", () => {
    render(
      <MonthlyProgression
        monthlyStats={[
          makeMonth({ month: "2026-06", monthLabel: "2026 оны 6-р сар" }),
          makeMonth({ month: "2026-07", monthLabel: "2026 оны 7-р сар" }),
        ]}
      />,
    );

    // Labels appear in both tabs and legend — use getAllByText
    expect(screen.getAllByText("Оноо").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("EFF").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("FG%").length).toBeGreaterThanOrEqual(1);
  });

  it("has Оноо selected by default", () => {
    render(
      <MonthlyProgression
        monthlyStats={[
          makeMonth({ month: "2026-06", monthLabel: "2026 оны 6-р сар" }),
          makeMonth({ month: "2026-07", monthLabel: "2026 оны 7-р сар" }),
        ]}
      />,
    );

    const selectedTab = screen.getByRole("tab", { selected: true });
    expect(selectedTab).toHaveTextContent("Оноо");
  });

  it("renders chart container for percentage stats (LineChart path)", () => {
    render(
      <MonthlyProgression
        monthlyStats={[
          makeMonth({
            month: "2026-06",
            monthLabel: "2026 оны 6-р сар",
            fgp: 50.0,
            tpp: null,
            ftp: null,
          }),
          makeMonth({
            month: "2026-07",
            monthLabel: "2026 оны 7-р сар",
            fgp: 55.0,
            tpp: 40.0,
            ftp: 85.0,
          }),
        ]}
      />,
    );

    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });

  it("handles months with all null percentages gracefully", () => {
    render(
      <MonthlyProgression
        monthlyStats={[
          makeMonth({
            month: "2026-06",
            monthLabel: "2026 оны 6-р сар",
            fgp: null,
            tpp: null,
            ftp: null,
          }),
          makeMonth({
            month: "2026-07",
            monthLabel: "2026 оны 7-р сар",
            fgp: 50.0,
            tpp: 40.0,
            ftp: 85.0,
          }),
        ]}
      />,
    );

    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
  });
});
