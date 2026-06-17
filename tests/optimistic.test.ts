import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";

// ─── Helper to simulate the hooks' core logic ─────────────────────────

function simulateCreateOnMutate(
  queryClient: QueryClient,
  key: () => readonly string[],
  formData: FormData,
  buildOptimistic: (fd: FormData) => Record<string, unknown>,
) {
  // Snapshot
  const snapshot = queryClient
    .getQueriesData({ queryKey: key() })
    .map(([qk, data]) => [qk, structuredClone(data)] as const);

  const optimistic = buildOptimistic(formData);
  queryClient.setQueriesData({ queryKey: key() }, (old: unknown) => {
    if (Array.isArray(old)) return [optimistic, ...old];
    return old;
  });

  return snapshot;
}

function simulateDeleteOnMutate(
  queryClient: QueryClient,
  key: () => readonly string[],
  id: string,
) {
  const snapshot = queryClient
    .getQueriesData({ queryKey: key() })
    .map(([qk, data]) => [qk, structuredClone(data)] as const);

  queryClient.setQueriesData({ queryKey: key() }, (old: unknown) => {
    if (Array.isArray(old))
      return old.filter((item: Record<string, unknown>) => item.id !== id);
    return old;
  });

  return snapshot;
}

function simulateUpdateOnMutate(
  queryClient: QueryClient,
  key: () => readonly string[],
  id: string,
  updates: Record<string, unknown>,
) {
  const snapshot = queryClient
    .getQueriesData({ queryKey: key() })
    .map(([qk, data]) => [qk, structuredClone(data)] as const);

  queryClient.setQueriesData({ queryKey: key() }, (old: unknown) => {
    if (Array.isArray(old))
      return old.map((item: Record<string, unknown>) =>
        item.id === id ? { ...item, ...updates } : item,
      );
    return old;
  });

  return snapshot;
}

function simulateRollback(
  queryClient: QueryClient,
  snapshot: readonly (readonly [readonly string[], unknown])[],
) {
  for (const [qk, data] of snapshot) {
    queryClient.setQueryData(qk, data);
  }
}

// ─── useOptimisticCreate ──────────────────────────────────────────────

test("create: prepends item to existing list", () => {
  const qc = new QueryClient();
  qc.setQueryData(["test"], [{ id: "1", name: "Old" }]);

  const fd = new FormData();
  fd.append("name", "New");

  simulateCreateOnMutate(
    qc,
    () => ["test"],
    fd,
    (form) => ({
      id: "opt-1",
      name: form.get("name"),
    }),
  );

  const data = qc.getQueryData(["test"]) as Record<string, unknown>[];
  assert.equal(data.length, 2);
  assert.equal(data[0].name, "New");
  assert.equal(data[1].name, "Old");
});

test("create: does nothing for non-array caches", () => {
  const qc = new QueryClient();
  qc.setQueryData(["test"], { id: "1", name: "Single" });

  const fd = new FormData();
  simulateCreateOnMutate(
    qc,
    () => ["test"],
    fd,
    () => ({ id: "opt-1" }),
  );

  const data = qc.getQueryData(["test"]) as Record<string, unknown>;
  assert.equal(data.id, "1");
});

test("create: creates list when cache is empty", () => {
  const qc = new QueryClient();
  qc.setQueryData(["test"], []);

  const fd = new FormData();
  fd.append("name", "First");

  simulateCreateOnMutate(
    qc,
    () => ["test"],
    fd,
    (form) => ({
      id: "opt-1",
      name: form.get("name"),
    }),
  );

  const data = qc.getQueryData(["test"]) as Record<string, unknown>[];
  assert.equal(data.length, 1);
  assert.equal(data[0].name, "First");
});

