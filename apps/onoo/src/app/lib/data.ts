/**
 * Data layer for Onoo public pages.
 *
 * Seed data matches supabase/seed.sql UUIDs exactly.
 * In production, these will be replaced with Supabase queries;
 * mock data ensures pages render without a running database.
 */

import { createClient } from "@/lib/supabase/server";
import type { Game, Player, Team, Venue, Standings, GamePlayerStats, SeasonPlayerStats } from "./types"

// ---------------------------------------------------------------------------
// Seed constants (match supabase/seed.sql)
// ---------------------------------------------------------------------------

const COMPETITION_ID = "e0000000-0000-0000-0000-000000000001";
const VENUE_ID = "f0000000-0000-0000-0000-000000000001";

// ---------------------------------------------------------------------------
// Mock data — used as fallback when Supabase is unavailable
// ---------------------------------------------------------------------------

const MOCK_TEAMS: (Team & { team_season_id: string })[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    league_id: "c0000000-0000-0000-0000-000000000001",
    name: "Хасын одод",
    short_code: "ХАС",
    slug: "team-a",
    primary_color: "#E63946",
    logo_url: null,
    created_at: "2026-09-01T00:00:00Z",
    team_season_id: "30000000-0000-0000-0000-000000000001",
  },
  {
    id: "20000000-0000-0000-0000-000000000001",
    league_id: "c0000000-0000-0000-0000-000000000001",
    name: "Тэнгэрийн зүүд",
    short_code: "ТЭЗ",
    slug: "team-b",
    primary_color: "#457B9D",
    logo_url: null,
    created_at: "2026-09-01T00:00:00Z",
    team_season_id: "40000000-0000-0000-0000-000000000001",
  },
];

const MOCK_PLAYERS: (Player & {
  jersey_number: number;
  roster_team_season_id: string;
})[] = [
  // Team A players
  {
    id: "50000000-0000-0000-0000-000000000001",
    canonical_name: "Бат-Эрдэнэ",
    name_latin: "Bat-Erdene",
    dob: "1998-03-15",
    height_cm: 180,
    weight_kg: 78,
    position: "PG",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 1,
    roster_team_season_id: "30000000-0000-0000-0000-000000000001",
  },
  {
    id: "50000000-0000-0000-0000-000000000002",
    canonical_name: "Мөнх-Түвшин",
    name_latin: "Munkh-Tuvshin",
    dob: "1999-07-22",
    height_cm: 188,
    weight_kg: 85,
    position: "SG",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 2,
    roster_team_season_id: "30000000-0000-0000-0000-000000000001",
  },
  {
    id: "50000000-0000-0000-0000-000000000003",
    canonical_name: "Оюун-Эрдэнэ",
    name_latin: "Oyun-Erdene",
    dob: "2000-01-10",
    height_cm: 195,
    weight_kg: 92,
    position: "SF",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 3,
    roster_team_season_id: "30000000-0000-0000-0000-000000000001",
  },
  {
    id: "50000000-0000-0000-0000-000000000004",
    canonical_name: "Баярсайхан",
    name_latin: "Bayarsaikhan",
    dob: "1997-11-05",
    height_cm: 200,
    weight_kg: 100,
    position: "PF",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 4,
    roster_team_season_id: "30000000-0000-0000-0000-000000000001",
  },
  {
    id: "50000000-0000-0000-0000-000000000005",
    canonical_name: "Ганбаатар",
    name_latin: "Ganbaatar",
    dob: "1996-06-18",
    height_cm: 205,
    weight_kg: 110,
    position: "C",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 5,
    roster_team_season_id: "30000000-0000-0000-0000-000000000001",
  },
  // Team B players (first 5)
  {
    id: "60000000-0000-0000-0000-000000000001",
    canonical_name: "Тэмүүлэн",
    name_latin: "Temuulen",
    dob: "2001-04-12",
    height_cm: 182,
    weight_kg: 80,
    position: "PG",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 1,
    roster_team_season_id: "40000000-0000-0000-0000-000000000001",
  },
  {
    id: "60000000-0000-0000-0000-000000000002",
    canonical_name: "Алтанцэцэг",
    name_latin: "Altantsetseg",
    dob: "1999-09-30",
    height_cm: 190,
    weight_kg: 88,
    position: "SG",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 2,
    roster_team_season_id: "40000000-0000-0000-0000-000000000001",
  },
  {
    id: "60000000-0000-0000-0000-000000000003",
    canonical_name: "Болд",
    name_latin: "Bold",
    dob: "1998-12-25",
    height_cm: 196,
    weight_kg: 95,
    position: "SF",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 3,
    roster_team_season_id: "40000000-0000-0000-0000-000000000001",
  },
  {
    id: "60000000-0000-0000-0000-000000000004",
    canonical_name: "Наран",
    name_latin: "Naran",
    dob: "1997-02-14",
    height_cm: 202,
    weight_kg: 105,
    position: "PF",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 4,
    roster_team_season_id: "40000000-0000-0000-0000-000000000001",
  },
  {
    id: "60000000-0000-0000-0000-000000000005",
    canonical_name: "Цогт",
    name_latin: "Tsogt",
    dob: "1996-08-08",
    height_cm: 208,
    weight_kg: 112,
    position: "C",
    nationality: "MN",
    photo_url: null,
    user_id: null,
    created_at: "2026-09-01T00:00:00Z",
    jersey_number: 5,
    roster_team_season_id: "40000000-0000-0000-0000-000000000001",
  },
];

