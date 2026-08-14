import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InsightAlerts } from "@/components/reports/insight-alerts";
import type { ReportInsight } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      noDataForPeriod: "No data for this period",
    };
    return messages[key] ?? key;
  },
}));

const insights: ReportInsight[] = [
  {
    id: "i1",
    severity: "positive",
    title: "Revenue up",
    message: "Revenue grew 12% vs previous period",
    action: "Keep current pricing",
  },
  {
    id: "i2",
    severity: "warning",
    title: "Slow diagnostics",
    message: "Diagnostics take longer than usual",
  },
  {
    id: "i3",
    severity: "danger",
    title: "Revenue down",
    message: "Revenue dropped 8%",
  },
  {
    id: "i4",
    severity: "info",
    title: "Top service",
    message: "Oil change leads revenue",
  },
];

describe("InsightAlerts", () => {
  it("shows three skeletons while loading", () => {
    const { container } = render(<InsightAlerts insights={[]} loading />);
    expect(container.querySelectorAll("[data-slot='skeleton']")).toHaveLength(
      3,
    );
    expect(screen.queryByText("Revenue up")).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no insights", () => {
    render(<InsightAlerts insights={[]} />);
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
  });

  it("renders insight titles, messages and actions", () => {
    render(<InsightAlerts insights={insights} />);
    expect(screen.getByText("Revenue up")).toBeInTheDocument();
    expect(
      screen.getByText("Revenue grew 12% vs previous period"),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep current pricing")).toBeInTheDocument();
    expect(screen.getByText("Slow diagnostics")).toBeInTheDocument();
    expect(screen.getByText("Revenue down")).toBeInTheDocument();
    expect(screen.getByText("Top service")).toBeInTheDocument();
  });

  it("renders the matching icon for each severity", () => {
    const { container } = render(<InsightAlerts insights={insights} />);
    expect(container.querySelectorAll(".lucide-circle-check")).toHaveLength(1);
    expect(container.querySelectorAll(".lucide-triangle-alert")).toHaveLength(
      2,
    );
    expect(container.querySelectorAll(".lucide-info")).toHaveLength(1);
  });

  it("applies the severity color classes", () => {
    const { container } = render(<InsightAlerts insights={insights} />);
    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards[0]?.className).toContain("bg-green-50/50");
    expect(cards[1]?.className).toContain("bg-amber-50/50");
    expect(cards[2]?.className).toContain("bg-red-50/50");
    expect(cards[3]?.className).toContain("bg-info/10");
  });

  it("omits the action line when an insight has no action", () => {
    const { container } = render(
      <InsightAlerts
        insights={[
          {
            id: "no-action",
            severity: "info",
            title: "Plain",
            message: "No suggestion",
          },
        ]}
      />,
    );
    expect(container.querySelector(".italic")).not.toBeInTheDocument();
  });
});
