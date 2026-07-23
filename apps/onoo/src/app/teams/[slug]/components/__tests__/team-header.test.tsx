/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

import { TeamHeader } from "../team-header";

const baseTeam = {
  id: "t1",
  name: "Хасууд",
  slug: "khasuud",
  logo_url: null,
  primary_color: "#e63946",
  short_code: "ХАС",
  team_season_id: "ts1",
  social_links: {},
};

const baseStandings = {
  team_season_id: "ts1",
  team_name: "Хасууд",
  competition_name: "Test League",
  team_slug: "khasuud",
  w: 5,
  l: 2,
  win_pct: 0.714,
  games_back: 0,
  streak: "W2",
  last10: "7-3",
  points_for: 560,
  points_against: 480,
  team_short_code: "ХАС",
  team_primary_color: "#e63946",
  team_logo_url: null,
};

describe("TeamHeader", () => {
  it("renders team name and short code", () => {
    render(
      <TeamHeader
        team={baseTeam}
        standings={baseStandings}
        form={[]}
        averagePoints={null}
        pointDifference={null}
      />,
    );
    expect(screen.getByText("Хасууд")).toBeInTheDocument();
    // ХАС appears in both short_code label and mocked TeamLogo
    expect(screen.getAllByText("ХАС").length).toBeGreaterThanOrEqual(1);
  });

  it("renders W-L record and win percentage", () => {
    render(
      <TeamHeader
        team={baseTeam}
        standings={baseStandings}
        form={[]}
        averagePoints={80}
        pointDifference={80}
      />,
    );
    expect(screen.getByText("5-2")).toBeInTheDocument();
    expect(screen.getByText("71.4%")).toBeInTheDocument();
    expect(screen.getByText("Test League")).toBeInTheDocument();
  });

  it("renders form guide dots", () => {
    render(
      <TeamHeader
        team={baseTeam}
        standings={baseStandings}
        form={[
          { gameId: "g1", result: "W" },
          { gameId: "g2", result: "L" },
          { gameId: "g3", result: "W" },
        ]}
        averagePoints={null}
        pointDifference={null}
      />,
    );
    expect(screen.getByText("Форм:")).toBeInTheDocument();
    const dots = document.querySelectorAll(".rounded-full");
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it("renders placeholder text when no standings", () => {
    render(
      <TeamHeader
        team={baseTeam}
        standings={undefined}
        form={[]}
        averagePoints={null}
        pointDifference={null}
      />,
    );
    expect(
      screen.getByText("Баталгаажсан улирлын бүртгэл хүлээгдэж байна"),
    ).toBeInTheDocument();
  });

  it("shows emerald class for win dot and red class for loss dot", () => {
    render(
      <TeamHeader
        team={baseTeam}
        standings={baseStandings}
        form={[
          { gameId: "g1", result: "W" },
          { gameId: "g2", result: "L" },
        ]}
        averagePoints={null}
        pointDifference={null}
      />,
    );
    const dots = document.querySelectorAll(".rounded-full");
    expect(dots[0]?.classList.contains("bg-emerald-500")).toBe(true);
    expect(dots[1]?.classList.contains("bg-red-400")).toBe(true);
  });

  it("shows color accent band at top when primary_color is set", () => {
    const { container } = render(
      <TeamHeader
        team={baseTeam}
        standings={baseStandings}
        form={[]}
        averagePoints={null}
        pointDifference={null}
      />,
    );
    const band = container.querySelector(".h-1\\.5");
    expect(band).toBeInTheDocument();
  });

  it("shows stat blocks with wins, form, and score diff", () => {
    render(
      <TeamHeader
        team={baseTeam}
        standings={baseStandings}
        form={[]}
        averagePoints={80}
        pointDifference={80}
      />,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("7-3")).toBeInTheDocument();
    expect(screen.getByText("+80")).toBeInTheDocument();
  });
});
