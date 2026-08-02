/**
 * Tests for accounting/actions.ts — createJournalEntry, createAccount,
 * updateJournalEntry, deleteJournalEntry, toggleAccountActive.
 */
import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { formData, mockActionCtx, mockMod, resolved } from "./actions-helpers";

// ─── Standard mocks ──────────────────────────────────────────────────
const withDbCaptureMock = mock.fn(
  async (_name: string, query: Promise<unknown>) => {
    const result = await query;
    return result;
  },
);
const captureMock = mock.fn(() => {});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});

const revalidateEntitiesMock = mock.fn(() => {});
const revalidateEntityTagMock = mock.fn(() => {});
const revalidateEntityMock = mock.fn(() => {});
mockMod("@/lib/revalidate", {
  revalidateEntities: revalidateEntitiesMock,
  revalidateEntityTag: revalidateEntityTagMock,
  revalidateEntity: revalidateEntityMock,
});

mockMod("@/lib/audit", { logAuditEventWithClient: mock.fn(async () => {}) });
mockMod("next/server", { after: (fn: () => void) => fn() });
mockMod("next/cache", {
  revalidatePath: mock.fn(() => {}),
  revalidateTag: mock.fn(() => {}),
});
mockMod("server-only", {});

const mockCtx: Record<string, unknown> = mockActionCtx();
mockMod("@/lib/action-utils", {
  requireActionContext: mock.fn(async () => mockCtx),
  requireWriteAction: mock.fn(async () => mockCtx),
});

mockMod("@/lib/validation", {
  getString: mock.fn((fd: FormData, key: string) => String(fd.get(key) ?? "")),
});

// ─── Lazy-loaded module ──────────────────────────────────────────────
let createJournalEntry: Function;
let createAccount: Function;
let updateJournalEntry: Function;
let deleteJournalEntry: Function;
let toggleAccountActive: Function;

test.before(async () => {
  const mod = await import("@/app/(dashboard)/accounting/actions");
  createJournalEntry = mod.createJournalEntry;
  createAccount = mod.createAccount;
  updateJournalEntry = mod.updateJournalEntry;
  deleteJournalEntry = mod.deleteJournalEntry;
  toggleAccountActive = mod.toggleAccountActive;
});

function resetMocks() {
  captureMock.mock.resetCalls();
  revalidateEntitiesMock.mock.resetCalls();
  revalidateEntityTagMock.mock.resetCalls();
}

// ─── Chain helpers ────────────────────────────────────────────────────

/** Thenable chain: `await chain` resolves to {data, error}. */
function thenable(data: unknown = null, error: unknown = null) {
  const c: Record<string, unknown> = {};
  // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable in this test mock.
  c.then = (
    res: (value: { data: unknown; error: unknown }) => unknown,
    rej?: (reason: unknown) => unknown,
  ) => Promise.resolve({ data, error }).then(res, rej);
  c.select = mock.fn(() => c);
  c.insert = mock.fn(() => c);
  c.update = mock.fn(() => c);
  c.delete = mock.fn(() => c);
  c.eq = mock.fn(() => c);
  c.neq = mock.fn(() => c);
  c.is = mock.fn(() => c);
  c.single = mock.fn(() => resolved(data, error));
  c.maybeSingle = mock.fn(() => resolved(data, error));
  return c;
}

/** Fresh rpc mock: check_period_locked → false, generate number → JE-0001 */
function rpcNotLocked() {
  return mock.fn((name: string) => {
    if (name === "check_period_locked") return resolved(false);
    if (name === "generate_journal_entry_number") return resolved("JE-0001");
    return resolved(null);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// createJournalEntry
// ═══════════════════════════════════════════════════════════════════════

test("createJournalEntry rejects missing entry_date", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: mock.fn() };
  const result = await createJournalEntry(
    undefined,
    formData({ description: "Test", lines: "[]" }),
  );
  assert.match(result.error, /огноо/i);
});

test("createJournalEntry rejects missing description", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: rpcNotLocked() };
  const result = await createJournalEntry(
    undefined,
    formData({ entry_date: "2025-01-01", lines: "[]" }),
  );
  assert.match(result.error, /тайлбар/i);
});

test("createJournalEntry rejects missing lines", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: rpcNotLocked() };
  const result = await createJournalEntry(
    undefined,
    formData({ entry_date: "2025-01-01", description: "Test" }),
  );
  assert.match(result.error, /мөрүүд/i);
});

test("createJournalEntry rejects invalid lines JSON", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: rpcNotLocked() };
  const result = await createJournalEntry(
    undefined,
    formData({
      entry_date: "2025-01-01",
      description: "Test",
      lines: "not-json",
    }),
  );
  assert.match(result.error, /буруу/i);
});

