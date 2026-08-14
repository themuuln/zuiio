import { render, screen } from "@testing-library/react";
import { DollarSign, TrendingUp } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { StatCard, StatCards } from "@/components/stat-card";

vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total Revenue" value="$1,250.00" />);
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
  });

  it("renders the icon in the label row (vertical, start)", () => {
    const { container } = render(
      <StatCard label="Revenue" value="100" icon={DollarSign} />,
    );
    expect(container.querySelector(".lucide-dollar-sign")).toBeInTheDocument();
  });

  it("renders icon on the right with iconPosition end", () => {
    const { container } = render(
      <StatCard
        label="Revenue"
        value="100"
        icon={DollarSign}
        iconPosition="end"
      />,
    );
    const icon = container.querySelector(".lucide-dollar-sign");
    expect(icon).toBeInTheDocument();
    const labelRow = icon?.closest("div");
    expect(labelRow?.className).toContain("justify-between");
  });

  it("renders the sub hint under the value", () => {
    render(<StatCard label="Jobs" value="12" sub="Completed today" />);
    expect(screen.getByText("Completed today")).toBeInTheDocument();
  });

  it("shows a skeleton value while loading", () => {
    const { container } = render(<StatCard label="Jobs" value="12" loading />);
    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(container.querySelector("[data-slot='skeleton']")).toBeTruthy();
    expect(screen.queryByText("12")).not.toBeInTheDocument();
  });

  it("hides sub and trend while loading", () => {
    const { container } = render(
      <StatCard
        label="Jobs"
        value="12"
        sub="Hidden"
        loading
        trend={{ direction: "up", value: "+5%" }}
      />,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(screen.queryByText("+5%")).not.toBeInTheDocument();
    expect(
      container.querySelector(".lucide-trending-up"),
    ).not.toBeInTheDocument();
  });

  it("renders an up trend row with comparison label", () => {
    render(
      <StatCard
        label="Revenue"
        value="100"
        trend={{ direction: "up", value: "+12.5%", percent: "12.5" }}
        comparisonLabel="vs last month"
      />,
    );
    expect(screen.getByText("+12.5% (12.5)")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders a down trend with destructive color", () => {
    render(
      <StatCard
        label="Revenue"
        value="100"
        trend={{ direction: "down", value: "-20%" }}
      />,
    );
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });

  it("renders a neutral trend", () => {
    render(
      <StatCard
        label="Revenue"
        value="100"
        trend={{ direction: "neutral", value: "0%" }}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders horizontal layout with icon tile", () => {
    const { container } = render(
      <StatCard
        label="Overdue"
        value="3"
        icon={TrendingUp}
        layout="horizontal"
        accent="danger"
      />,
    );
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(container.querySelector(".lucide-trending-up")).toBeInTheDocument();
  });

  it("applies accent classes to the icon tile", () => {
    const { container } = render(
      <StatCard label="Overdue" value="3" icon={TrendingUp} accent="danger" />,
    );
    const icon = container.querySelector(".lucide-trending-up");
    expect(icon?.getAttribute("class")).toContain("text-destructive");
  });

  it("wraps the card in a link when href is provided", () => {
    render(<StatCard label="Revenue" value="100" href="/finance" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/finance");
  });

  it("applies custom value className", () => {
    render(
      <StatCard label="Revenue" value="100" valueClassName="text-red-500" />,
    );
    expect(screen.getByText("100").className).toContain("text-red-500");
  });
});

describe("StatCards", () => {
  it("renders children in a responsive grid (default 4 columns)", () => {
    const { container } = render(
      <StatCards>
        <StatCard label="A" value="1" />
        <StatCard label="B" value="2" />
      </StatCards>,
    );
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("sm:grid-cols-4");
  });

  it("supports 3 columns and custom className", () => {
    const { container } = render(
      <StatCards columns={3} className="my-4">
        <StatCard label="A" value="1" />
      </StatCards>,
    );
    const grid = container.querySelector(".grid");
    expect(grid?.className).toContain("sm:grid-cols-3");
    expect(grid?.className).toContain("my-4");
  });
});