test("create: rollback restores original data", () => {
  const qc = new QueryClient();
  qc.setQueryData(["test"], [{ id: "1", name: "Original" }]);

  const fd = new FormData();
  fd.append("name", "WillFail");

  const snapshot = simulateCreateOnMutate(
    qc,
    () => ["test"],
    fd,
    (form) => ({ id: "opt-1", name: form.get("name") }),
  );

  // Verify optimistic
  assert.equal((qc.getQueryData(["test"]) as unknown[]).length, 2);

  // Rollback
  simulateRollback(qc, snapshot);

  const data = qc.getQueryData(["test"]) as Record<string, unknown>[];
  assert.equal(data.length, 1);
  assert.equal(data[0].name, "Original");
});

// ─── useOptimisticDelete ──────────────────────────────────────────────

test("delete: removes item from list", () => {
  const qc = new QueryClient();
  qc.setQueryData(
    ["test"],
    [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
    ],
  );

  simulateDeleteOnMutate(qc, () => ["test"], "2");

  const data = qc.getQueryData(["test"]) as Record<string, unknown>[];
  assert.equal(data.length, 2);
  assert.equal(data[0].id, "1");
  assert.equal(data[1].id, "3");
});

test("delete: rollback restores removed items", () => {
  const qc = new QueryClient();
  qc.setQueryData(
    ["test"],
    [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
    ],
  );

  const snapshot = simulateDeleteOnMutate(qc, () => ["test"], "1");
  simulateRollback(qc, snapshot);

  const data = qc.getQueryData(["test"]) as Record<string, unknown>[];
  assert.equal(data.length, 2);
  assert.equal(data[0].id, "1");
});

// ─── useOptimisticUpdate ──────────────────────────────────────────────

test("update: merges partial into matching item", () => {
  const qc = new QueryClient();
  qc.setQueryData(
    ["test"],
    [
      { id: "1", name: "OldName", price: 100 },
      { id: "2", name: "Other", price: 200 },
    ],
  );

  simulateUpdateOnMutate(qc, () => ["test"], "1", {
    name: "NewName",
    price: 150,
  });

  const data = qc.getQueryData(["test"]) as Record<string, unknown>[];
  assert.equal(data[0].name, "NewName");
  assert.equal(data[0].price, 150);
  assert.equal(data[1].name, "Other"); // unchanged
});

test("update: ignores non-array caches", () => {
  const qc = new QueryClient();
  qc.setQueryData(["test"], { id: "1", name: "Single" });

  simulateUpdateOnMutate(qc, () => ["test"], "1", { name: "Changed" });

  const data = qc.getQueryData(["test"]) as Record<string, unknown>;
  assert.equal(data.name, "Single"); // unchanged
});

test("update: rollback restores original data", () => {
  const qc = new QueryClient();
  qc.setQueryData(["test"], [{ id: "1", name: "Original", price: 100 }]);

  const snapshot = simulateUpdateOnMutate(qc, () => ["test"], "1", {
    name: "Changed",
    price: 999,
  });

  simulateRollback(qc, snapshot);

  const data = qc.getQueryData(["test"]) as Record<string, unknown>[];
  assert.equal(data[0].name, "Original");
  assert.equal(data[0].price, 100);
});

// ─── Partial key matching ─────────────────────────────────────────────

test("create: matches sub-keys via partial prefix", () => {
  const qc = new QueryClient();
  qc.setQueryData(["test"], []);
  qc.setQueryData(["test", "list", "org1"], [{ id: "1", name: "InOrg1" }]);
  qc.setQueryData(["test", "detail", "1"], { id: "1", name: "Detail" });

  const fd = new FormData();
  fd.append("name", "New");

  const allKeys = () => ["test"] as const;
  simulateCreateOnMutate(qc, allKeys, fd, (form) => ({
    id: "opt-1",
    name: form.get("name"),
  }));

  // List cache updated
  const listData = qc.getQueryData(["test", "list", "org1"]) as Record<
    string,
    unknown
  >[];
  assert.equal(listData.length, 2);
  assert.equal(listData[0].name, "New");

  // Detail cache not affected (non-array)
  const detailData = qc.getQueryData(["test", "detail", "1"]);
  assert.equal((detailData as Record<string, unknown>).name, "Detail");
});