test("createJournalEntry rejects empty lines array", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: rpcNotLocked() };
  const result = await createJournalEntry(
    undefined,
    formData({ entry_date: "2025-01-01", description: "Test", lines: "[]" }),
  );
  assert.match(result.error, /нэг мөр/i);
});

test("createJournalEntry rejects unbalanced debits/credits", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: rpcNotLocked() };
  const lines = JSON.stringify([
    { account_id: "a1", debit_amount: 100, credit_amount: 0 },
  ]);
  const result = await createJournalEntry(
    undefined,
    formData({ entry_date: "2025-01-01", description: "Test", lines }),
  );
  assert.match(result.error, /тэнцүү/i);
});

test("createJournalEntry creates successfully", async () => {
  resetMocks();
  const entryChain = thenable({ id: "new-entry-id" });
  const linesChain = thenable(null, null);
  mockCtx.supabase = {
    from: mock.fn((table: string) =>
      table === "journal_entries" ? entryChain : linesChain,
    ),
    rpc: rpcNotLocked(),
  };
  const lines = JSON.stringify([
    { account_id: "a1", debit_amount: 100, credit_amount: 0 },
    { account_id: "a2", debit_amount: 0, credit_amount: 100 },
  ]);
  const result = await createJournalEntry(
    undefined,
    formData({ entry_date: "2025-01-01", description: "Test entry", lines }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.calls.length, 1);
});

test("createJournalEntry handles period locked", async () => {
  resetMocks();
  const rpc = mock.fn((name: string) => {
    if (name === "check_period_locked") return resolved(true);
    return resolved(null);
  });
  mockCtx.supabase = { from: mock.fn(), rpc };
  const result = await createJournalEntry(
    undefined,
    formData({ entry_date: "2025-01-01", description: "Test", lines: "[]" }),
  );
  assert.match(result.error, /мөчлөг/i);
});

test("createJournalEntry handles insert error", async () => {
  resetMocks();
  const entryChain = thenable(null, { message: "insert failed" });
  mockCtx.supabase = {
    from: mock.fn((table: string) =>
      table === "journal_entries" ? entryChain : thenable(),
    ),
    rpc: rpcNotLocked(),
  };
  const lines = JSON.stringify([
    { account_id: "a1", debit_amount: 100, credit_amount: 0 },
    { account_id: "a2", debit_amount: 0, credit_amount: 100 },
  ]);
  const result = await createJournalEntry(
    undefined,
    formData({ entry_date: "2025-01-01", description: "Test entry", lines }),
  );
  assert.match(result.error, /алдаа/i);
});

// ═══════════════════════════════════════════════════════════════════════
// createAccount
// ═══════════════════════════════════════════════════════════════════════

test("createAccount rejects missing code", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: mock.fn() };
  const result = await createAccount(
    undefined,
    formData({ name: "Test Account", type: "asset" }),
  );
  assert.match(result.error, /код/i);
});

test("createAccount rejects invalid type", async () => {
  resetMocks();
  mockCtx.supabase = { from: mock.fn(), rpc: mock.fn() };
  const result = await createAccount(
    undefined,
    formData({ code: "1000", name: "Test Account", type: "invalid" }),
  );
  assert.match(result.error, /төрөл/i);
});

test("createAccount rejects duplicate code", async () => {
  resetMocks();
  const coaChain = thenable(null, null);
  coaChain.maybeSingle = mock.fn(() => resolved({ id: "existing-id" }, null));
  mockCtx.supabase = {
    from: mock.fn(() => coaChain),
    rpc: mock.fn(),
  };
  const result = await createAccount(
    undefined,
    formData({ code: "1000", name: "Test Account", type: "asset" }),
  );
  assert.match(result.error, /бүртгэгдсэн/i);
});

