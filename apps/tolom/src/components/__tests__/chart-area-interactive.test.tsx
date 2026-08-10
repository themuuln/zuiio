import { fireEvent, screen } from "@testing-library/react";
import type * as NextIntl from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { render as renderWithUtils } from "@/test/test-utils";

const t = vi.hoisted(() => (key: string) => key);
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof NextIntl>("next-intl");
  return { ...actual, useTranslations: () => t };
});

vi.mock("recharts", async () => await import("@/test/mocks/recharts"));

const chartState = vi.hoisted(() => ({ data: [] as unknown[] }));
vi.mock("@/components/charts/_area-interactive-chart", () => ({
  AreaInteractiveChart: ({ data }: { data: unknown[] }) => {
    chartState.data = data;
    return <div data-testid="mock-area-chart" />;
  },
}));

function pickRange(label: string) {
  const item = screen.getByText(label);
  fireEvent.pointerDown(item, { pointerType: "mouse" });
  fireEvent.click(item);
}

describe("ChartAreaInteractive", () => {
  it("renders the card title and default 90-day data window", async () => {
    renderWithUtils(<ChartAreaInteractive />);
    expect(screen.getByText("Total Visitors")).toBeInTheDocument();
    expect(await screen.findByTestId("mock-area-chart")).toBeInTheDocument();
    // 2024-04-01 .. 2024-06-30 — the whole sample set
    expect(chartState.data).toHaveLength(91);
    const first = chartState.data[0] as { date: string };
    expect(first.date).toBe("2024-04-01");
  });

  it("narrows the data window to 30 days", async () => {
    renderWithUtils(<ChartAreaInteractive />);
    await screen.findByTestId("mock-area-chart");
    pickRange("Last 30 days");
    // 2024-05-31 .. 2024-06-30 inclusive
    expect(chartState.data).toHaveLength(31);
    const first = chartState.data[0] as { date: string };
    expect(first.date).toBe("2024-05-31");
  });

  it("narrows the data window to 7 days", async () => {
    renderWithUtils(<ChartAreaInteractive />);
    await screen.findByTestId("mock-area-chart");
    pickRange("Last 7 days");
    // 2024-06-23 .. 2024-06-30 inclusive
    expect(chartState.data).toHaveLength(8);
    const first = chartState.data[0] as { date: string };
    expect(first.date).toBe("2024-06-23");
  });
});
