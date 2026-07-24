/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockGetPlayerCanonicalIdentity = vi.fn<(...args: unknown[]) => unknown>();
const mockGetAthleteTimeline = vi.fn<(...args: unknown[]) => unknown>();

vi.mock("@/app/lib/data", () => ({
  getPlayerCanonicalIdentity: (...args: unknown[]) =>
    mockGetPlayerCanonicalIdentity(...args),
  getAthleteTimeline: (...args: unknown[]) => mockGetAthleteTimeline(...args),
}));

import { AthleteTimeline } from "../athlete-timeline";

function createGameEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_type: "game",
    entity_id: "player-1",
    event_id: "game-1",
    event_date: "2026-07-01T10:00:00Z",
    competition_name: "Summer League",
    player_team_name: "Dragons",
    opponent_name: "Warriors",
    home_score: 85,
    away_score: 72,
    pts: 20,
    assists: 5,
    total_rebounds: 8,
    program_name: null,
    event_label: null,
    ...overrides,
  };
}

function createEnrollmentEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_type: "enrollment",
    entity_id: "student-1",
    event_id: "enroll-1",
    event_date: "2026-06-15T00:00:00Z",
    competition_name: "U15 Program",
    player_team_name: null,
    opponent_name: null,
    home_score: null,
    away_score: null,
    pts: null,
    assists: null,
    total_rebounds: null,
    program_name: "U15 Development",
    event_label: "Бүртгүүлсэн",
    ...overrides,
  };
}

describe("AthleteTimeline", () => {
  beforeEach(() => {
    mockGetPlayerCanonicalIdentity.mockResolvedValue("canonical-id-1");
    mockGetAthleteTimeline.mockResolvedValue([]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no canonical identity", async () => {
    mockGetPlayerCanonicalIdentity.mockResolvedValue(null);
    expect(await AthleteTimeline({ playerId: "p-1" })).toBeNull();
  });

  it("returns null when no events", async () => {
    const { container } = render(await AthleteTimeline({ playerId: "p-1" }));
    expect(container.firstChild).toBeNull();
  });

  it("renders game events", async () => {
    mockGetAthleteTimeline.mockResolvedValue([createGameEvent()]);
    render(await AthleteTimeline({ playerId: "p-1" }));
    expect(screen.getByText("Тоглолт")).toBeInTheDocument();
    expect(screen.getByText(/PTS: 20/)).toBeInTheDocument();
  });

  it("renders enrollment events", async () => {
    mockGetAthleteTimeline.mockResolvedValue([createEnrollmentEvent()]);
    render(await AthleteTimeline({ playerId: "p-1" }));
    expect(screen.getByText("Бүртгэл")).toBeInTheDocument();
    expect(screen.getByText("U15 Development")).toBeInTheDocument();
  });

  it("renders mixed events", async () => {
    mockGetAthleteTimeline.mockResolvedValue([
      createGameEvent(),
      createEnrollmentEvent(),
    ]);
    render(await AthleteTimeline({ playerId: "p-1" }));
    expect(screen.getByText("Тоглолт")).toBeInTheDocument();
    expect(screen.getByText("Бүртгэл")).toBeInTheDocument();
  });

  it("uses English locale", async () => {
    mockGetAthleteTimeline.mockResolvedValue([createGameEvent()]);
    render(await AthleteTimeline({ playerId: "p-1", locale: "en" }));
    expect(screen.getByText("Game")).toBeInTheDocument();
  });
});
