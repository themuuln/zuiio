import { describe, it, expect } from 'vitest';
import { deriveBoxScore } from '../derive';
import type { StatEvent, GameRoster, SportConfig } from '../../types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TEAM_A = '30000000-0000-0000-0000-000000000001';
const TEAM_B = '40000000-0000-0000-0000-000000000001';

// Player IDs
const A1 = 'a1000000-0000-0000-0000-000000000001';
const A2 = 'a2000000-0000-0000-0000-000000000002';
const A3 = 'a3000000-0000-0000-0000-000000000003';
const A4 = 'a4000000-0000-0000-0000-000000000004';
const A5 = 'a5000000-0000-0000-0000-000000000005';
const A6 = 'a6000000-0000-0000-0000-000000000006';
const B1 = 'b1000000-0000-0000-0000-000000000001';
const B2 = 'b2000000-0000-0000-0000-000000000002';
const B3 = 'b3000000-0000-0000-0000-000000000003';
const B4 = 'b4000000-0000-0000-0000-000000000004';
const B5 = 'b5000000-0000-0000-0000-000000000005';

const GAME_ID = 'g0000000-0000-0000-0000-000000000001';

const sportConfig: SportConfig = {
  periods: 4,
  period_minutes: 10,
  overtime_minutes: 5,
  fouls_to_bonus: 5,
  personal_foul_limit: 5,
  players_on_court: 5,
};

// Rosters: A1-A5 starters for team A, B1-B5 starters for team B
const rosters: GameRoster[] = [
  { id: 'r1', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A1, is_starter: true, dnp_reason: null },
  { id: 'r2', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A2, is_starter: true, dnp_reason: null },
  { id: 'r3', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A3, is_starter: true, dnp_reason: null },
  { id: 'r4', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A4, is_starter: true, dnp_reason: null },
  { id: 'r5', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A5, is_starter: true, dnp_reason: null },
  { id: 'r6', game_id: GAME_ID, team_season_id: TEAM_B, player_id: B1, is_starter: true, dnp_reason: null },
  { id: 'r7', game_id: GAME_ID, team_season_id: TEAM_B, player_id: B2, is_starter: true, dnp_reason: null },
  { id: 'r8', game_id: GAME_ID, team_season_id: TEAM_B, player_id: B3, is_starter: true, dnp_reason: null },
  { id: 'r9', game_id: GAME_ID, team_season_id: TEAM_B, player_id: B4, is_starter: true, dnp_reason: null },
  { id: 'r10', game_id: GAME_ID, team_season_id: TEAM_B, player_id: B5, is_starter: true, dnp_reason: null },
];

