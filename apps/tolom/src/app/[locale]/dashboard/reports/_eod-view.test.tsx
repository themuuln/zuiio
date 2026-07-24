import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { EodView } from "./_eod-view";
import type { EodReport } from "./_helpers";

vi.mock("@/components/reports", () => ({
  ReportKpiCard: ({
    label,
    value,
    subtitle,
  }: {
    label: string;
    value: string;
    subtitle?: string;
  }) => (
    <div data-testid="report-kpi-card" data-label={label} data-value={value}>
      <div>{label}</div>
      <div>{value}</div>
      {subtitle && <div data-testid="kpi-subtitle">{subtitle}</div>}
    </div>
  ),
}));

vi.mock("@/components/export-button", () => ({
  ExportButton: () => <div data-testid="export-button">Export</div>,
}));

function makeEodReport(overrides: Partial<EodReport> = {}): EodReport {
  return {
    date: "2026-07-22",
    mechanics: [
      {
        mechanic_id: "m1",
        mechanic_name: "Bat-Erdene",
        work_orders_completed: 12,
        services_performed: 18,
        parts_used: 24,
        total_revenue: 1_200_000,
        total_commission: 240_000,
      },
      {
        mechanic_id: "m2",
        mechanic_name: "Sukhbaatar",
        work_orders_completed: 8,
        services_performed: 10,
        parts_used: 15,
        total_revenue: 960_000,
        total_commission: 192_000,
      },
      {
        mechanic_id: "m3",
        mechanic_name: "Tuul",
        work_orders_completed: 5,
        services_performed: 6,
        parts_used: 10,
        total_revenue: 480_000,
        total_commission: null as unknown as number | undefined,
      },
    ],
    total_work_orders: 25,
    total_revenue: 2_640_000,
    total_commission: 432_000,
    ...overrides,
  };
}

const t = (key: string) => {
  const translations: Record<string, string> = {
    totalRevenueLabel: "Total Revenue",
    totalWorkOrders: "Total Jobs",
    commission: "Commission",
    bestMechanic: "Best Mechanic",
    avgRevenuePerWo: "Avg per job",
    mechanic: "mechanic",
    jobs: "jobs",
    services: "Services",
    parts: "Parts",
    revenue: "Revenue",
    total: "Total",
    perMechanicBreakdown: "Per-Mechanic Breakdown",
    eodSheet: "EOD Summary",
    noMechanicsCompletedWork: "No one completed work yet",
  };
  return translations[key] ?? key;
};

