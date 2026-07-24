/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/team-logo", () => ({
  TeamLogo: ({ shortCode }: { shortCode: string }) => (
    <span data-testid="team-logo">{shortCode}</span>
  ),
}));

vi.mock("date-fns-tz", () => ({
  formatInTimeZone: () => "19:00",
}));

import { LiveScoreCard } from "../live-score-card";

const mockGames = [
  {
    id: "g1",
    status: "live_provisional",
    home_team_name: "Хасууд",
    home_team_short_code: "ХАС",
    home_score: 42,
    away_team_name: "Арслангууд",
    away_team_short_code: "АРС",
    away_score: 38,
    home_team_logo_url: null,
    home_team_primary_color: null,
    away_team_logo_url: null,
    away_team_primary_color: null,
    home_team_slug: "khasuud",
    away_team_slug: "arslanuud",
    scheduled_at: "2026-07-22T11:00:00Z",
    venue_name: "Төв",
    competition_name: "L",
    season_id: "s1",
    season_name: "26",
    league_id: "l1",
    league_name: "L",
    league_slug: "l",
    revision_id: "r1",
    revision_number: 1,
    revision_approved_at: "",
    source_submission_id: "ss1",
    source_type: "web",
    evidence_url: null,
    source_reviewer_id: "u1",
    source_reviewed_at: "",
    home_team_season_id: "ts1",
    away_team_season_id: "ts2",
    home_name: "Хасууд",
    home_short: "ХАС",
    home_color: null,
    away_name: "Арслангууд",
    away_short: "АРС",
    away_color: null,
    venue_city: null,
    is_provisional: false,
    home_team_id: "t1",
  },
];

describe("LiveScoreCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when no live games", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const { container } = render(<LiveScoreCard />);
    expect(container.innerHTML).toBe("");
  });

  it("renders live game section when games exist", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGames),
    } as Response);

    render(<LiveScoreCard />);
    expect(await screen.findByText("Шууд тоглолтууд")).toBeInTheDocument();
  });

  it("shows error text on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<LiveScoreCard />);
    expect(
      await screen.findByText("Шууд тоглолтыг ачаалахад алдаа гарлаа"),
    ).toBeInTheDocument();
  });
});