const MOCK_VENUE: Venue = {
  id: VENUE_ID,
  name: "БГД Спорт Цогцолбор",
  city: "Улаанбаатар",
  capacity: 5000,
  created_at: "2026-09-01T00:00:00Z",
};

function buildMockGames(dateStr: string): (Game & {
  home_name: string;
  home_short: string;
  home_color: string | null;
  away_name: string;
  away_short: string;
  away_color: string | null;
  venue_name: string;
  venue_city: string | null;
})[] {
  const baseGames: (Game & {
    home_name: string;
    home_short: string;
    home_color: string | null;
    away_name: string;
    away_short: string;
    away_color: string | null;
    venue_name: string;
    venue_city: string | null;
  })[] = [
    {
      id: "70000000-0000-0000-0000-000000000001",
      competition_id: COMPETITION_ID,
      home_team_season_id: "30000000-0000-0000-0000-000000000001",
      away_team_season_id: "40000000-0000-0000-0000-000000000001",
      venue_id: VENUE_ID,
      scheduled_at: `${dateStr}T18:00:00+08:00`,
      status: "scheduled" as const,
      current_period: 0,
      home_score: null,
      away_score: null,
      created_at: "2026-09-01T00:00:00Z",
      home_name: "Хасын одод",
      home_short: "ХАС",
      home_color: "#E63946",
      away_name: "Тэнгэрийн зүүд",
      away_short: "ТЭЗ",
      away_color: "#457B9D",
      venue_name: "БГД Спорт Цогцолбор",
      venue_city: "Улаанбаатар",
    },
    {
      id: "70000000-0000-0000-0000-000000000002",
      competition_id: COMPETITION_ID,
      home_team_season_id: "30000000-0000-0000-0000-000000000001",
      away_team_season_id: "40000000-0000-0000-0000-000000000001",
      venue_id: VENUE_ID,
      scheduled_at: `${dateStr}T15:00:00+08:00`,
      status: "final" as const,
      current_period: 4,
      home_score: 87,
      away_score: 82,
      created_at: "2026-09-01T00:00:00Z",
      home_name: "Хасын одод",
      home_short: "ХАС",
      home_color: "#E63946",
      away_name: "Тэнгэрийн зүүд",
      away_short: "ТЭЗ",
      away_color: "#457B9D",
      venue_name: "БГД Спорт Цогцолбор",
      venue_city: "Улаанбаатар",
    },
  ];

  // On some dates, add a live game for the demo
  if (dateStr === new Date().toISOString().slice(0, 10)) {
    baseGames.unshift({
      id: "70000000-0000-0000-0000-000000000003",
      competition_id: COMPETITION_ID,
      home_team_season_id: "40000000-0000-0000-0000-000000000001",
      away_team_season_id: "30000000-0000-0000-0000-000000000001",
      venue_id: VENUE_ID,
      scheduled_at: `${dateStr}T19:30:00+08:00`,
      status: "live" as const,
      current_period: 3,
      home_score: 54,
      away_score: 51,
      created_at: "2026-09-01T00:00:00Z",
      home_name: "Тэнгэрийн зүүд",
      home_short: "ТЭЗ",
      home_color: "#457B9D",
      away_name: "Хасын одод",
      away_short: "ХАС",
      away_color: "#E63946",
      venue_name: "БГД Спорт Цогцолбор",
      venue_city: "Улаанбаатар",
    });
  }

  return baseGames;
}

