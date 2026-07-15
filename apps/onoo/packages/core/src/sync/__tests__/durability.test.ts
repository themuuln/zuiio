/**
 * Task 1.6 — Journal durability verification for the tracker's offline queue.
 *
 * System under test: `EventQueue` (packages/core/src/sync/queue.ts) — the
 * in-memory half of the journal. The durable half is the IndexedDB journal in
 * `src/lib/tracker/queue.ts` (DB `onoo-tracker`, store `operations`, state
 * machine: pending → sending → acknowledged | rejected). IndexedDB cannot be
 * reached from pure unit tests (no browser environment, no new dependencies
 * allowed), so the durable half is verified with the manual procedure below;
 * these tests pin the queue/journal CONTRACT both layers share:
 *
 *   - an op leaves the pending set only via an explicit ack (`markSynced`);
 *   - acks are idempotent — re-acking is a no-op and never over-removes;
 *   - a rejection never deletes the op record: it stays journalled with
 *     status `rejected` plus its reason, and only drops out of the replay set;
 *   - local sequence numbers are monotonic and never reused.
 *
 * ── Manual reload test (run in a browser against the local stack) ──────────
 *
 *  1. `pnpm dev`, sign in as a scorer, open `/tracker/<gameId>` for a game in
 *     `live_provisional` with an open tracker session. Start tracking.
 *  2. DevTools → Network → set "Offline". Record ≥5 stat events. In DevTools
 *     → Application → IndexedDB → `onoo-tracker` → `operations`, assert one
 *     row per tap: state `pending`, monotonic `localSeq`, stable `clientId`,
 *     unique `operationId`.
 *  3. Kill the tab outright (close the tab/window — not a soft navigation)
 *     while still offline.
 *  4. Reopen `/tracker/<gameId>`. The tracker must load the surviving rows
 *     (`loadPending` → states pending|sending, ordered by `localSeq`) and
 *     re-enqueue them for replay.
 *  5. Clear "Offline". Replay must send each op through `cmd_record_event`
 *     with its ORIGINAL `operation_id` / `client_id` / `local_seq` — the
 *     server deduplicates on `operation_id`, so a row that was already
 *     accepted before the crash is acked on retry, never double-applied.
 *  6. Assert: every journal row reaches `acknowledged`;
 *     `select operation_id, count(*) from stat_events group by 1` shows no
 *     count > 1; the on-screen box score equals the pre-kill box score; any
 *     rejected row remains visible with state `rejected` and `lastError`.
 *
 *  NOTE (wiring status, 2026-07-15): `src/app/tracker/[gameId]/page.tsx`
 *  currently instantiates only the in-memory EventQueue and never calls
 *  `createPersistentQueue()` / `loadPending()` from
 *  `src/lib/tracker/queue.ts`, so step 4 has nothing to replay yet. The
 *  journal module itself is implemented; the flush/replay wiring is Task 1.7
 *  scope, and the procedure above is its acceptance test.
 */

import { describe, expect, it } from 'vitest';
import { EventQueue } from '../queue';
import type { JournalOperation } from '../queue';
import type { StatEvent } from '../../types';

// Helper to create a minimal StatEvent (same fixture shape as queue.test.ts)
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

function makeInsert(clientId: string): StatEvent {
  return makeEvent({
    id: `evt-${clientId}`,
    client_id: clientId,
    operation_id: `op-${clientId}`,
  });
}

/** The identity `markSynced` keys on: client_id for inserts, eventId for voids. */
function pendingIds(q: EventQueue): string[] {
  return q
    .pendingBatch()
    .map((op) => (op.kind === 'insert' ? op.event!.client_id : op.eventId!));
}

function enqueueInserts(q: EventQueue, ids: string[]): void {
  for (const id of ids) {
    q.enqueue({ kind: 'insert', event: makeInsert(id) });
  }
}

describe('EventQueue durability — ack of a subset', () => {
  it('enqueue N ops → ack a subset → exactly the un-acked ops stay pending, in enqueue order', () => {
    const q = new EventQueue();
    const ids = ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10'];
    enqueueInserts(q, ids);
    expect(q.size).toBe(10);

    // Server acknowledges an arbitrary subset (out of order).
    q.markSynced(['c05', 'c02', 'c10', 'c09']);

    const remaining = q
      .pendingBatch()
      .map((op) => ({ id: op.event!.client_id, localSeq: op.localSeq }));
    expect(remaining).toEqual([
      { id: 'c01', localSeq: 1 },
      { id: 'c03', localSeq: 3 },
      { id: 'c04', localSeq: 4 },
      { id: 'c06', localSeq: 6 },
      { id: 'c07', localSeq: 7 },
      { id: 'c08', localSeq: 8 },
    ]);
    expect(q.size).toBe(6);
  });

  it('ack works across mixed insert/soft_delete ops with distinct ids', () => {
    const q = new EventQueue();
    q.enqueue({ kind: 'insert', event: makeInsert('a') });
    q.enqueue({ kind: 'soft_delete', eventId: 'x' }); // voids an already-synced event
    q.enqueue({ kind: 'insert', event: makeInsert('b') });
    q.enqueue({ kind: 'soft_delete', eventId: 'y' });

    q.markSynced(['b', 'x']);

    const remaining = q
      .pendingBatch()
      .map((op) => ({ kind: op.kind, id: op.kind === 'insert' ? op.event!.client_id : op.eventId }));
    expect(remaining).toEqual([
      { kind: 'insert', id: 'a' },
      { kind: 'soft_delete', id: 'y' },
    ]);
  });

  it('an acked op never reappears in a later pendingBatch', () => {
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2', 'c3']);
    q.markSynced(['c2']);

    expect(pendingIds(q)).not.toContain('c2');
    // Enqueueing more work must not resurrect it either.
    enqueueInserts(q, ['c4']);
    expect(pendingIds(q)).toEqual(['c1', 'c3', 'c4']);
  });
});

