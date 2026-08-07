/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: Record<string, unknown>) => (
    <div data-testid="card" className={className as string} {...props}>
      {children as React.ReactNode}
    </div>
  ),
  CardContent: ({ children }: Record<string, unknown>) => (
    <div data-testid="card-content">{children as React.ReactNode}</div>
  ),
}));

import type { TeamSeasonAggregates } from "@/app/lib/shared";
import { TeamStatsSummary } from "../team-stats-summary";

const baseAggregates: TeamSeasonAggregates = {
  games_played: 5,
  avg_ortg: 110.5,
  avg_drtg: 105.2,
  avg_net_rtg: 5.3,
  avg_pace: 98.7,
  avg_efg: 52.3,
  avg_tov_pct: 14.8,
  avg_oreb_pct: 28.1,
  avg_fta_rate: 0.25,
  avg_pie: 0.52,
  wins: 3,
  losses: 2,
};

describe("TeamStatsSummary", () => {
  it("shows empty state when games_played is 0", () => {
    const emptyAggregates: TeamSeasonAggregates = {
      ...baseAggregates,
      games_played: 0,
      wins: 0,
      losses: 0,
    };

    render(<TeamStatsSummary aggregates={emptyAggregates} />);
    expect(
      screen.getByText(/Хангалттай өгөгдөл байхгүй байна/),
    ).toBeInTheDocument();
  });

  it("renders games count and W-L record in header", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    expect(screen.getByText("(5 тоглолт, 3–2)")).toBeInTheDocument();
  });

  it("renders all 9 stat card labels", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    const labels = [
      "Довтолгооны үнэлгээ",
      "Хамгаалалтын үнэлгээ",
      "NetRTG",
      "Темп",
      "eFG%",
      "Алдаа %",
      "Довт. самбар %",
      "Чөлөөт шидэлтийн хувь",
      "PIE",
    ];

    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders 9 Card elements", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    const cards = screen.getAllByTestId("card");
    expect(cards).toHaveLength(9);
  });

  it("formats NetRTG with + prefix when positive", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    expect(screen.getByText("+5.3")).toBeInTheDocument();
  });

  it("shows NetRTG without + prefix when negative", () => {
    const negativeNet: TeamSeasonAggregates = {
      ...baseAggregates,
      avg_net_rtg: -2.5,
    };

    render(<TeamStatsSummary aggregates={negativeNet} />);

    expect(screen.getByText("-2.5")).toBeInTheDocument();
  });

  it("applies emerald color for higherIsBetter=true with positive value", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    // avg_net_rtg = 5.3, higherIsBetter=true, value > 0 => emerald
    const valueEl = screen.getByText("+5.3");
    expect(valueEl.className).toContain("text-emerald-600");
  });

  it("applies red color for higherIsBetter=true with negative value", () => {
    const negativeNet: TeamSeasonAggregates = {
      ...baseAggregates,
      avg_net_rtg: -2.5,
    };

    render(<TeamStatsSummary aggregates={negativeNet} />);

    // avg_net_rtg = -2.5, higherIsBetter=true, value < 0 => red
    const valueEl = screen.getByText("-2.5");
    expect(valueEl.className).toContain("text-red-600");
  });

  it("applies red color for higherIsBetter=false with positive value", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    // avg_tov_pct = 14.8, higherIsBetter=false, value > 0 => red
    const valueEl = screen.getByText("14.8%");
    expect(valueEl.className).toContain("text-red-600");
  });

  it("applies emerald color for higherIsBetter=false with negative value", () => {
    const negativeDRtg: TeamSeasonAggregates = {
      ...baseAggregates,
      avg_drtg: -3.0,
    };

    render(<TeamStatsSummary aggregates={negativeDRtg} />);

    // avg_drtg = -3.0, higherIsBetter=false, value < 0 => emerald
    const valueEl = screen.getByText("-3.0");
    expect(valueEl.className).toContain("text-emerald-600");
  });

  it("applies % suffix to isPercent cards", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    // eFG% → 52.3%%
    expect(screen.getByText("52.3%")).toBeInTheDocument();
    // Алдаа % → 14.8%
    expect(screen.getByText("14.8%")).toBeInTheDocument();
    // Довт. самбар % → 28.1%
    expect(screen.getByText("28.1%")).toBeInTheDocument();
    // PIE → 0.5%
    expect(screen.getByText("0.5%")).toBeInTheDocument();
  });

  it("does not apply % suffix to non-percent cards", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    // avg_fta_rate has no isPercent, value is 0.3
    expect(screen.getByText("0.3")).toBeInTheDocument();
    // Ensure the element's text content doesn't end with %
    const ftaEl = screen.getByText("0.3");
    expect(ftaEl.textContent).toBe("0.3");
  });

  it("renders values with tabular-nums class", () => {
    render(<TeamStatsSummary aggregates={baseAggregates} />);

    const valueEl = screen.getByText("110.5");
    expect(valueEl.className).toContain("tabular-nums");
  });

  it("applies className to container", () => {
    const { container } = render(
      <TeamStatsSummary aggregates={baseAggregates} className="test-class" />,
    );

    // The first child div after the h2 is the outermost element with className applied
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain("test-class");
  });
});