test("createAccount creates successfully", async () => {
  resetMocks();
  const coaChain = thenable(null, null);
  coaChain.single = mock.fn(() => resolved({ id: "new-account-id" }, null));
  mockCtx.supabase = {
    from: mock.fn(() => coaChain),
    rpc: mock.fn(),
  };
  const result = await createAccount(
    undefined,
    formData({ code: "1000", name: "Test Account", type: "asset" }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.calls.length, 1);
});

// ═══════════════════════════════════════════════════════════════════════
// updateJournalEntry
// ═══════════════════════════════════════════════════════════════════════

const BALANCED_LINES = JSON.stringify([
  { account_id: "a1", debit_amount: 100, credit_amount: 0 },
  { account_id: "a2", debit_amount: 0, credit_amount: 100 },
]);

const OLD_LINES = [
  { account_id: "old-a1", debit_amount: 50, credit_amount: 0 },
  { account_id: "old-a2", debit_amount: 0, credit_amount: 50 },
];

test("updateJournalEntry updates successfully", async () => {
  resetMocks();
  const entryUpdateChain = thenable(null, null);
  entryUpdateChain.eq = mock.fn(() => entryUpdateChain);

  const selectChain = thenable(OLD_LINES, null);
  selectChain.eq = mock.fn(() => selectChain);

  const deleteChain = thenable(null, null);
  deleteChain.eq = mock.fn(() => deleteChain);

  const journalLines = {
    select: mock.fn(() => selectChain),
    delete: mock.fn(() => deleteChain),
    insert: mock.fn(() => thenable(null, null)),
  };

  mockCtx.supabase = {
    from: mock.fn((table: string) => {
      if (table === "journal_entries")
        return { update: mock.fn(() => entryUpdateChain) };
      if (table === "journal_entry_lines") return journalLines;
      return thenable();
    }),
    rpc: mock.fn(),
  };

  const result = await updateJournalEntry(
    undefined,
    formData({
      id: "test-entry-id",
      entry_date: "2025-01-15",
      description: "Updated entry",
      lines: BALANCED_LINES,
    }),
  );
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.calls.length, 1);
});

test("updateJournalEntry rolls back old lines on insert error", async () => {
  resetMocks();
  const entryUpdateChain = thenable(null, null);
  entryUpdateChain.eq = mock.fn(() => entryUpdateChain);

  const selectChain = thenable(OLD_LINES, null);
  selectChain.eq = mock.fn(() => selectChain);

  const deleteChain = thenable(null, null);
  deleteChain.eq = mock.fn(() => deleteChain);

  let insertCount = 0;
  const journalLines = {
    select: mock.fn(() => selectChain),
    delete: mock.fn(() => deleteChain),
    insert: mock.fn(() => {
      insertCount++;
      if (insertCount === 1)
        return thenable(null, { message: "insert failed" });
      return thenable(null, null);
    }),
  };

  mockCtx.supabase = {
    from: mock.fn((table: string) => {
      if (table === "journal_entries")
        return { update: mock.fn(() => entryUpdateChain) };
      if (table === "journal_entry_lines") return journalLines;
      return thenable();
    }),
    rpc: mock.fn(),
  };

  const result = await updateJournalEntry(
    undefined,
    formData({
      id: "test-entry-id",
      entry_date: "2025-01-15",
      description: "Updated entry",
      lines: BALANCED_LINES,
    }),
  );
  assert.match(result.error, /алдаа/i);
  assert.strictEqual(journalLines.insert.mock.calls.length, 2);
});

test("updateJournalEntry handles entry update error", async () => {
  resetMocks();
  const entryUpdateChain = thenable(null, { message: "update failed" });
  entryUpdateChain.eq = mock.fn(() => entryUpdateChain);

  mockCtx.supabase = {
    from: mock.fn((table: string) => {
      if (table === "journal_entries")
        return { update: mock.fn(() => entryUpdateChain) };
      return thenable();
    }),
    rpc: mock.fn(),
  };

  const result = await updateJournalEntry(
    undefined,
    formData({
      id: "test-entry-id",
      entry_date: "2025-01-15",
      description: "Updated entry",
      lines: BALANCED_LINES,
    }),
  );
  assert.match(result.error, /алдаа/i);
});

// ═══════════════════════════════════════════════════════════════════════
// deleteJournalEntry
// ═══════════════════════════════════════════════════════════════════════

test("deleteJournalEntry soft deletes successfully", async () => {
  resetMocks();
  const verifyChain = thenable({ id: "test-entry-id" }, null);
  verifyChain.eq = mock.fn(() => verifyChain);
  verifyChain.is = mock.fn(() => verifyChain);

  mockCtx.supabase = {
    from: mock.fn(() => ({
      select: mock.fn(() => verifyChain),
    })),
    rpc: mock.fn((name: string) => {
      if (name === "soft_delete_record") return resolved(null, null);
      return resolved(null);
    }),
  };

  const result = await deleteJournalEntry("test-entry-id");
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.calls.length, 1);
});

// ═══════════════════════════════════════════════════════════════════════
// toggleAccountActive
// ═══════════════════════════════════════════════════════════════════════

test("toggleAccountActive toggles successfully", async () => {
  resetMocks();
  const toggleChain = thenable(null, null);
  toggleChain.eq = mock.fn(() => toggleChain);

  mockCtx.supabase = {
    from: mock.fn(() => ({
      update: mock.fn(() => toggleChain),
    })),
    rpc: mock.fn(),
  };

  const result = await toggleAccountActive("test-account-id", true);
  assert.deepStrictEqual(result, { success: true, error: undefined });
  assert.strictEqual(revalidateEntitiesMock.mock.calls.length, 1);
});
