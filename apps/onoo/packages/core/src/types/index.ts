// Database types and domain type aliases
export type { Database, Json, GameStatus, MembershipRole, MembershipScope, CompetitionType } from "./database";
export type { Tables, TablesInsert, TablesUpdate } from "./database";

import { z } from "zod";
import type { Tables } from "./database";

// Domain type aliases
export type Sport = Tables<"sports">;
export type Organization = Tables<"organizations">;
export type League = Tables<"leagues">;
export type Season = Tables<"seasons">;
export type Competition = Tables<"competitions">;
export type Venue = Tables<"venues">;
export type Team = Tables<"teams">;
export type TeamSeason = Tables<"team_seasons">;
export type Player = Tables<"players">;
export type RosterEntry = Tables<"roster_entries">;
export type Game = Tables<"games">;
export type GameRoster = Tables<"game_rosters">;
export type GameAssignment = Tables<"game_assignments">;
export type StatEventType = Tables<"stat_event_types">;
export type StatEvent = Tables<"stat_events">;
export type Membership = Tables<"memberships">;
export type Profile = Tables<"profiles">;
export type GamePlayerStats = Tables<"game_player_stats">;
export type GameTeamStats = Tables<"game_team_stats">;
export type SeasonPlayerStats = Tables<"season_player_stats">;
export type Standings = Tables<"standings">;
export type AuditLog = Tables<"audit_log">;

// Sport config schema (parsed from sports.config JSONB)
export const SportConfigSchema = z.object({
  periods: z.number(),
  period_minutes: z.number(),
  overtime_minutes: z.number(),
  fouls_to_bonus: z.number(),
  personal_foul_limit: z.number(),
  players_on_court: z.number(),
});
export type SportConfig = z.infer<typeof SportConfigSchema>;

// Box score types (must match game_player_stats columns 1:1)
export interface BoxScoreLine {
  playerId: string;
  teamSeasonId: string;
  secondsPlayed: number | null;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export interface TeamBoxScoreLine {
  teamSeasonId: string;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  teamReb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export interface DeriveWarning {
  eventId: string;
  message: string;
}