const MOCK_STANDINGS: (Standings & {
  team_name: string;
  team_short: string;
  team_color: string | null;
  team_slug: string;
})[] = [
  {
    competition_id: COMPETITION_ID,
    team_season_id: "30000000-0000-0000-0000-000000000001",
    wins: 12,
    losses: 3,
    win_pct: 0.8,
    gb: 0,
    streak: "W5",
    last10: "8-2",
    points_for: 1245,
    points_against: 1098,
    team_name: "Хасын одод",
    team_short: "ХАС",
    team_color: "#E63946",
    team_slug: "team-a",
  },
  {
    competition_id: COMPETITION_ID,
    team_season_id: "40000000-0000-0000-0000-000000000001",
    wins: 10,
    losses: 5,
    win_pct: 0.667,
    gb: 2,
    streak: "L1",
    last10: "6-4",
    points_for: 1180,
    points_against: 1120,
    team_name: "Тэнгэрийн зүүд",
    team_short: "ТЭЗ",
    team_color: "#457B9D",
    team_slug: "team-b",
  },
  {
    competition_id: COMPETITION_ID,
    team_season_id: "50000000-0000-0000-0000-000000000001",
    wins: 8,
    losses: 7,
    win_pct: 0.533,
    gb: 4,
    streak: "W2",
    last10: "5-5",
    points_for: 1150,
    points_against: 1135,
    team_name: "Галын шуурга",
    team_short: "ГАШ",
    team_color: "#2A9D8F",
    team_slug: "team-c",
  },
  {
    competition_id: COMPETITION_ID,
    team_season_id: "60000000-0000-0000-0000-000000000001",
    wins: 7,
    losses: 8,
    win_pct: 0.467,
    gb: 5,
    streak: "L3",
    last10: "4-6",
    points_for: 1110,
    points_against: 1140,
    team_name: "Үүлийн чимээ",
    team_short: "ҮҮЧ",
    team_color: "#9B5DE5",
    team_slug: "team-d",
  },
  {
    competition_id: COMPETITION_ID,
    team_season_id: "70000000-0000-0000-0000-000000000001",
    wins: 5,
    losses: 10,
    win_pct: 0.333,
    gb: 7,
    streak: "L2",
    last10: "3-7",
    points_for: 1050,
    points_against: 1190,
    team_name: "Наран туяа",
    team_short: "НАТ",
    team_color: "#F4A261",
    team_slug: "team-e",
  },
  {
    competition_id: COMPETITION_ID,
    team_season_id: "80000000-0000-0000-0000-000000000001",
    wins: 3,
    losses: 12,
    win_pct: 0.2,
    gb: 9,
    streak: "L5",
    last10: "2-8",
    points_for: 980,
    points_against: 1220,
    team_name: "Хар салхи",
    team_short: "ХАС",
    team_color: "#264653",
    team_slug: "team-f",
  },
];

