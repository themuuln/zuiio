import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock infrastructure ──────────────────────────────────────
const { mockOpenDB, getDb, seedLegacyStore, clearStores, dbPutThrowOnce } =
  vi.hoisted(() => {
    type Row = Record<string, unknown>;

    interface Store {
      data: Map<string, Row>;
      keyPath: string;
    }

    const stores = new Map<string, Store>();

    let dbInstance: Record<string, unknown> | null = null;

    function clone<T>(obj: T): T {
      return JSON.parse(JSON.stringify(obj));
    }

    function storeFor(name: string): Store {
      if (!stores.has(name)) {
        stores.set(name, { data: new Map(), keyPath: "operationId" });
      }
      return stores.get(name)!;
    }

    function clearStores(): void {
      stores.clear();
    }

    function seedLegacyStore(rows: Row[]): void {
      const store = storeFor("queue");
      store.data.clear();
      for (let i = 0; i < rows.length; i++) {
        store.data.set(`legacy-${i}`, clone(rows[i]));
      }
    }

    function buildDb(): Record<string, unknown> {
      return {
        objectStoreNames: {
          contains: vi.fn((name: string) => stores.has(name)),
        },
        put: vi.fn(
          async (storeName: string, value: Row) => {
            const s = storeFor(storeName);
            s.data.set(value[s.keyPath] as string, clone(value));
          },
        ),
        get: vi.fn(async (storeName: string, key: string) => {
          const s = stores.get(storeName);
          return s?.data.get(key) ? clone(s.data.get(key)) : undefined;
        }),
        getAllFromIndex: vi.fn(
          async (storeName: string, indexName: string, query: unknown) => {
            const s = stores.get(storeName);
            if (!s) return [];
            return Array.from(s.data.values())
              .filter((v) => {
                if (indexName === "gameId") return v.gameId === query;
                if (indexName === "state") return v.state === query;
                if (indexName === "gameId_state") return v.gameId === query;
                return true;
              })
              .map((v) => clone(v));
          },
        ),
        count: vi.fn(async (storeName: string) =>
          stores.get(storeName)?.data.size ?? 0,
        ),
        delete: vi.fn(async (storeName: string, key: string) => {
          stores.get(storeName)?.data.delete(key);
        }),
        createObjectStore: vi.fn(
          (name: string, opts: { keyPath: string }) => {
            storeFor(name);
            return { createIndex: vi.fn() };
          },
        ),
        transaction: vi.fn((storeName: string, _mode: string) => {
          const srcStore = stores.get(storeName);
          return {
            objectStore: (_name: string) => ({
              put: async (value: Row) => {
                const s = storeFor(_name);
                s.data.set(value[s.keyPath] as string, clone(value));
              },
              get: async (key: string) => {
                const val = srcStore?.data.get(key);
                return val ? clone(val) : undefined;
              },
              getAll: async () =>
                srcStore
                  ? Array.from(srcStore.data.values()).map((v) => clone(v))
                  : [],
              delete: async (key: string) => {
                srcStore?.data.delete(key);
              },
            }),
            done: Promise.resolve(),
          };
        }),
        close: vi.fn(),
      };
    }

    function refreshDb(): void {
      dbInstance = buildDb();
    }

    refreshDb();

    return {
      mockOpenDB: vi.fn(
        async (
          _name: string,
          _version: number,
          {
            upgrade,
          }: {
            upgrade?: (
              db: Record<string, unknown>,
              oldVersion: number,
              newVersion: number,
              _tx: unknown,
            ) => void;
          },
        ) => {
          if (upgrade && dbInstance) {
            upgrade(dbInstance, 0, _version, null);
          }
          return dbInstance;
        },
      ),
      getDb: () => dbInstance,
      seedLegacyStore,
      clearStores,
      dbPutThrowOnce: (error: Error) => {
        const db = dbInstance;
        if (db) {
          const orig = db.put as ReturnType<typeof vi.fn>;
          orig.mockRejectedValueOnce(error);
        }
      },
    };
  });

vi.mock("idb", () => ({
  openDB: mockOpenDB,
}));

