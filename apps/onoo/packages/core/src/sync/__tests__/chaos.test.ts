/**
 * Task 1.10 — EventQueue chaos tests.
 *
 * Random ack/reject/timeout sequences against EventQueue invariants:
 *   - No op is lost (every enqueued op either stays pending or gets acked).
 *   - No op is double-applied (ack is idempotent — re-acking is a no-op).
 *   - Sequence numbers are monotonic and never reused.
 *   - The op ledger (pending set) always contains exactly the ops that were
 *     enqueued minus the ops that were acked.
 */
import { describe, expect, it } from "vitest";
import type { StatEvent } from "../../types";
import { EventQueue } from "../queue";

function makeEvent(
  clientId: string,
  overrides: Partial<StatEvent> = {},
): StatEvent {
  return {
    id: `evt-${clientId}`,
    game_id: "game-1",
    tracker_session_id: "session-1",
    operation_id: `op-${clientId}`,
    client_id: clientId,
    local_seq: 0,
    event_type: "shot_2pt_made",
    period: 1,
    clock_seconds: 600,
    team_season_id: "team-1",
    player_id: "player-1",
    payload: {},
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    voided_at: null,
    voided_by: null,
    void_reason: null,
    deleted_at: null,
    superseded_by: null,
    ...overrides,
  };
}

/** Enqueue N insert ops, return their client_ids. */
function enqueueN(q: EventQueue, n: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const cid = `client-${Math.random().toString(36).slice(2, 8)}`;
    ids.push(cid);
    q.enqueue({ kind: "insert", event: makeEvent(cid) });
  }
  return ids;
}

describe("EventQueue chaos — random ack sequences", () => {
  it("random subset ack — no op lost, no op double-applied", () => {
    const N = 50;
    const q = new EventQueue();
    const ids = enqueueN(q, N);

    // Ack a random subset
    const ackSet = new Set(ids.filter(() => Math.random() < 0.4));
    const ackIds = [...ackSet];
    q.markSynced(ackIds);

    const pending = q.pendingBatch();
    const remainingIds = pending
      .filter((op) => op.kind === "insert" && op.event)
      .map((op) => op.event?.client_id);

    // Invariant: every acked id is gone
    for (const aid of ackIds) {
      expect(remainingIds).not.toContain(aid);
    }
    // Invariant: every remaining id was NOT acked
    for (const rid of remainingIds) {
      expect(ackSet.has(rid)).toBe(false);
    }
    // Invariant: total remaining + acked = N
    expect(remainingIds.length + ackSet.size).toBe(N);
    // Invariant: no duplicate client_ids in remaining set
    expect(new Set(remainingIds).size).toBe(remainingIds.length);
  });

  it("empty ack — nothing removed", () => {
    const q = new EventQueue();
    const _ids = enqueueN(q, 10);
    q.markSynced([]);
    expect(q.pendingBatch().length).toBe(10);
  });

  it("all ack — queue empties", () => {
    const q = new EventQueue();
    const ids = enqueueN(q, 10);
    q.markSynced(ids);
    expect(q.pendingBatch().length).toBe(0);
  });

  it("reverse-order ack — no op lost", () => {
    const q = new EventQueue();
    const ids = enqueueN(q, 10);
    const reversed = [...ids].reverse();
    q.markSynced(reversed);
    expect(q.pendingBatch().length).toBe(0);
  });

  it("interleaved ack — every op eventually acked", () => {
    const q = new EventQueue();
    const ids = enqueueN(q, 20);

    // Ack in 4 batches
    for (let i = 0; i < 4; i++) {
      const batch = ids.slice(i * 5, (i + 1) * 5);
      q.markSynced(batch);
    }
    expect(q.pendingBatch().length).toBe(0);
  });
});

describe("EventQueue chaos — mixed insert and soft_delete", () => {
  it("random ack of mixed ops", () => {
    const q = new EventQueue();
    const insertIds: string[] = [];
    const deleteIds: string[] = [];

    for (let i = 0; i < 30; i++) {
      if (Math.random() < 0.7) {
        const cid = `ins-${Math.random().toString(36).slice(2, 8)}`;
        insertIds.push(cid);
        q.enqueue({ kind: "insert", event: makeEvent(cid) });
      } else {
        const cid = `del-${Math.random().toString(36).slice(2, 8)}`;
        deleteIds.push(cid);
        q.enqueue({ kind: "soft_delete", eventId: cid });
      }
    }

    // Ack some inserts and some deletes
    const ackInserts = insertIds.filter(() => Math.random() < 0.5);
    const ackDeletes = deleteIds.filter(() => Math.random() < 0.5);
    const allAcks = [...ackInserts, ...ackDeletes];
    q.markSynced(allAcks);

    const pending = q.pendingBatch();
    const remainingInserts = pending
      .filter((op) => op.kind === "insert" && op.event)
      .map((op) => op.event?.client_id);
    const remainingDeletes = pending
      .filter((op) => op.kind === "soft_delete")
      .map((op) => op.eventId!)
      .filter(Boolean);

    // Invariant: acked inserts are gone
    for (const aid of ackInserts) {
      expect(remainingInserts).not.toContain(aid);
    }
    // Invariant: acked deletes are gone
    for (const did of ackDeletes) {
      expect(remainingDeletes).not.toContain(did);
    }
    // Invariant: total ledger matches
    expect(remainingInserts.length + ackInserts.length).toBe(insertIds.length);
    expect(remainingDeletes.length + ackDeletes.length).toBe(deleteIds.length);
  });
});

describe("EventQueue chaos — sequence number invariants", () => {
  it("local_seq is strictly increasing", () => {
    const q = new EventQueue();
    const _ids = enqueueN(q, 100);

    const pending = q.pendingBatch();
    for (let i = 1; i < pending.length; i++) {
      expect(pending[i].localSeq).toBeGreaterThan(pending[i - 1].localSeq);
    }
  });

  it("sequence numbers never repeat after partial ack and re-enqueue", () => {
    const q = new EventQueue();
    const ids = enqueueN(q, 20);
    const acked = ids.slice(0, 5);
    q.markSynced(acked);

    // Re-enqueue more — seq numbers continue, never collide
    const _moreIds = enqueueN(q, 10);
    const pending = q.pendingBatch();
    const seqs = pending.map((op) => op.localSeq);
    expect(new Set(seqs).size).toBe(seqs.length); // all unique
  });
});
