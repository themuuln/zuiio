import { describe, expect, it } from "vitest";
import { z } from "zod";

// ─── leagueSchema ───────────────────────────────────────────────────
// Extracted from src/app/admin/leagues/page.tsx
const leagueSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  slug: z.string().min(1, "Slug оруулна уу"),
  sport_id: z.string().min(1, "Спорт сонгоно уу"),
});

describe("leagueSchema", () => {
  const valid = { name: "NBA", slug: "nba", sport_id: "basketball-id" };

  it("accepts valid data", () => {
    expect(leagueSchema.safeParse(valid).success).toBe(true);
  });

  it("requires name", () => {
    const result = leagueSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("requires slug", () => {
    const result = leagueSchema.safeParse({ ...valid, slug: "" });
    expect(result.success).toBe(false);
  });

  it("requires sport_id", () => {
    const result = leagueSchema.safeParse({ ...valid, sport_id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields entirely", () => {
    const result = leagueSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── seasonSchema ───────────────────────────────────────────────────
// Extracted from src/app/admin/seasons/page.tsx
const seasonSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  starts_on: z.string().optional(),
  ends_on: z.string().optional(),
});

describe("seasonSchema", () => {
  const valid = { name: "2024-25" };

  it("accepts valid data with only required fields", () => {
    expect(seasonSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional date fields", () => {
    const result = seasonSchema.safeParse({
      name: "2024-25",
      starts_on: "2024-10-01",
      ends_on: "2025-05-01",
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = seasonSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = seasonSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("ignores extra fields", () => {
    const result = seasonSchema.safeParse({ ...valid, league_id: "123" });
    expect(result.success).toBe(true);
  });
});

// ─── teamSchema ─────────────────────────────────────────────────────
// Extracted from src/app/admin/teams/page.tsx
const teamSchema = z.object({
  name: z.string().min(1, "Нэр заавал байх ёстой"),
  short_code: z.string().min(1, "Товчлол заавал байх ёстой"),
  slug: z.string().min(1, "Slug заавал байх ёстой"),
  primary_color: z.string().optional(),
});

describe("teamSchema", () => {
  const valid = { name: "Warriors", short_code: "GSW", slug: "warriors" };

  it("accepts valid data", () => {
    expect(teamSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional primary_color", () => {
    const result = teamSchema.safeParse({ ...valid, primary_color: "#1D428A" });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = teamSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("requires short_code", () => {
    const result = teamSchema.safeParse({ ...valid, short_code: "" });
    expect(result.success).toBe(false);
  });

  it("requires slug", () => {
    const result = teamSchema.safeParse({ ...valid, slug: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = teamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── playerSchema ───────────────────────────────────────────────────
// Extracted from src/app/admin/players/page.tsx
const playerSchema = z.object({
  canonical_name: z.string().min(1, "Нэр заавал байх ёстой"),
  name_latin: z.string().optional(),
  position: z.string().optional(),
  nationality: z.string().optional(),
  visibility: z.enum(["public", "hidden"]),
  consent_recorded_at: z.string().optional(),
  consent_note: z.string().optional(),
});

describe("playerSchema", () => {
  const valid = {
    canonical_name: "Stephen Curry",
    visibility: "public" as const,
  };

  it("accepts valid data with only required fields", () => {
    expect(playerSchema.safeParse(valid).success).toBe(true);
  });

  it("requires canonical_name", () => {
    const result = playerSchema.safeParse({ ...valid, canonical_name: "" });
    expect(result.success).toBe(false);
  });

  it("requires visibility", () => {
    const result = playerSchema.safeParse({
      canonical_name: "Stephen Curry",
    });
    expect(result.success).toBe(false);
  });

  it("validates visibility enum accepts 'public'", () => {
    const result = playerSchema.safeParse({ ...valid, visibility: "public" });
    expect(result.success).toBe(true);
  });

  it("validates visibility enum accepts 'hidden'", () => {
    const result = playerSchema.safeParse({ ...valid, visibility: "hidden" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid visibility value", () => {
    const result = playerSchema.safeParse({ ...valid, visibility: "draft" });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = playerSchema.safeParse({
      canonical_name: "Stephen Curry",
      name_latin: "Stephen Curry",
      position: "PG",
      nationality: "USA",
      visibility: "public",
      consent_recorded_at: "2024-01-01",
      consent_note: "Verbal consent",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty optional fields", () => {
    const result = playerSchema.safeParse({
      canonical_name: "Player",
      visibility: "hidden",
    });
    expect(result.success).toBe(true);
  });
});

// ─── gameSchema ─────────────────────────────────────────────────────
// Extracted from src/app/admin/games/page.tsx
const gameSchema = z
  .object({
    competition_id: z.string().min(1),
    home_team_season_id: z.string().min(1),
    away_team_season_id: z.string().min(1),
    venue_id: z.string().optional(),
    scheduled_at: z.string().min(1),
  })
  .refine((d) => d.home_team_season_id !== d.away_team_season_id, {
    message: "Эхлэх ба зочин баг адилхан байж болохгүй",
    path: ["away_team_season_id"],
  });

describe("gameSchema", () => {
  const valid = {
    competition_id: "comp-1",
    home_team_season_id: "ts-home",
    away_team_season_id: "ts-away",
    scheduled_at: "2024-12-25T20:00:00Z",
  };

  it("accepts valid data", () => {
    expect(gameSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional venue_id", () => {
    const result = gameSchema.safeParse({ ...valid, venue_id: "venue-1" });
    expect(result.success).toBe(true);
  });

  it("requires competition_id", () => {
    const result = gameSchema.safeParse({ ...valid, competition_id: "" });
    expect(result.success).toBe(false);
  });

  it("requires home_team_season_id", () => {
    const result = gameSchema.safeParse({ ...valid, home_team_season_id: "" });
    expect(result.success).toBe(false);
  });

  it("requires away_team_season_id", () => {
    const result = gameSchema.safeParse({ ...valid, away_team_season_id: "" });
    expect(result.success).toBe(false);
  });

  it("requires scheduled_at", () => {
    const result = gameSchema.safeParse({ ...valid, scheduled_at: "" });
    expect(result.success).toBe(false);
  });

  it("rejects home === away team", () => {
    const result = gameSchema.safeParse({
      ...valid,
      home_team_season_id: "same-team",
      away_team_season_id: "same-team",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const awayIssue = result.error.issues.find((i) =>
        i.path.includes("away_team_season_id"),
      );
      expect(awayIssue?.message).toBe(
        "Эхлэх ба зочин баг адилхан байж болохгүй",
      );
    }
  });

  it("rejects missing required fields", () => {
    const result = gameSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
