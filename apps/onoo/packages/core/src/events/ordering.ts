import type { StatEvent } from '../types';

/**
 * Sort events in canonical display order:
 *   period ASC → clock_seconds DESC → local_seq ASC
 *
 * Lower period first (Q1 before Q2).
 * Within a period, earlier game-clock times first (20:00 before 0:00).
 * Ties broken by local_seq (lower sequence = entered first).
 */
export function sortEvents(events: StatEvent[]): StatEvent[] {
  return [...events].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period;
    if (a.clock_seconds !== b.clock_seconds) return b.clock_seconds - a.clock_seconds;
    return a.local_seq - b.local_seq;
  });
}