const MOCK_GAME_PLAYER_STATS: (GamePlayerStats & {
  player_name: string;
  player_latin: string | null;
  team_short: string;
})[] = [
  // Game 1 (final) — Team A players
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "50000000-0000-0000-0000-000000000001",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    seconds_played: 1800,
    pts: 24,
    fgm: 9,
    fga: 18,
    tpm: 3,
    tpa: 7,
    ftm: 3,
    fta: 4,
    oreb: 1,
    dreb: 4,
    ast: 8,
    stl: 2,
    blk: 0,
    tov: 3,
    pf: 2,
    player_name: "Бат-Эрдэнэ",
    player_latin: "Bat-Erdene",
    team_short: "ХАС",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "50000000-0000-0000-0000-000000000002",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    seconds_played: 1680,
    pts: 18,
    fgm: 7,
    fga: 14,
    tpm: 2,
    tpa: 5,
    ftm: 2,
    fta: 2,
    oreb: 2,
    dreb: 3,
    ast: 4,
    stl: 1,
    blk: 1,
    tov: 2,
    pf: 3,
    player_name: "Мөнх-Түвшин",
    player_latin: "Munkh-Tuvshin",
    team_short: "ХАС",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "50000000-0000-0000-0000-000000000003",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    seconds_played: 1620,
    pts: 16,
    fgm: 6,
    fga: 12,
    tpm: 1,
    tpa: 3,
    ftm: 3,
    fta: 4,
    oreb: 3,
    dreb: 7,
    ast: 2,
    stl: 1,
    blk: 2,
    tov: 1,
    pf: 1,
    player_name: "Оюун-Эрдэнэ",
    player_latin: "Oyun-Erdene",
    team_short: "ХАС",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "50000000-0000-0000-0000-000000000004",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    seconds_played: 1560,
    pts: 14,
    fgm: 5,
    fga: 10,
    tpm: 0,
    tpa: 1,
    ftm: 4,
    fta: 6,
    oreb: 4,
    dreb: 6,
    ast: 1,
    stl: 0,
    blk: 1,
    tov: 2,
    pf: 4,
    player_name: "Баярсайхан",
    player_latin: "Bayarsaikhan",
    team_short: "ХАС",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "50000000-0000-0000-0000-000000000005",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    seconds_played: 1440,
    pts: 15,
    fgm: 6,
    fga: 9,
    tpm: 0,
    tpa: 0,
    ftm: 3,
    fta: 4,
    oreb: 5,
    dreb: 8,
    ast: 1,
    stl: 0,
    blk: 3,
    tov: 1,
    pf: 2,
    player_name: "Ганбаатар",
    player_latin: "Ganbaatar",
    team_short: "ХАС",
  },
  // Team B players
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "60000000-0000-0000-0000-000000000001",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    seconds_played: 1740,
    pts: 22,
    fgm: 8,
    fga: 17,
    tpm: 4,
    tpa: 9,
    ftm: 2,
    fta: 2,
    oreb: 1,
    dreb: 3,
    ast: 6,
    stl: 3,
    blk: 0,
    tov: 4,
    pf: 2,
    player_name: "Тэмүүлэн",
    player_latin: "Temuulen",
    team_short: "ТЭЗ",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "60000000-0000-0000-0000-000000000002",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    seconds_played: 1500,
    pts: 15,
    fgm: 6,
    fga: 13,
    tpm: 1,
    tpa: 4,
    ftm: 2,
    fta: 3,
    oreb: 2,
    dreb: 5,
    ast: 3,
    stl: 1,
    blk: 0,
    tov: 2,
    pf: 3,
    player_name: "Алтанцэцэг",
    player_latin: "Altantsetseg",
    team_short: "ТЭЗ",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "60000000-0000-0000-0000-000000000003",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    seconds_played: 1620,
    pts: 18,
    fgm: 7,
    fga: 15,
    tpm: 2,
    tpa: 6,
    ftm: 2,
    fta: 2,
    oreb: 3,
    dreb: 5,
    ast: 2,
    stl: 0,
    blk: 1,
    tov: 3,
    pf: 2,
    player_name: "Болд",
    player_latin: "Bold",
    team_short: "ТЭЗ",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "60000000-0000-0000-0000-000000000004",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    seconds_played: 1380,
    pts: 12,
    fgm: 5,
    fga: 11,
    tpm: 0,
    tpa: 2,
    ftm: 2,
    fta: 4,
    oreb: 4,
    dreb: 7,
    ast: 1,
    stl: 1,
    blk: 2,
    tov: 2,
    pf: 4,
    player_name: "Наран",
    player_latin: "Naran",
    team_short: "ТЭЗ",
  },
  {
    game_id: "70000000-0000-0000-0000-000000000002",
    player_id: "60000000-0000-0000-0000-000000000005",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    seconds_played: 1500,
    pts: 15,
    fgm: 6,
    fga: 10,
    tpm: 0,
    tpa: 0,
    ftm: 3,
    fta: 5,
    oreb: 6,
    dreb: 9,
    ast: 1,
    stl: 0,
    blk: 2,
    tov: 1,
    pf: 1,
    player_name: "Цогт",
    player_latin: "Tsogt",
    team_short: "ТЭЗ",
  },
];

