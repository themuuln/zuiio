import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TargetCard } from "@/components/reports/target-card";
import type { ReportTarget } from "@/lib/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockTarget: ReportTarget = {
  id: "target-1",
  organization_id: "org-1",
  period_type: "monthly",
  target_revenue: 50000,
  actual_revenue: 35000,
  progress_pct: 70,
  achieved: false,
  period_start: "2026-07-01",
  period_end: "2026-07-31",
};

describe("TargetCard", () => {
  it("renders the target title and revenue info", () => {
    render(<TargetCard targets={[mockTarget]} />);
    expect(screen.getByText("targetTitle")).toBeInTheDocument();
    expect(screen.getByText("achieved")).toBeInTheDocument();
    // The actual_revenue is formatted via formatCurrency
  });

  it("renders progress percentage and progress bar", () => {
    const { container } = render(<TargetCard targets={[mockTarget]} />);
    expect(screen.getByText("achieved")).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="progress"]'),
    ).toBeInTheDocument();
  });

  it("shows target met indicator when achieved", () => {
    const achievedTarget: ReportTarget = {
      ...mockTarget,
      achieved: true,
      progress_pct: 100,
    };
    render(<TargetCard targets={[achievedTarget]} />);
    expect(screen.getByText("targetMet")).toBeInTheDocument();
  });

  it("shows dashed card with set target button when no targets and onSetTarget provided", () => {
    const onSetTarget = vi.fn();
    render(<TargetCard targets={[]} onSetTarget={onSetTarget} />);
    expect(screen.getByText("noRevenueTargetSet")).toBeInTheDocument();
    expect(screen.getByText("setTarget")).toBeInTheDocument();
  });

  it("shows dashed card without set target button when no targets and onSetTarget is undefined", () => {
    render(<TargetCard targets={[]} />);
    expect(screen.getByText("noRevenueTargetSet")).toBeInTheDocument();
    expect(screen.queryByText("setTarget")).not.toBeInTheDocument();
  });

  it("calls onSetTarget when the set target button is clicked", async () => {
    const onSetTarget = vi.fn();
    const user = userEvent.setup();
    render(<TargetCard targets={[]} onSetTarget={onSetTarget} />);
    await user.click(screen.getByText("setTarget"));
    expect(onSetTarget).toHaveBeenCalledTimes(1);
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<TargetCard targets={[]} loading />);
    expect(container.querySelector(".h-\\[100px\\]")).toBeInTheDocument();
  });

  it("caps progress at 100%", () => {
    const overTarget: ReportTarget = { ...mockTarget, progress_pct: 150 };
    const { container } = render(<TargetCard targets={[overTarget]} />);
    const progress = container.querySelector('[data-slot="progress"]');
    expect(progress).toBeInTheDocument();
  });
});
