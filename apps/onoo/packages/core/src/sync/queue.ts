import type { StatEvent } from "../types/index.js";

/**
 * A single pending operation in the offline queue.
 *
 * - `insert` carries the full StatEvent (with client_id and local_seq assigned at enqueue time).
 * - `soft_delete` carries the `eventId` (= client_id) of the event to tombstone.
 */
export interface QueueOp {
  kind: "insert" | "soft_delete";
  event?: StatEvent;
  /** client_id of the event being soft-deleted (or the insert's client_id) */
  eventId?: string;
  /** monotonic sequence assigned at enqueue time */
  localSeq: number;
}

/**
 * Offline event queue — buffers insert and soft_delete operations while
 * offline, then replays them in local_seq order when connectivity returns.
 *
 * Usage:
 *   const q = new EventQueue();
 *   q.enqueue({ kind: "insert", event: myEvent });       // assigns localSeq
 *   q.enqueue({ kind: "soft_delete", eventId: oldId });   // stores delete
 *   q.pendingBatch();                                      // ordered ops
 *   q.markSynced([clientA, clientB]);                      // removes synced
 */
export class EventQueue {
  private pending: QueueOp[] = [];
  private localSeq: number = 0;

  /** Total unsynced operations. */
  get size(): number {
    return this.pending.length;
  }

  /**
   * Enqueue a new operation.
   *
   * - **insert**: `event.local_seq` is set to `localSeq + 1`, `event.client_id`
   *   is expected to already be set by the caller (uuid factory). The operation
   *   is appended with its assigned sequence number.
   * - **soft_delete**: records the target eventId for later replay.
   */
  enqueue(op: Omit<QueueOp, "localSeq"> & { event?: StatEvent }): void {
    if (op.kind === "insert") {
      if (!op.event) {
        throw new Error("EventQueue: insert op requires an event");
      }
      this.localSeq += 1;
      // Ensure the event carries the queue's sequence number
      op.event.local_seq = this.localSeq;
      this.pending.push({ ...op, localSeq: this.localSeq });
    } else {
      // soft_delete — still gets a monotonic seq for ordering
      this.localSeq += 1;
      this.pending.push({ ...op, localSeq: this.localSeq });
    }
  }

  /**
   * Return all pending operations in ascending local_seq order.
   * Safe to call repeatedly — returns the full pending set.
   */
  pendingBatch(): readonly QueueOp[] {
    // Already ordered by insertion; localSeq is monotonically increasing
    return this.pending;
  }

  /**
   * Remove all pending operations whose associated client_id is in the
   * provided list.  Matches:
   * - `insert` ops → `event.client_id`
   * - `soft_delete` ops → `eventId`
   */
  markSynced(clientIds: string[]): void {
    if (clientIds.length === 0) return;
    const synced = new Set(clientIds);
    this.pending = this.pending.filter((op) => {
      if (op.kind === "insert" && op.event) {
        return !synced.has(op.event.client_id);
      }
      if (op.kind === "soft_delete") {
        return op.eventId == null || !synced.has(op.eventId);
      }
      return true;
    });
  }
}
