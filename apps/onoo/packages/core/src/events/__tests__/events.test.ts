import { describe, it, expect } from 'vitest';
import { EVENT_TYPES, isEventAllowedByRuleset, type EventTypeKey, type RulesetEventDictionary } from '../dictionary';
import { validateEvent } from '../payloads';
import { sortEvents } from '../ordering';
import type { StatEvent } from '../../types';

describe('EVENT_TYPES', () => {
  it('has exactly 20 event types', () => {
    expect(Object.keys(EVENT_TYPES)).toHaveLength(20);
  });

  it('all shot events require a player', () => {
    for (const [key, val] of Object.entries(EVENT_TYPES)) {
      if (val.category === 'shot') {
        expect(val.requiresPlayer).toBe(true);
      }
    }
  });

  it('all admin events do not require a player', () => {
    for (const [key, val] of Object.entries(EVENT_TYPES)) {
      if (val.category === 'admin') {
        expect(val.requiresPlayer).toBe(false);
      }
    }
  });
});

describe('validateEvent', () => {
  it('accepts valid shot_made payload', () => {
    const result = validateEvent({
      event_type: 'shot_2pt_made',
      payload: { assisted_by: 'player-1', x: 15, y: 20 },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('accepts empty payload for shot_made', () => {
    expect(validateEvent({ event_type: 'shot_2pt_made', payload: {} }).valid).toBe(true);
  });

  it('rejects invalid x in shot payload', () => {
    const result = validateEvent({
      event_type: 'shot_3pt_missed',
      payload: { x: 'not a number' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('accepts valid substitution payload', () => {
    expect(
      validateEvent({
        event_type: 'substitution',
        payload: { in_player_id: 'p1', out_player_id: 'p2' },
      }).valid,
    ).toBe(true);
  });

  it('rejects substitution with missing out_player_id', () => {
    const result = validateEvent({
      event_type: 'substitution',
      payload: { in_player_id: 'p1' },
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid foul_personal payload with foul_type', () => {
    expect(
      validateEvent({
        event_type: 'foul_personal',
        payload: { fouled_player: 'p3', foul_type: 'shooting' },
      }).valid,
    ).toBe(true);
  });

  it('rejects invalid foul_type enum value', () => {
    const result = validateEvent({
      event_type: 'foul_personal',
      payload: { foul_type: 'flagrant' },
    });
    expect(result.valid).toBe(false);
  });

  it('accepts empty payload for timeout', () => {
    expect(validateEvent({ event_type: 'timeout', payload: {} }).valid).toBe(true);
  });

  it('accepts turnover with stolen_by', () => {
    expect(
      validateEvent({
        event_type: 'turnover',
        payload: { stolen_by: 'p5' },
      }).valid,
    ).toBe(true);
  });
});

describe('sortEvents', () => {
  function makeEvent(overrides: Partial<StatEvent> = {}): StatEvent {
    return {
      id: '1',
      game_id: 'g1',
      client_id: 'c1',
      local_seq: 0,
      event_type: 'shot_2pt_made',
      period: 1,
      clock_seconds: 600,
      team_season_id: null,
      player_id: null,
      payload: {},
      created_by: null,
      created_at: new Date().toISOString(),
      deleted_at: null,
      superseded_by: null,
      ...overrides,
    } as StatEvent;
  }

  it('sorts by period ASC, clock_seconds DESC, local_seq ASC', () => {
    const events = [
      makeEvent({ period: 2, clock_seconds: 300, local_seq: 5 }),
      makeEvent({ period: 1, clock_seconds: 300, local_seq: 3 }),
      makeEvent({ period: 1, clock_seconds: 600, local_seq: 1 }),
      makeEvent({ period: 1, clock_seconds: 600, local_seq: 2 }),
      makeEvent({ period: 2, clock_seconds: 600, local_seq: 1 }),
    ];
    const sorted = sortEvents(events);
    expect(sorted.map((e) => [e.period, e.clock_seconds, e.local_seq])).toEqual([
      [1, 600, 1],
      [1, 600, 2],
      [1, 300, 3],
      [2, 600, 1],
      [2, 300, 5],
    ]);
  });

  it('does not mutate the original array', () => {
    const events = [
      makeEvent({ period: 2, clock_seconds: 300, local_seq: 1 }),
      makeEvent({ period: 1, clock_seconds: 600, local_seq: 1 }),
    ];
    const original = [...events];
    sortEvents(events);
    expect(events).toEqual(original);
  });
});

describe('isEventAllowedByRuleset', () => {
  const pilotRuleset: RulesetEventDictionary = {
    version: '2026-pilot.1',
    enabledEventTypes: [
      'shot_2pt_made', 'shot_2pt_missed', 'shot_3pt_made', 'shot_3pt_missed',
      'ft_made', 'ft_missed', 'rebound_off', 'rebound_def', 'rebound_team',
      'steal', 'block', 'turnover', 'foul_personal', 'foul_technical',
      'substitution', 'timeout', 'period_start', 'period_end',
      'game_start', 'game_end',
    ],
  };

  const restrictedRuleset: RulesetEventDictionary = {
    version: '2026-3x3.1',
    enabledEventTypes: [
      'shot_2pt_made', 'shot_2pt_missed',
      'ft_made', 'ft_missed',
      'rebound_off', 'rebound_def',
      'steal', 'block', 'turnover',
      'foul_personal', 'foul_technical',
      'period_start', 'period_end', 'game_start', 'game_end',
    ],
  };

  it('allows all pilot event types in the pilot ruleset', () => {
    for (const key of pilotRuleset.enabledEventTypes) {
      expect(isEventAllowedByRuleset(key, pilotRuleset)).toBe(true);
    }
  });

  it('rejects 3pt shots in the restricted ruleset', () => {
    expect(isEventAllowedByRuleset('shot_3pt_made', restrictedRuleset)).toBe(false);
    expect(isEventAllowedByRuleset('shot_3pt_missed', restrictedRuleset)).toBe(false);
  });

  it('allows 2pt shots in the restricted ruleset', () => {
    expect(isEventAllowedByRuleset('shot_2pt_made', restrictedRuleset)).toBe(true);
    expect(isEventAllowedByRuleset('shot_2pt_missed', restrictedRuleset)).toBe(true);
  });

  it('rejects substitution in the restricted ruleset', () => {
    expect(isEventAllowedByRuleset('substitution', restrictedRuleset)).toBe(false);
  });
});

describe('validateEvent with ruleset', () => {
  const restrictedRuleset: RulesetEventDictionary = {
    version: '2026-3x3.1',
    enabledEventTypes: [
      'shot_2pt_made', 'shot_2pt_missed',
      'ft_made', 'ft_missed',
      'period_start', 'period_end', 'game_start', 'game_end',
    ],
  };

  it('accepts a valid event that is in the ruleset', () => {
    const result = validateEvent(
      { event_type: 'shot_2pt_made', payload: {} },
      { ruleset: restrictedRuleset },
    );
    expect(result.valid).toBe(true);
  });

  it('rejects an event type not in the ruleset', () => {
    const result = validateEvent(
      { event_type: 'shot_3pt_made', payload: {} },
      { ruleset: restrictedRuleset },
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors![0]).toContain('shot_3pt_made');
    expect(result.errors![0]).toContain('not enabled in ruleset');
  });

  it('skips ruleset check when no ruleset is provided', () => {
    const result = validateEvent({ event_type: 'shot_3pt_made', payload: {} });
    expect(result.valid).toBe(true);
  });
});