const MOCK_SEASON_PLAYER_STATS: (SeasonPlayerStats & {
  player_name: string;
  player_latin: string | null;
  team_name: string;
  team_short: string;
  team_color: string | null;
})[] = [
  {
    competition_id: COMPETITION_ID,
    player_id: "50000000-0000-0000-0000-000000000001",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    gp: 15, mpg: 32.4, pts: 21.2, fgm: 7.8, fga: 15.6,
    tpm: 2.8, tpa: 6.4, ftm: 2.8, fta: 3.6,
    oreb: 1.2, dreb: 4.1, ast: 7.3, stl: 2.1, blk: 0.3, tov: 2.8, pf: 2.4,
    player_name: "Бат-Эрдэнэ", player_latin: "Bat-Erdene",
    team_name: "Хасын одод", team_short: "ХАС", team_color: "#E63946",
  },
  {
    competition_id: COMPETITION_ID,
    player_id: "50000000-0000-0000-0000-000000000002",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    gp: 14, mpg: 28.6, pts: 16.5, fgm: 6.2, fga: 13.1,
    tpm: 2.1, tpa: 5.3, ftm: 2.0, fta: 2.8,
    oreb: 1.8, dreb: 3.5, ast: 3.8, stl: 1.4, blk: 0.8, tov: 2.2, pf: 2.6,
    player_name: "Мөнх-Түвшин", player_latin: "Munkh-Tuvshin",
    team_name: "Хасын одод", team_short: "ХАС", team_color: "#E63946",
  },
  {
    competition_id: COMPETITION_ID,
    player_id: "60000000-0000-0000-0000-000000000001",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    gp: 15, mpg: 34.1, pts: 19.8, fgm: 7.2, fga: 15.0,
    tpm: 3.5, tpa: 8.2, ftm: 1.9, fta: 2.4,
    oreb: 1.0, dreb: 3.2, ast: 5.9, stl: 2.5, blk: 0.2, tov: 3.1, pf: 1.8,
    player_name: "Тэмүүлэн", player_latin: "Temuulen",
    team_name: "Тэнгэрийн зүүд", team_short: "ТЭЗ", team_color: "#457B9D",
  },
  {
    competition_id: COMPETITION_ID,
    player_id: "60000000-0000-0000-0000-000000000003",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    gp: 14, mpg: 30.2, pts: 17.1, fgm: 6.5, fga: 13.8,
    tpm: 2.3, tpa: 5.9, ftm: 1.8, fta: 2.6,
    oreb: 2.1, dreb: 5.3, ast: 2.4, stl: 1.1, blk: 1.2, tov: 2.5, pf: 2.2,
    player_name: "Болд", player_latin: "Bold",
    team_name: "Тэнгэрийн зүүд", team_short: "ТЭЗ", team_color: "#457B9D",
  },
  {
    competition_id: COMPETITION_ID,
    player_id: "50000000-0000-0000-0000-000000000003",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    gp: 15, mpg: 29.8, pts: 14.3, fgm: 5.4, fga: 11.2,
    tpm: 1.6, tpa: 4.0, ftm: 1.9, fta: 3.0,
    oreb: 2.5, dreb: 6.8, ast: 1.9, stl: 0.9, blk: 1.5, tov: 1.8, pf: 2.0,
    player_name: "Оюун-Эрдэнэ", player_latin: "Oyun-Erdene",
    team_name: "Хасын одод", team_short: "ХАС", team_color: "#E63946",
  },
  {
    competition_id: COMPETITION_ID,
    player_id: "50000000-0000-0000-0000-000000000005",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    gp: 15, mpg: 26.4, pts: 13.8, fgm: 5.6, fga: 9.2,
    tpm: 0.2, tpa: 0.4, ftm: 2.4, fta: 3.6,
    oreb: 4.2, dreb: 7.1, ast: 1.0, stl: 0.4, blk: 2.8, tov: 1.2, pf: 2.5,
    player_name: "Ганбаатар", player_latin: "Ganbaatar",
    team_name: "Хасын одод", team_short: "ХАС", team_color: "#E63946",
  },
  {
    competition_id: COMPETITION_ID,
    player_id: "60000000-0000-0000-0000-000000000005",
    team_season_id: "40000000-0000-0000-0000-000000000001",
    gp: 15, mpg: 28.0, pts: 12.6, fgm: 5.0, fga: 9.4,
    tpm: 0.1, tpa: 0.3, ftm: 2.5, fta: 3.8,
    oreb: 4.8, dreb: 8.2, ast: 0.9, stl: 0.5, blk: 2.4, tov: 1.5, pf: 2.0,
    player_name: "Цогт", player_latin: "Tsogt",
    team_name: "Тэнгэрийн зүүд", team_short: "ТЭЗ", team_color: "#457B9D",
  },
  {
    competition_id: COMPETITION_ID,
    player_id: "50000000-0000-0000-0000-000000000004",
    team_season_id: "30000000-0000-0000-0000-000000000001",
    gp: 13, mpg: 25.0, pts: 12.1, fgm: 4.8, fga: 9.8,
    tpm: 0.3, tpa: 1.0, ftm: 2.2, fta: 3.4,
    oreb: 3.1, dreb: 5.8, ast: 1.2, stl: 0.6, blk: 1.0, tov: 1.9, pf: 3.2,
    player_name: "Баярсайхан", player_latin: "Bayarsaikhan",
    team_name: "Хасын одод", team_short: "ХАС", team_color: "#E63946",
  },
];

