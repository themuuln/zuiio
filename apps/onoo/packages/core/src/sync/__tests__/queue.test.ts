import { describe, it, expect } from 'vitest';
import { EventQueue } from '../queue';
import type { StatEvent } from '../../types';

// Helper to create a minimal StatEvent
function makeEvent(overrides: Partial<StatEvent> = {}): StatEvent {
  return {
    id: 'evt-1',
    game_id: 'game-1',
    tracker_session_id: 'session-1',
    operation_id: 'operation-1',
    client_id: 'client-1',
    local_seq: 0,
    event_type: 'shot_2pt_made',
    period: 1,
    clock_seconds: 600,
    team_season_id: 'team-1',
    player_id: 'player-1',
    payload: {},
    created_by: null,
    created_at: '2026-01-01T00:00:00Z',
    voided_at: null,
    voided_by: null,
    void_reason: null,
    deleted_at: null,
    superseded_by: null,
    ...overrides,
  };
}

describe('EventQueue', () => {
  it('starts empty', () => {
    const q = new EventQueue();
    expect(q.size).toBe(0);
    expect(q.pendingBatch()).toHaveLength(0);
  });

  it('enqueue insert assigns local_seq', () => {
    const q = new EventQueue();
    const event = makeEvent({ client_id: 'c1' });
    q.enqueue({ kind: 'insert', event });

    expect(q.size).toBe(1);
    const batch = q.pendingBatch();
    expect(batch[0]!.localSeq).toBe(1);
    expect(batch[0]!.kind).toBe('insert');
    expect(event.local_seq).toBe(1);
  });

  it('enqueue multiple inserts assigns incrementing local_seq', () => {
    const q = new EventQueue();
    const e1 = makeEvent({ client_id: 'c1' });
    const e2 = makeEvent({ client_id: 'c2' });
    const e3 = makeEvent({ client_id: 'c3' });

    q.enqueue({ kind: 'insert', event: e1 });
    q.enqueue({ kind: 'insert', event: e2 });
    q.enqueue({ kind: 'insert', event: e3 });

    const batch = q.pendingBatch();
    expect(batch[0]!.localSeq).toBe(1);
    expect(batch[1]!.localSeq).toBe(2);
    expect(batch[2]!.localSeq).toBe(3);
  });

  it('enqueue soft_delete assigns local_seq', () => {
    const q = new EventQueue();
    q.enqueue({ kind: 'soft_delete', eventId: 'client-to-delete' });

    expect(q.size).toBe(1);
    const batch = q.pendingBatch();
    expect(batch[0]!.localSeq).toBe(1);
    expect(batch[0]!.kind).toBe('soft_delete');
    expect(batch[0]!.eventId).toBe('client-to-delete');
  });

  it('enqueue insert without event throws', () => {
    const q = new EventQueue();
    expect(() => q.enqueue({ kind: 'insert' })).toThrow('insert op requires an event');
  });

  it('pendingBatch returns all ops in order', () => {
    const q = new EventQueue();
    const e1 = makeEvent({ client_id: 'c1' });
    const e2 = makeEvent({ client_id: 'c2' });

    q.enqueue({ kind: 'insert', event: e1 });
    q.enqueue({ kind: 'soft_delete', eventId: 'c1' });
    q.enqueue({ kind: 'insert', event: e2 });

    const batch = q.pendingBatch();
    expect(batch).toHaveLength(3);
    expect(batch[0]!.kind).toBe('insert');
    expect(batch[1]!.kind).toBe('soft_delete');
    expect(batch[2]!.kind).toBe('insert');
  });

  it('markSynced removes insert ops by client_id', () => {
    const q = new EventQueue();
    const e1 = makeEvent({ client_id: 'c1' });
    const e2 = makeEvent({ client_id: 'c2' });

    q.enqueue({ kind: 'insert', event: e1 });
    q.enqueue({ kind: 'insert', event: e2 });

    q.markSynced(['c1']);

    expect(q.size).toBe(1);
    expect(q.pendingBatch()[0]!.event!.client_id).toBe('c2');
  });

  it('markSynced removes soft_delete ops by eventId', () => {
    const q = new EventQueue();
    q.enqueue({ kind: 'soft_delete', eventId: 'target-1' });
    q.enqueue({ kind: 'soft_delete', eventId: 'target-2' });

    q.markSynced(['target-1']);

    expect(q.size).toBe(1);
    expect(q.pendingBatch()[0]!.eventId).toBe('target-2');
  });

  it('markSynced with empty array is no-op', () => {
    const q = new EventQueue();
    const e1 = makeEvent({ client_id: 'c1' });
    q.enqueue({ kind: 'insert', event: e1 });

    q.markSynced([]);

    expect(q.size).toBe(1);
  });

  it('markSynced removes all matching across mixed ops', () => {
    const q = new EventQueue();
    const e1 = makeEvent({ client_id: 'c1' });
    const e2 = makeEvent({ client_id: 'c2' });

    q.enqueue({ kind: 'insert', event: e1 });
    q.enqueue({ kind: 'soft_delete', eventId: 'c1' });
    q.enqueue({ kind: 'insert', event: e2 });

    q.markSynced(['c1']);

    expect(q.size).toBe(1);
    expect(q.pendingBatch()[0]!.event!.client_id).toBe('c2');
  });
});
