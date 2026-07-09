import type { Tables } from "../../../../packages/core/src/types/database";

// Re-export domain types for admin pages
export type Sport = Tables<"sports">;
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

// Joined types for admin views
export interface LeagueWithSport extends League {
  sports: Sport;
}

export interface SeasonWithLeague extends Season {
  leagues: League;
}

export interface TeamWithLeague extends Team {
  leagues: League;
}

export interface GameWithRelations extends Game {
  competitions: Competition;
  home_team_season: TeamSeason & { teams: Team };
  away_team_season: TeamSeason & { teams: Team };
  venues: Venue | null;
}

export interface RosterWithPlayer extends RosterEntry {
  players: Player;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
}
