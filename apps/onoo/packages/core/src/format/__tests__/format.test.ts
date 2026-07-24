import { describe, it, expect } from 'vitest';
import { formatClock, formatStat, formatPlayerName, describeEvent } from '../index';

describe('formatClock', () => {
  it('formats 0 as 0:00', () => {
    expect(formatClock(0)).toBe('0:00');
  });

  it('formats 600 as 10:00', () => {
    expect(formatClock(600)).toBe('10:00');
  });

  it('formats 65 as 1:05', () => {
    expect(formatClock(65)).toBe('1:05');
  });

  it('formats 59 as 0:59', () => {
    expect(formatClock(59)).toBe('0:59');
  });

  it('handles negative values', () => {
    expect(formatClock(-60)).toBe('1:00');
  });
});

describe('formatStat', () => {
  it('formats integer', () => {
    expect(formatStat(5, 'integer')).toBe('5');
  });

  it('formats decimal', () => {
    expect(formatStat(5.5, 'decimal')).toBe('5.5');
  });

  it('formats percentage', () => {
    expect(formatStat(0.456, 'percentage')).toBe('45.6%');
  });

  it('returns — for null', () => {
    expect(formatStat(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(formatStat(undefined)).toBe('—');
  });
});

describe('formatPlayerName', () => {
  it('returns canonical name for mn locale', () => {
    expect(formatPlayerName('Bat-Erdene', 'Бат-Эрдэнэ', 'mn')).toBe('Бат-Эрдэнэ');
  });

  it('returns latin name for en locale', () => {
    expect(formatPlayerName('Bat-Erdene', 'Бат-Эрдэнэ', 'en')).toBe('Bat-Erdene');
  });

  it('falls back to canonical when latin is null', () => {
    expect(formatPlayerName(null, 'Бат-Эрдэнэ', 'en')).toBe('Бат-Эрдэнэ');
  });
});

describe('describeEvent', () => {
  it('describes shot_2pt_made in mn', () => {
    expect(describeEvent({ event_type: 'shot_2pt_made', payload: {} }, 'mn')).toBe('2 оноо');
  });

  it('describes shot_2pt_made in en', () => {
    expect(describeEvent({ event_type: 'shot_2pt_made', payload: {} }, 'en')).toBe('2pt made');
  });

  it('describes steal in mn', () => {
    expect(describeEvent({ event_type: 'steal', payload: {} }, 'mn')).toBe('Булаасан');
  });

  it('describes steal in en', () => {
    expect(describeEvent({ event_type: 'steal', payload: {} }, 'en')).toBe('Steal');
  });

  it('describes substitution with player ids', () => {
    const result = describeEvent(
      { event_type: 'substitution', payload: { in_player_id: 'p1', out_player_id: 'p2' } },
      'en'
    );
    expect(result).toBe('p2 → p1');
  });

  it('describes personal foul with foul type in mn', () => {
    const result = describeEvent(
      { event_type: 'foul_personal', payload: { foul_type: 'shooting' } },
      'mn'
    );
    expect(result).toBe('Хувийн зөрчил (зэвсгийт)');
  });

  it('describes personal foul with foul type in en', () => {
    const result = describeEvent(
      { event_type: 'foul_personal', payload: { foul_type: 'offensive' } },
      'en'
    );
    expect(result).toBe('Personal foul (offensive)');
  });

  it('returns event_type for unknown events', () => {
    expect(describeEvent({ event_type: 'unknown_event', payload: {} }, 'en')).toBe('unknown_event');
  });
});