describe('EventQueue durability — duplicate acks are idempotent', () => {
  it('acking the same id twice leaves the pending set unchanged the second time', () => {
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2', 'c3', 'c4']);

    q.markSynced(['c3']);
    const afterFirst = pendingIds(q);
    expect(afterFirst).toEqual(['c1', 'c2', 'c4']);

    // Duplicate ack (e.g. the same server response processed twice).
    q.markSynced(['c3']);
    expect(pendingIds(q)).toEqual(afterFirst);
    expect(q.size).toBe(3);
  });

  it('a duplicate id inside a later ack batch removes only the not-yet-acked ops', () => {
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2', 'c3', 'c4']);

    q.markSynced(['c2']);
    q.markSynced(['c2', 'c4']); // c2 already gone — must only remove c4

    expect(pendingIds(q)).toEqual(['c1', 'c3']);
  });

  it('acking an id the queue has never seen (or already cleared) is a no-op', () => {
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2']);

    // e.g. a crash-replay ack for an op that was already cleared pre-crash
    q.markSynced(['ghost-op']);

    expect(pendingIds(q)).toEqual(['c1', 'c2']);
  });

  it('client-side apply gated on the pending set applies an op exactly once across duplicate acks', () => {
    // Models the flush loop's discipline: "apply" (clear + bookkeep) an ack
    // only if the op is still pending. Because markSynced removes it, a
    // duplicate ack finds nothing to apply — no double-apply.
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2']);

    const applyCount = new Map<string, number>();
    function handleAck(id: string): void {
      const stillPending = pendingIds(q).includes(id);
      if (!stillPending) return; // duplicate — already applied and cleared
      applyCount.set(id, (applyCount.get(id) ?? 0) + 1);
      q.markSynced([id]);
    }

    handleAck('c1');
    handleAck('c1'); // duplicate delivery of the same ack
    handleAck('c1');

    expect(applyCount.get('c1')).toBe(1);
    expect(pendingIds(q)).toEqual(['c2']);
  });
});

describe('EventQueue durability — rejection', () => {
  it('a rejected (not acked) op stays in the pending set — rejection alone never drops an op', () => {
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2', 'c3']);

    // Server round: c1 acked, c2 rejected, c3 timed out. Only the ack may
    // remove anything from the queue — the rejected and timed-out ops must
    // survive so the durable journal (and the operator) can still see them.
    q.markSynced(['c1']);

    const remaining = q
      .pendingBatch()
      .map((op) => ({ id: op.event!.client_id, localSeq: op.localSeq }));
    expect(remaining).toEqual([
      { id: 'c2', localSeq: 2 }, // rejected — retained, original seq intact
      { id: 'c3', localSeq: 3 }, // timed out — retained for retry
    ]);
  });

  it('journal keeps a rejected op with status rejected and its reason; replay set excludes it', () => {
    // Mirrors the durable journal semantics of src/lib/tracker/queue.ts:
    // markRejected() keeps the row and sets state + lastError, and
    // loadPendingByGame() excludes rejected rows from replay. Core's
    // JournalOperation type uses status "queued" where the app journal uses
    // "pending" (and has no "sending") — divergence noted in the task report.
    const journal = new Map<string, JournalOperation>();
    const mkJournalOp = (operationId: string, sequenceNo: number): JournalOperation => ({
      operationId,
      trackerSessionId: 'session-1',
      sequenceNo,
      kind: 'record_event',
      payload: {},
      status: 'queued',
    });
    journal.set('op-1', mkJournalOp('op-1', 1));
    journal.set('op-2', mkJournalOp('op-2', 2));
    journal.set('op-3', mkJournalOp('op-3', 3));

    // op-1 acked; op-2 rejected with a domain reason; op-3 untouched.
    journal.set('op-1', { ...journal.get('op-1')!, status: 'acknowledged' });
    journal.set('op-2', {
      ...journal.get('op-2')!,
      status: 'rejected',
      rejectionReason: 'event_type_not_in_ruleset',
    });

    // The rejected op is RETAINED (never deleted) with state + reason.
    expect(journal.size).toBe(3);
    const rejected = journal.get('op-2')!;
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toBe('event_type_not_in_ruleset');
    expect(rejected.sequenceNo).toBe(2);

    // The replay set (what a reload re-enqueues) excludes terminal ops.
    const replaySet = [...journal.values()].filter((op) => op.status === 'queued');
    expect(replaySet.map((op) => op.operationId)).toEqual(['op-3']);
  });

  it('double rejection stays rejected, keeps a single journal record (latest reason wins)', () => {
    const journal = new Map<string, JournalOperation>();
    journal.set('op-1', {
      operationId: 'op-1',
      trackerSessionId: 'session-1',
      sequenceNo: 1,
      kind: 'record_event',
      payload: {},
      status: 'queued',
    });

    const reject = (operationId: string, reason: string): void => {
      const existing = journal.get(operationId);
      if (!existing) return; // unknown id — silent no-op, like markRejected
      journal.set(operationId, { ...existing, status: 'rejected', rejectionReason: reason });
    };

    reject('op-1', 'ONOO_SEQUENCE_GAP');
    reject('op-1', 'ONOO_SEQUENCE_GAP'); // duplicate rejection delivery
    reject('ghost', 'whatever'); // unknown id — no new record

    expect(journal.size).toBe(1);
    expect(journal.get('op-1')!.status).toBe('rejected');
    expect(journal.get('op-1')!.rejectionReason).toBe('ONOO_SEQUENCE_GAP');
  });
});

