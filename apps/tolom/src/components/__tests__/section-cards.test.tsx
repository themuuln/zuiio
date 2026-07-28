import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionCards } from "@/components/section-cards";

describe("SectionCards", () => {
  it("renders all four stat cards", () => {
    const { container } = render(<SectionCards />);
    expect(container.querySelectorAll("[data-slot='card']")).toHaveLength(4);
  });

  it("displays Total Revenue with dollar amount", () => {
    render(<SectionCards />);
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
  });

  it("displays New Customers count", () => {
    render(<SectionCards />);
    expect(screen.getByText("New Customers")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("displays Active Accounts count", () => {
    render(<SectionCards />);
    expect(screen.getByText("Active Accounts")).toBeInTheDocument();
    expect(screen.getByText("45,678")).toBeInTheDocument();
  });

  it("displays Growth Rate", () => {
    render(<SectionCards />);
    expect(screen.getByText("Growth Rate")).toBeInTheDocument();
    expect(screen.getByText("4.5%")).toBeInTheDocument();
  });

  it("shows positive badge for Total Revenue", () => {
    render(<SectionCards />);
    // Multiple cards have +12.5% badges
    expect(screen.getAllByText("+12.5%").length).toBeGreaterThanOrEqual(1);
  });

  it("shows negative badge for New Customers", () => {
    render(<SectionCards />);
    expect(screen.getByText("-20%")).toBeInTheDocument();
  });
  it("renders TrendingUp icons on revenue card footer", () => {
    const { container } = render(<SectionCards />);
    const trendingUpIcons = container.querySelectorAll(".lucide-trending-up");
    // Component has TrendingUp in Total Revenue footer + Growth Rate footer
    // badge + possible other locations
    expect(trendingUpIcons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders TrendingDown icon for New Customers", () => {
    const { container } = render(<SectionCards />);
    const trendingDownIcons = container.querySelectorAll(
      ".lucide-trending-down",
    );
    // badge + footer = 2
    expect(trendingDownIcons.length).toBe(2);
  });

  it("shows footer descriptions for each card", () => {
    render(<SectionCards />);
    expect(
      screen.getByText("Visitors for the last 6 months"),
    ).toBeInTheDocument();
    expect(screen.getByText("Acquisition needs attention")).toBeInTheDocument();
    expect(screen.getByText("Engagement exceed targets")).toBeInTheDocument();
    expect(screen.getByText("Meets growth projections")).toBeInTheDocument();
  });
});