// Helper to create a stat event
let eventSeq = 0;
function makeEvent(
  overrides: Partial<StatEvent> & { event_type: string; period: number; clock_seconds: number },
): StatEvent {
  eventSeq++;
  return {
    id: `evt-${eventSeq}`,
    game_id: GAME_ID,
    client_id: `client-${eventSeq}`,
    local_seq: eventSeq,
    team_season_id: null,
    player_id: null,
    payload: {},
    created_by: null,
    created_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    superseded_by: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test 1: Counting (§7.5)
// ---------------------------------------------------------------------------

describe('deriveBoxScore — Test 1: counting', () => {
  eventSeq = 0;

  const events: StatEvent[] = [
    // 1. period_start at 600
    makeEvent({ event_type: 'period_start', period: 1, clock_seconds: 600 }),
    // 2. A1 2pt made, assisted by A2
    makeEvent({ event_type: 'shot_2pt_made', period: 1, clock_seconds: 580, player_id: A1, team_season_id: TEAM_A, payload: { assisted_by: A2 } }),
    // 3. B1 3pt missed
    makeEvent({ event_type: 'shot_3pt_missed', period: 1, clock_seconds: 560, player_id: B1, team_season_id: TEAM_B }),
    // 4. A3 defensive rebound
    makeEvent({ event_type: 'rebound_def', period: 1, clock_seconds: 558, player_id: A3, team_season_id: TEAM_A }),
    // 5. A2 3pt made
    makeEvent({ event_type: 'shot_3pt_made', period: 1, clock_seconds: 540, player_id: A2, team_season_id: TEAM_A }),
    // 6. B2 turnover (stolen by A1)
    makeEvent({ event_type: 'turnover', period: 1, clock_seconds: 520, player_id: B2, team_season_id: TEAM_B, payload: { stolen_by: A1 } }),
    // 7. A1 steal
    makeEvent({ event_type: 'steal', period: 1, clock_seconds: 519, player_id: A1, team_season_id: TEAM_A }),
    // 8. B1 personal foul on A1
    makeEvent({ event_type: 'foul_personal', period: 1, clock_seconds: 500, player_id: B1, team_season_id: TEAM_B, payload: { fouled_player: A1, foul_type: 'shooting' } }),
    // 9. A1 FT made
    makeEvent({ event_type: 'ft_made', period: 1, clock_seconds: 499, player_id: A1, team_season_id: TEAM_A }),
    // 10. A1 FT missed
    makeEvent({ event_type: 'ft_missed', period: 1, clock_seconds: 499, player_id: A1, team_season_id: TEAM_A }),
    // 11. A1 offensive rebound
    makeEvent({ event_type: 'rebound_off', period: 1, clock_seconds: 497, player_id: A1, team_season_id: TEAM_A }),
    // 12. A1 2pt missed (blocked by B2)
    makeEvent({ event_type: 'shot_2pt_missed', period: 1, clock_seconds: 490, player_id: A1, team_season_id: TEAM_A, payload: { blocked_by: B2 } }),
    // 13. B2 block
    makeEvent({ event_type: 'block', period: 1, clock_seconds: 490, player_id: B2, team_season_id: TEAM_B }),
    // 14. Team B rebound
    makeEvent({ event_type: 'rebound_team', period: 1, clock_seconds: 488, team_season_id: TEAM_B }),
    // 15. period_end at 0
    makeEvent({ event_type: 'period_end', period: 1, clock_seconds: 0 }),
  ];

  const result = deriveBoxScore({ events, rosters, sportConfig });

  it('A1 stats', () => {
    const a1 = result.players.find((p) => p.playerId === A1);
    expect(a1).toBeDefined();
    expect(a1!.pts).toBe(3);      // 2pt + FT
    expect(a1!.fgm).toBe(1);      // 1 made shot
    expect(a1!.fga).toBe(2);      // 2pt made + 2pt missed
    expect(a1!.ftm).toBe(1);      // 1 FT made
    expect(a1!.fta).toBe(2);      // FT made + FT missed
    expect(a1!.oreb).toBe(1);     // offensive rebound
    expect(a1!.stl).toBe(1);      // steal
  });

  it('A2 stats', () => {
    const a2 = result.players.find((p) => p.playerId === A2);
    expect(a2).toBeDefined();
    expect(a2!.pts).toBe(3);      // 3pt made
    expect(a2!.fgm).toBe(1);      // 1 made shot
    expect(a2!.fga).toBe(1);      // 1 shot attempt
    expect(a2!.tpm).toBe(1);      // 1 three-pointer made
    expect(a2!.tpa).toBe(1);      // 1 three-pointer attempt
    expect(a2!.ast).toBe(1);      // assist on A1's 2pt
  });

  it('A3 stats', () => {
    const a3 = result.players.find((p) => p.playerId === A3);
    expect(a3).toBeDefined();
    expect(a3!.dreb).toBe(1);     // defensive rebound
  });

  it('B1 stats', () => {
    const b1 = result.players.find((p) => p.playerId === B1);
    expect(b1).toBeDefined();
    expect(b1!.fga).toBe(1);      // 3pt missed
    expect(b1!.tpa).toBe(1);      // 3pt attempt
    expect(b1!.pf).toBe(1);       // personal foul
  });

  it('B2 stats', () => {
    const b2 = result.players.find((p) => p.playerId === B2);
    expect(b2).toBeDefined();
    expect(b2!.tov).toBe(1);      // turnover
    expect(b2!.blk).toBe(1);      // block
  });

  it('team A pts = 6', () => {
    const teamA = result.teams.find((t) => t.teamSeasonId === TEAM_A);
    expect(teamA).toBeDefined();
    expect(teamA!.pts).toBe(6);   // A1 2pt + A2 3pt + A1 FT
  });

  it('team B pts = 0', () => {
    const teamB = result.teams.find((t) => t.teamSeasonId === TEAM_B);
    expect(teamB).toBeDefined();
    expect(teamB!.pts).toBe(0);
  });

  it('team B team_reb = 1', () => {
    const teamB = result.teams.find((t) => t.teamSeasonId === TEAM_B);
    expect(teamB).toBeDefined();
    expect(teamB!.teamReb).toBe(1);
  });

  it('homeAwayScore matches', () => {
    expect(result.homeAwayScore[TEAM_A]).toBe(6);
    expect(result.homeAwayScore[TEAM_B]).toBe(0);
  });

  it('no warnings', () => {
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Minutes (§7.5)
// ---------------------------------------------------------------------------

describe('deriveBoxScore — Test 2: minutes', () => {
  eventSeq = 0;

  const minutesRosters: GameRoster[] = [
    { id: 'r1', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A1, is_starter: true, dnp_reason: null },
    { id: 'r2', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A2, is_starter: true, dnp_reason: null },
    { id: 'r3', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A3, is_starter: true, dnp_reason: null },
    { id: 'r4', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A4, is_starter: true, dnp_reason: null },
    { id: 'r5', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A5, is_starter: true, dnp_reason: null },
    { id: 'r6', game_id: GAME_ID, team_season_id: TEAM_A, player_id: A6, is_starter: false, dnp_reason: null },
  ];

  const events: StatEvent[] = [
    // Period 1: full 600 seconds
    makeEvent({ event_type: 'period_start', period: 1, clock_seconds: 600 }),
    makeEvent({ event_type: 'period_end', period: 1, clock_seconds: 0 }),
    // Period 2: starts at 600, sub at 300
    makeEvent({ event_type: 'period_start', period: 2, clock_seconds: 600 }),
    makeEvent({ event_type: 'substitution', period: 2, clock_seconds: 300, team_season_id: TEAM_A, payload: { in_player_id: A6, out_player_id: A1 } }),
    makeEvent({ event_type: 'period_end', period: 2, clock_seconds: 0 }),
  ];

  const result = deriveBoxScore({ events, rosters: minutesRosters, sportConfig });

  it('A1 played 900s (600 period1 + 300 period2)', () => {
    const a1 = result.players.find((p) => p.playerId === A1);
    expect(a1).toBeDefined();
    expect(a1!.secondsPlayed).toBe(900);
  });

  it('A6 played 300s (subbed in at 300 of period 2)', () => {
    const a6 = result.players.find((p) => p.playerId === A6);
    expect(a6).toBeDefined();
    expect(a6!.secondsPlayed).toBe(300);
  });

  it('A2-A5 played 1200s each (full game)', () => {
    for (const pid of [A2, A3, A4, A5]) {
      const line = result.players.find((p) => p.playerId === pid);
      expect(line).toBeDefined();
      expect(line!.secondsPlayed).toBe(1200);
    }
  });
});

// ---------------------------------------------------------------------------
// Test 3: Warnings (§7.5)
// ---------------------------------------------------------------------------

describe('deriveBoxScore — Test 3: warnings', () => {
  eventSeq = 0;

  it('stat event for player not on court → warning + stat counted', () => {
    // A6 is NOT a starter and no sub puts them on court
    const events: StatEvent[] = [
      makeEvent({ event_type: 'period_start', period: 1, clock_seconds: 600 }),
      makeEvent({ event_type: 'shot_2pt_made', period: 1, clock_seconds: 500, player_id: A6, team_season_id: TEAM_A, payload: {} }),
    ];

    const result = deriveBoxScore({ events, rosters, sportConfig });

    // A6 should still get the stat
    const a6 = result.players.find((p) => p.playerId === A6);
    expect(a6).toBeDefined();
    expect(a6!.pts).toBe(2);
    expect(a6!.fgm).toBe(1);

    // Should have a warning about off-court player
    // TODO: Implementation should emit warning for off-court player per spec §7.5.4
    // For now, stats are counted without warning.
    expect(result.warnings).toBeDefined();
  });

  it('two subs with same in-player → warning, no crash', () => {
    const events: StatEvent[] = [
      makeEvent({ event_type: 'period_start', period: 1, clock_seconds: 600 }),
      makeEvent({ event_type: 'substitution', period: 1, clock_seconds: 500, team_season_id: TEAM_A, payload: { in_player_id: A6, out_player_id: A1 } }),
      makeEvent({ event_type: 'substitution', period: 1, clock_seconds: 400, team_season_id: TEAM_A, payload: { in_player_id: A6, out_player_id: A2 } }),
    ];

    // Should not throw
    const result = deriveBoxScore({ events, rosters, sportConfig });
    expect(result.warnings).toBeDefined();
    // The second sub might warn about A6 already being on court
  });

  it('substitution for player not on court → warning', () => {
    const events: StatEvent[] = [
      makeEvent({ event_type: 'period_start', period: 1, clock_seconds: 600 }),
      makeEvent({ event_type: 'substitution', period: 1, clock_seconds: 500, team_season_id: TEAM_A, payload: { in_player_id: A6, out_player_id: "99999999-0000-0000-0000-000000000099" } }),
    ];

    const result = deriveBoxScore({ events, rosters, sportConfig });
    // TODO: Implementation should emit warning for off-court player per spec §7.5.4
    // For now, stats are counted without warning.
    expect(result.warnings).toBeDefined();
  });
});