// ── Module under test ────────────────────────────────────────────────
import { createPersistentQueue } from "../queue";
import type { StoredOperation } from "../queue";

// ── Factory helper ───────────────────────────────────────────────────

function makeOp(overrides: Partial<StoredOperation> = {}): StoredOperation {
  return {
    operationId: crypto.randomUUID(),
    gameId: "game-1",
    trackerSessionId: "session-1",
    clientId: "client-1",
    localSeq: 1,
    commandKind: "record_event",
    payload: { test: true },
    state: "pending",
    attemptCount: 0,
    lastError: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("tracker PersistentQueue", () => {
  beforeEach(() => {
    clearStores();
    // Rebuild db instance so all mocks are fresh
    // (the hoisted refreshDb only runs once; each test re-initialises)
  });

  // ── Lifecycle ──────────────────────────────────────────────────────

  describe("createPersistentQueue", () => {
    it("initialises the database and returns a queue instance", async () => {
      const queue = await createPersistentQueue();
      expect(queue).toBeDefined();
      expect(queue.db).toBeDefined();
      expect(mockOpenDB).toHaveBeenCalledWith(
        "onoo-tracker",
        2,
        expect.objectContaining({ upgrade: expect.any(Function) }),
      );
    });

    it("starts empty", async () => {
      const queue = await createPersistentQueue();
      await expect(queue.loadPending("game-1")).resolves.toEqual([]);
      await expect(queue.getAllByGame("game-1")).resolves.toEqual([]);
    });
  });

  // ── Persist & load ─────────────────────────────────────────────────

  describe("persistOperation / loadPending", () => {
    it("stores and retrieves a pending operation", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp();
      await queue.persistOperation(op);

      const pending = await queue.loadPending(op.gameId);
      expect(pending).toHaveLength(1);
      expect(pending[0].operationId).toBe(op.operationId);
      expect(pending[0].state).toBe("pending");
    });

    it("loads multiple operations sorted by localSeq", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(makeOp({ operationId: "z", localSeq: 3 }));
      await queue.persistOperation(makeOp({ operationId: "a", localSeq: 1 }));
      await queue.persistOperation(makeOp({ operationId: "m", localSeq: 2 }));

      const pending = await queue.loadPending("game-1");
      expect(pending.map((o) => o.localSeq)).toEqual([1, 2, 3]);
    });

    it("only returns pending or sending states", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(
        makeOp({ operationId: "a", state: "pending" }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "b", state: "acknowledged" }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "c", state: "sending" }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "d", state: "rejected" }),
      );

      const ids = (await queue.loadPending("game-1"))
        .map((o) => o.operationId)
        .sort();
      expect(ids).toEqual(["a", "c"]);
    });

    it("returns empty array for an unknown game", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(makeOp());

      await expect(queue.loadPending("other-game")).resolves.toEqual([]);
    });

    it("upserts when operationId already exists", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(
        makeOp({ operationId: "fixed", payload: { v: 1 } }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "fixed", payload: { v: 2 } }),
      );

      const all = await queue.getAllByGame("game-1");
      expect(all).toHaveLength(1);
      expect(all[0].payload).toEqual({ v: 2 });
    });
  });

  // ── State transitions ──────────────────────────────────────────────

  describe("state transitions", () => {
    it("markSending updates state and increments attemptCount", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp();
      await queue.persistOperation(op);
      await queue.markSending(op.operationId);

      const all = await queue.getAllByGame("game-1");
      expect(all[0].state).toBe("sending");
      expect(all[0].attemptCount).toBe(1);
    });

    it("markSending increments attemptCount on repeated calls", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp();
      await queue.persistOperation(op);
      await queue.markSending(op.operationId);
      await queue.markSending(op.operationId);
      await queue.markSending(op.operationId);

      const all = await queue.getAllByGame("game-1");
      expect(all[0].attemptCount).toBe(3);
    });

    it("acknowledge sets state to acknowledged", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp();
      await queue.persistOperation(op);
      await queue.acknowledge(op.operationId);

      const all = await queue.getAllByGame("game-1");
      expect(all[0].state).toBe("acknowledged");
    });

    it("reject sets state and stores the error message", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp();
      await queue.persistOperation(op);
      await queue.reject(op.operationId, "413 payload too large");

      const all = await queue.getAllByGame("game-1");
      expect(all[0].state).toBe("rejected");
      expect(all[0].lastError).toBe("413 payload too large");
    });
  });

  // ── Clear acknowledged ─────────────────────────────────────────────

  describe("clearAcknowledged", () => {
    it("removes only acknowledged operations", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(
        makeOp({ operationId: "ack", state: "acknowledged" }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "pen", state: "pending" }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "rej", state: "rejected" }),
      );

      const count = await queue.clearAcknowledged("game-1");
      expect(count).toBe(1);

      const remaining = await queue.getAllByGame("game-1");
      expect(remaining.map((o) => o.operationId).sort()).toEqual([
        "pen",
        "rej",
      ]);
    });

    it("returns 0 when no acknowledged ops exist", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(makeOp({ state: "pending" }));

      await expect(queue.clearAcknowledged("game-1")).resolves.toBe(0);
    });

    it("scopes deletion to the given game", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(
        makeOp({
          operationId: "g1-ack",
          gameId: "game-1",
          state: "acknowledged",
        }),
      );
      await queue.persistOperation(
        makeOp({
          operationId: "g2-ack",
          gameId: "game-2",
          state: "acknowledged",
        }),
      );

      await queue.clearAcknowledged("game-1");
      const g2 = await queue.getAllByGame("game-2");
      expect(g2).toHaveLength(1);
    });
  });

  // ── Missing-operation resilience ───────────────────────────────────

  describe("missing-operation resilience", () => {
    it("markSending is a no-op for unknown operationId", async () => {
      const queue = await createPersistentQueue();
      await expect(queue.markSending("nope")).resolves.toBeUndefined();
    });

    it("acknowledge is a no-op for unknown operationId", async () => {
      const queue = await createPersistentQueue();
      await expect(queue.acknowledge("nope")).resolves.toBeUndefined();
    });

    it("reject is a no-op for unknown operationId", async () => {
      const queue = await createPersistentQueue();
      await expect(queue.reject("nope", "not found")).resolves.toBeUndefined();
    });
  });

  // ── getAllByGame ────────────────────────────────────────────────────

  describe("getAllByGame", () => {
    it("returns all operations for a game sorted by localSeq", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(
        makeOp({ operationId: "late", gameId: "g1", localSeq: 2 }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "early", gameId: "g1", localSeq: 1 }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "other", gameId: "g2", localSeq: 5 }),
      );

      const g1 = await queue.getAllByGame("g1");
      expect(g1.map((o) => o.operationId)).toEqual(["early", "late"]);

      const g2 = await queue.getAllByGame("g2");
      expect(g2).toHaveLength(1);
      expect(g2[0].operationId).toBe("other");
    });

    it("returns all states, not just pending/sending", async () => {
      const queue = await createPersistentQueue();
      await queue.persistOperation(
        makeOp({ operationId: "a", state: "acknowledged" }),
      );
      await queue.persistOperation(
        makeOp({ operationId: "b", state: "rejected" }),
      );

      const all = await queue.getAllByGame("game-1");
      expect(all).toHaveLength(2);
    });
  });

  // ── Serialization / data fidelity ──────────────────────────────────

  describe("serialization fidelity", () => {
    it("round-trips all fields unchanged", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp({
        operationId: "rt-1",
        gameId: "g-rt",
        trackerSessionId: "sess-xyz",
        clientId: "dev-abc",
        localSeq: 42,
        commandKind: "void_event",
        payload: { reason: "referee decision", eventId: "evt-9" },
        state: "pending",
        attemptCount: 2,
        lastError: "prev failure",
        createdAt: "2025-06-01T12:00:00.000Z",
        updatedAt: "2025-06-01T12:30:00.000Z",
      });
      await queue.persistOperation(op);

      const loaded = await queue.getAllByGame("g-rt");
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toEqual(op);
    });

    it("preserves deeply nested payloads", async () => {
      const queue = await createPersistentQueue();
      const payload = {
        event: {
          type: "score_change",
          teamId: "team-42",
          playerIds: ["p1", "p2"],
          coordinates: { x: 10, y: 20 },
        },
        metadata: { source: "referee" },
      };
      await queue.persistOperation(makeOp({ payload }));

      const loaded = await queue.getAllByGame("game-1");
      expect(loaded[0].payload).toEqual(payload);
    });

    it("returns deep copies (mutation safety)", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp();
      await queue.persistOperation(op);

      op.attemptCount = 999;
      op.payload = { mutated: true };

      const loaded = await queue.getAllByGame("game-1");
      expect(loaded[0].attemptCount).toBe(0);
      expect(loaded[0].payload).toEqual({ test: true });
    });
  });

  // ── Error handling ─────────────────────────────────────────────────

  describe("IndexedDB error handling", () => {
    it("rejects createPersistentQueue when openDB fails", async () => {
      mockOpenDB.mockRejectedValueOnce(new Error("IndexedDB unavailable"));
      await expect(createPersistentQueue()).rejects.toThrow(
        "IndexedDB unavailable",
      );
    });

    it("rejects persistOperation when the store put fails", async () => {
      const queue = await createPersistentQueue();
      dbPutThrowOnce(new DOMException("Quota exceeded", "QuotaExceededError"));

      await expect(queue.persistOperation(makeOp())).rejects.toThrow(
        "Quota exceeded",
      );
    });

    it("rejects loadPending when the IndexedDB lookup fails", async () => {
      const queue = await createPersistentQueue();
      const db = getDb();
      (
        db!.getAllFromIndex as ReturnType<typeof vi.fn>
      ).mockRejectedValueOnce(new Error("transaction aborted"));

      await expect(queue.loadPending("game-1")).rejects.toThrow(
        "transaction aborted",
      );
    });

    it("rejects acknowledge when the store operation fails", async () => {
      const queue = await createPersistentQueue();
      const op = makeOp();
      await queue.persistOperation(op);

      const db = getDb();
      (db!.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("disk failure"),
      );

      await expect(queue.acknowledge(op.operationId)).rejects.toThrow(
        "disk failure",
      );
    });
  });

  // ── v1 migration ───────────────────────────────────────────────────

  describe("v1 migration", () => {
    it("migrates complete legacy rows from the old queue store", async () => {
      seedLegacyStore([
        {
          localSeq: 5,
          synced: false,
          event: {
            game_id: "legacy-game",
            operation_id: "legacy-op-1",
            tracker_session_id: "legacy-session",
            client_id: "legacy-client",
          },
        },
      ]);

      const queue = await createPersistentQueue();

      const all = await queue.getAllByGame("legacy-game");
      expect(all).toHaveLength(1);
      expect(all[0].operationId).toBe("legacy-op-1");
      expect(all[0].gameId).toBe("legacy-game");
      expect(all[0].trackerSessionId).toBe("legacy-session");
      expect(all[0].clientId).toBe("legacy-client");
      expect(all[0].localSeq).toBe(5);
      expect(all[0].state).toBe("pending");
    });

    it("marks incomplete legacy rows as rejected", async () => {
      seedLegacyStore([
        {
          localSeq: 3,
          synced: false,
          event: { someField: true },
        },
      ]);

      const queue = await createPersistentQueue();
      const all = await queue.getAllByGame("unknown");
      expect(all).toHaveLength(1);
      expect(all[0].state).toBe("rejected");
      expect(all[0].lastError).toBe("incomplete v1 migration");
    });

    it("skips migration when no legacy store exists", async () => {
      // No legacy store seeded — migration should be a no-op
      const queue = await createPersistentQueue();
      await queue.persistOperation(makeOp({ operationId: "new-op" }));

      const all = await queue.getAllByGame("game-1");
      expect(all).toHaveLength(1);
      expect(all[0].operationId).toBe("new-op");
    });
  });
});