describe('EventQueue durability — sequence numbers', () => {
  it('localSeq keeps increasing after acks — sequence numbers are never reused', () => {
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2', 'c3']);
    q.markSynced(['c1', 'c2', 'c3']);
    expect(q.size).toBe(0);

    // A fresh op after a full drain must NOT restart at 1 — reusing a
    // sequence number would break server-side ordering checks.
    q.enqueue({ kind: 'insert', event: makeInsert('c4') });
    expect(q.pendingBatch()[0]!.localSeq).toBe(4);
  });

  it('enqueue overwrites event.local_seq with the queue counter (documented, callers beware)', () => {
    // Pins the documented mutation in EventQueue.enqueue(): the queue owns
    // local_seq and clobbers whatever the caller assigned. Any caller keeping
    // its own counter (see localSeqRef in src/app/tracker/[gameId]/page.tsx,
    // which seeds from existing event count while the queue always starts at
    // 1) will diverge from the value stored in the queue — flagged in the
    // task report.
    const q = new EventQueue();
    const event = makeInsert('c1');
    event.local_seq = 999;

    q.enqueue({ kind: 'insert', event });

    expect(event.local_seq).toBe(1);
    expect(q.pendingBatch()[0]!.localSeq).toBe(1);
  });
});

describe('EventQueue known sharp edges (documented current behavior — see Task 1.7 flush)', () => {
  it('one ack of a shared id removes BOTH a co-pending insert and its void — partial acks would lose the void', () => {
    // Realistic sequence: record an event, then void it before the insert is
    // acked. Both ops share the identity "c1" (insert.client_id ===
    // soft_delete.eventId), and markSynced matches by that identity, so a
    // single ack removes BOTH ops. If the server had confirmed only the
    // insert, the pending void would be dropped un-sent — silent data loss.
    // The Task 1.7 flush loop must therefore only ack an identity once every
    // co-pending op carrying it has been confirmed.
    const q = new EventQueue();
    q.enqueue({ kind: 'insert', event: makeInsert('c1') });
    q.enqueue({ kind: 'soft_delete', eventId: 'c1' });
    expect(q.size).toBe(2);

    q.markSynced(['c1']);

    expect(q.size).toBe(0);
    expect(q.pendingBatch()).toHaveLength(0);
  });

  it('a soft_delete enqueued without eventId is accepted but can never be acked', () => {
    // enqueue() validates inserts (event required) but not soft_deletes: a
    // missing eventId is accepted, occupies a sequence slot, and no
    // markSynced call can ever match it — it is stuck in the pending set
    // forever. Callers must always pass eventId; flagged in the task report.
    const q = new EventQueue();
    q.enqueue({ kind: 'soft_delete' });
    expect(q.size).toBe(1);

    q.markSynced(['c1', 'undefined', '']);
    expect(q.size).toBe(1);
  });

  it('pendingBatch snapshots do not reflect later acks — always re-read after markSynced', () => {
    // markSynced reassigns the internal array (filter), so a previously
    // captured batch is a stale snapshot. Flush code must re-read
    // pendingBatch() after every ack round instead of holding a reference.
    const q = new EventQueue();
    enqueueInserts(q, ['c1', 'c2', 'c3']);
    const snapshot = q.pendingBatch();
    expect(snapshot).toHaveLength(3);

    q.markSynced(['c1']);

    expect(snapshot).toHaveLength(3); // stale
    expect(q.pendingBatch()).toHaveLength(2); // fresh read is authoritative
  });
});