describe("EodView", () => {
  it("renders 4 KPI cards with formatted values", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    const cards = screen.getAllByTestId("report-kpi-card");
    expect(cards).toHaveLength(4);

    // Total Revenue card
    expect(cards[0]).toHaveAttribute("data-label", "Total Revenue");
    expect(cards[0]).toHaveAttribute("data-value", "₮ 2,640,000");

    // Total Jobs card
    expect(cards[1]).toHaveAttribute("data-label", "Total Jobs");
    expect(cards[1]).toHaveAttribute("data-value", "25");

    // Commission card
    expect(cards[2]).toHaveAttribute("data-label", "Commission");
    expect(cards[2]).toHaveAttribute("data-value", "₮ 432,000");

    // Best Mechanic card (label = top earner name)
    expect(cards[3]).toHaveAttribute("data-label", "Bat-Erdene");
    expect(cards[3]).toHaveAttribute("data-value", "₮ 1,200,000");
  });

  it("best mechanic card shows top earner's name and revenue", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    const cards = screen.getAllByTestId("report-kpi-card");
    // 4th card = best mechanic
    expect(cards[3]).toHaveAttribute("data-label", "Bat-Erdene");
    expect(cards[3]).toHaveAttribute("data-value", "₮ 1,200,000");

    // Subtitle shows jobs count
    const subtitle = within(cards[3] as HTMLElement).queryByTestId(
      "kpi-subtitle",
    );
    expect(subtitle).toHaveTextContent("12 jobs");
  });

  it("empty mechanics array shows no-mechanics row and Best Mechanic card shows ₮ 0", () => {
    const data = makeEodReport({ mechanics: [] });
    render(<EodView data={data} t={t} />);

    const cards = screen.getAllByTestId("report-kpi-card");
    expect(cards[3]).toHaveAttribute("data-label", "Best Mechanic");
    expect(cards[3]).toHaveAttribute("data-value", "₮ 0");

    // Empty table row
    expect(screen.getByText("No one completed work yet")).toBeInTheDocument();

    // No footer when empty
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });

  it("mechanic table rows show name, jobs, services, parts, revenue, commission", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    const rows = screen.getAllByRole("row");
    // index 0 = header, 1 = Bat-Erdene, 2 = Sukhbaatar, 3 = Tuul, 4 = footer
    const firstRow = rows[1];
    const cells = within(firstRow).getAllByRole("cell");
    expect(cells).toHaveLength(6);
    expect(cells[0]).toHaveTextContent("Bat-Erdene");
    expect(cells[1]).toHaveTextContent("12");
    expect(cells[2]).toHaveTextContent("18");
    expect(cells[3]).toHaveTextContent("24");
    expect(cells[4]).toHaveTextContent("₮ 1,200,000");
    expect(cells[5]).toHaveTextContent("₮ 240,000");
  });

  it("footer row sums all numeric columns", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    const rows = screen.getAllByRole("row");
    const footerRow = rows[rows.length - 1];
    const cells = within(footerRow).getAllByRole("cell");

    expect(cells[0]).toHaveTextContent("Total");
    expect(cells[1]).toHaveTextContent("25"); // 12+8+5
    expect(cells[2]).toHaveTextContent("34"); // 18+10+6
    expect(cells[3]).toHaveTextContent("49"); // 24+15+10
    expect(cells[4]).toHaveTextContent("₮ 2,640,000");
    expect(cells[5]).toHaveTextContent("₮ 432,000");
  });

  it("row highlighting for best mechanic shows trophy icon", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    const rows = screen.getAllByRole("row");
    const bestRow = rows[1]; // first mechanic row = Bat-Erdene (top earner)
    const cells = within(bestRow).getAllByRole("cell");

    // Name cell contains a trophy SVG icon
    const nameCell = cells[0];
    const trophySvg = nameCell.querySelector('svg[aria-hidden="true"]');
    expect(trophySvg).toBeInTheDocument();
    expect(trophySvg).toHaveClass("text-amber-500");
  });

  it("null commission shows em-dash instead of value", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    const rows = screen.getAllByRole("row");
    // Tuul is 3rd mechanic (row index 3)
    const tuulRow = rows[3];
    const cells = within(tuulRow).getAllByRole("cell");
    // Last cell = commission, which is null for Tuul
    expect(cells[5].innerHTML).toContain("—");
    // Should not show a currency value for null commission
    expect(cells[5].innerHTML).not.toContain("₮");
  });

  it("export button renders", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    expect(screen.getByTestId("export-button")).toBeInTheDocument();
    expect(screen.getByTestId("export-button")).toHaveTextContent("Export");
  });

  it("avg revenue per WO computed: total_revenue / total_work_orders", () => {
    const data = makeEodReport();
    render(<EodView data={data} t={t} />);

    const cards = screen.getAllByTestId("report-kpi-card");
    // 2nd card (Total Jobs) shows Avg per job subtitle
    const subtitle = within(cards[1] as HTMLElement).queryByTestId(
      "kpi-subtitle",
    );
    expect(subtitle).toHaveTextContent("Avg per job: ₮ 105,600");
  });

  it("handles zero work orders without division error", () => {
    const data = makeEodReport({
      total_work_orders: 0,
      total_revenue: 0,
      total_commission: 0,
    });
    render(<EodView data={data} t={t} />);

    const cards = screen.getAllByTestId("report-kpi-card");
    // Commission card (index 2) has subtitle based on total_commission / max(WOs, 1)
    const subtitle = within(cards[2] as HTMLElement).queryByTestId(
      "kpi-subtitle",
    );
    expect(subtitle).toHaveTextContent("Avg per job: ₮ 0");
  });
});