const MOCK_PLAY_BY_PLAY: {
  id: string;
  event_type: string;
  period: number;
  clock_seconds: number;
  team_short: string;
  player_name: string;
  detail: string;
}[] = [
  { id: "e1", event_type: "shot_2pt_made", period: 3, clock_seconds: 480, team_short: "ТЭЗ", player_name: "Тэмүүлэн", detail: "2PT Jump Shot" },
  { id: "e2", event_type: "rebound_def", period: 3, clock_seconds: 465, team_short: "ХАС", player_name: "Бат-Эрдэнэ", detail: "Defensive Rebound" },
  { id: "e3", event_type: "shot_3pt_made", period: 3, clock_seconds: 440, team_short: "ХАС", player_name: "Мөнх-Түвшин", detail: "3PT Jump Shot (Assist: Бат-Эрдэнэ)" },
  { id: "e4", event_type: "turnover", period: 3, clock_seconds: 415, team_short: "ТЭЗ", player_name: "Болд", detail: "Lost Ball" },
  { id: "e5", event_type: "steal", period: 3, clock_seconds: 415, team_short: "ХАС", player_name: "Оюун-Эрдэнэ", detail: "Steal" },
  { id: "e6", event_type: "shot_2pt_made", period: 3, clock_seconds: 400, team_short: "ХАС", player_name: "Оюун-Эрдэнэ", detail: "Driving Layup" },
  { id: "e7", event_type: "foul_personal", period: 3, clock_seconds: 385, team_short: "ХАС", player_name: "Ганбаатар", detail: "Personal Foul (1st)" },
  { id: "e8", event_type: "ft_made", period: 3, clock_seconds: 380, team_short: "ТЭЗ", player_name: "Тэмүүлэн", detail: "Free Throw 1 of 2" },
  { id: "e9", event_type: "ft_missed", period: 3, clock_seconds: 378, team_short: "ТЭЗ", player_name: "Тэмүүлэн", detail: "Free Throw 2 of 2" },
  { id: "e10", event_type: "rebound_off", period: 3, clock_seconds: 378, team_short: "ТЭЗ", player_name: "Цогт", detail: "Offensive Rebound" },
  { id: "e11", event_type: "shot_2pt_made", period: 3, clock_seconds: 360, team_short: "ТЭЗ", player_name: "Цогт", detail: "Putback Layup" },
  { id: "e12", event_type: "block", period: 3, clock_seconds: 340, team_short: "ТЭЗ", player_name: "Наран", detail: "Block on Баярсайхан" },
];

// ---------------------------------------------------------------------------
// Public query functions (fallback to mock data)
// ---------------------------------------------------------------------------

type GameWithTeams = Game & {
  home_name: string;
  home_short: string;
  home_color: string | null;
  away_name: string;
  away_short: string;
  away_color: string | null;
  venue_name: string;
  venue_city: string | null;
};

type StandingRow = Standings & {
  team_name: string;
  team_short: string;
  team_color: string | null;
  team_slug: string;
};

type SeasonPlayerStatRow = SeasonPlayerStats & {
  player_name: string;
  player_latin: string | null;
  team_name: string;
  team_short: string;
  team_color: string | null;
};

type GamePlayerStatRow = GamePlayerStats & {
  player_name: string;
  player_latin: string | null;
  team_short: string;
};

