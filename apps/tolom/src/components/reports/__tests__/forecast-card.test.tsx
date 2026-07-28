import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ForecastCard } from "@/components/reports/forecast-card";
import type { ReportForecast } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockForecast: ReportForecast = {
  current_revenue: 25000,
  days_elapsed: 15,
  total_days: 30,
  projected_revenue: 50000,
  previous_period_revenue: 45000,
  projected_change_pct: 11.1,
  daily_run_rate: 1667,
  on_track: true,
  target_revenue: 55000,
  target_progress_pct: 45,
};

describe("ForecastCard", () => {
  it("renders the forecast title and projected revenue", () => {
    render(<ForecastCard forecast={mockForecast} />);
    expect(screen.getByText("forecastTitle")).toBeInTheDocument();
    expect(screen.getByText("projected")).toBeInTheDocument();
  });

  it("shows days elapsed with progress bar", () => {
    const { container } = render(<ForecastCard forecast={mockForecast} />);
    expect(screen.getByText("daysElapsed")).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="progress"]'),
    ).toBeInTheDocument();
  });

  it("shows daily run rate and current revenue", () => {
    render(<ForecastCard forecast={mockForecast} />);
    expect(screen.getByText("dailyRunRate")).toBeInTheDocument();
    expect(screen.getByText("current")).toBeInTheDocument();
  });

  it("shows on-track indicator when on_track and previous_period_revenue > 0", () => {
    render(<ForecastCard forecast={mockForecast} />);
    // Component renders t("onTrack") + " · " + t("previousPeriod") in one text node
    expect(screen.getByText(/onTrack/)).toBeInTheDocument();
    expect(screen.getByText(/previousPeriod/)).toBeInTheDocument();
  });

  it("shows behind-pace indicator when not on_track and previous period data exists", () => {
    const behindForecast: ReportForecast = {
      ...mockForecast,
      on_track: false,
    };
    render(<ForecastCard forecast={behindForecast} />);
    expect(screen.getByText(/behindPace/)).toBeInTheDocument();
  });

  it("shows delta indicator when projected_change_pct is set", () => {
    render(<ForecastCard forecast={mockForecast} />);
    // DeltaIndicator displays the value with a plus/minus prefix and % suffix
    expect(screen.getByText(/11\.1/)).toBeInTheDocument();
  });

  it("does NOT show previous period comparison when previous_period_revenue is null", () => {
    const noPrev: ReportForecast = {
      ...mockForecast,
      previous_period_revenue: null,
    };
    render(<ForecastCard forecast={noPrev} />);
    expect(screen.queryByText(/onTrack/)).not.toBeInTheDocument();
    expect(screen.queryByText(/previousPeriod/)).not.toBeInTheDocument();
  });

  it("does NOT show previous period comparison when previous_period_revenue is 0", () => {
    const zeroPrev: ReportForecast = {
      ...mockForecast,
      previous_period_revenue: 0,
    };
    render(<ForecastCard forecast={zeroPrev} />);
    expect(screen.queryByText(/previousPeriod/)).not.toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<ForecastCard forecast={null} loading />);
    expect(container.querySelector(".h-\\[120px\\]")).toBeInTheDocument();
  });

  it("shows no data message when forecast is null", () => {
    render(<ForecastCard forecast={null} />);
    expect(screen.getByText("noDataForPeriod")).toBeInTheDocument();
  });

  it("handles zero total days gracefully", () => {
    const zeroDays: ReportForecast = {
      ...mockForecast,
      total_days: 0,
      days_elapsed: 0,
    };
    render(<ForecastCard forecast={zeroDays} />);
    // Should not crash; days-elapsed percentage shows 0%
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