async function trySupabase<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function getGamesByDate(dateStr: string): Promise<GameWithTeams[]> {
  const data = await trySupabase(async () => {
    const supabase = await createClient();
    const { data: games, error } = await supabase
      .from("games")
      .select(`
        *,
        home_team:team_seasons!home_team_season_id(team:teams(name, short_code, primary_color)),
        away_team:team_seasons!away_team_season_id(team:teams(name, short_code, primary_color)),
        venue:venues(name, city)
      `)
      .gte("scheduled_at", `${dateStr}T00:00:00`)
      .lt("scheduled_at", `${dateStr}T23:59:59`)
      .order("scheduled_at");

    if (error || !games) return null;

    return games.map((g: Record<string, unknown>) => ({
      ...g,
      home_name: ((g.home_team as Record<string, Record<string, string>>)?.team)?.name ?? "",
      home_short: ((g.home_team as Record<string, Record<string, string>>)?.team)?.short_code ?? "",
      home_color: ((g.home_team as Record<string, Record<string, string>>)?.team)?.primary_color ?? null,
      away_name: ((g.away_team as Record<string, Record<string, string>>)?.team)?.name ?? "",
      away_short: ((g.away_team as Record<string, Record<string, string>>)?.team)?.short_code ?? "",
      away_color: ((g.away_team as Record<string, Record<string, string>>)?.team)?.primary_color ?? null,
      venue_name: (g.venue as Record<string, string>)?.name ?? "",
      venue_city: (g.venue as Record<string, string>)?.city ?? null,
    })) as GameWithTeams[];
  });

  return data ?? buildMockGames(dateStr);
}

export async function getLiveGames(): Promise<GameWithTeams[]> {
  const today = new Date().toISOString().slice(0, 10);
  const allGames = await getGamesByDate(today);
  return allGames.filter((g) => g.status === "live");
}

export async function getGameById(
  id: string,
): Promise<GameWithTeams | null> {
  const data = await trySupabase(async () => {
    const supabase = await createClient();
    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single();
    return game as GameWithTeams | null;
  });

  if (data) return data;

  // Try mock data
  const allGames = buildMockGames(new Date().toISOString().slice(0, 10));
  return allGames.find((g) => g.id === id) ?? null;
}

export async function getStandings(): Promise<StandingRow[]> {
  const data = await trySupabase(async () => {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("standings")
      .select(`
        *,
        team_season:team_seasons(team:teams(name, short_code, primary_color, slug))
      `)
      .eq("competition_id", COMPETITION_ID)
      .order("win_pct", { ascending: false });

    if (!rows) return null;

    return rows.map((r: Record<string, unknown>) => ({
      ...r,
      team_name: ((r.team_season as Record<string, unknown>)?.team as Record<string, string>)?.name ?? "",
      team_short: "",
      team_color: null,
      team_slug: "",
    })) as StandingRow[];
  });

  return data ?? MOCK_STANDINGS;
}

export async function getTeamBySlug(
  slug: string,
): Promise<{
  team: (typeof MOCK_TEAMS)[number];
  players: typeof MOCK_PLAYERS;
  standings: StandingRow | undefined;
} | null> {
  const team = MOCK_TEAMS.find((t) => t.slug === slug);
  if (!team) return null;

  const players = MOCK_PLAYERS.filter(
    (p) => p.roster_team_season_id === team.team_season_id,
  );

  const standings = MOCK_STANDINGS.find(
    (s) => s.team_season_id === team.team_season_id,
  );

  return { team, players, standings };
}

export async function getPlayerById(
  id: string,
): Promise<{
  player: (typeof MOCK_PLAYERS)[number];
  seasonStats: SeasonPlayerStatRow[];
  gameLog: GamePlayerStatRow[];
} | null> {
  const player = MOCK_PLAYERS.find((p) => p.id === id);
  if (!player) return null;

  const seasonStats = MOCK_SEASON_PLAYER_STATS.filter(
    (s) => s.player_id === id,
  );

  const gameLog = MOCK_GAME_PLAYER_STATS.filter((g) => g.player_id === id);

  return { player, seasonStats, gameLog };
}

export async function getLeaders(): Promise<SeasonPlayerStatRow[]> {
  return MOCK_SEASON_PLAYER_STATS;
}

export async function getPlayByPlay(gameId: string) {
  if (gameId === "70000000-0000-0000-0000-000000000003") {
    return MOCK_PLAY_BY_PLAY;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatGameTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMinutes(seconds: number | null): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "Товлосон",
    live: "Шууд",
    final: "Дууссан",
    verified: "Баталгаажуулсан",
    official: "Албан ёсны",
    cancelled: "Цуцалсан",
    postponed: "Хойшлогдсон",
  };
  return labels[status] ?? status;
}

export function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "live") return "destructive";
  if (status === "final" || status === "verified") return "secondary";
  return "outline";
}
