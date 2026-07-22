/**
 * Tests for src/lib/accounting-utils.ts — createJournalEntry.
 */

import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

// ─── Mocks ────────────────────────────────────────────────────────────

const captureSpy = mock.fn();
mockMod("@zuiio/capture", { capture: captureSpy });
mockMod("server-only", {});

// Mock next/server after
const afterSpy = mock.fn((fn: () => void) => fn());
mockMod("next/server", { after: afterSpy });

// Mock audit
mockMod("@/lib/audit", {
  logAuditEventWithClient: mock.fn(async () => {}),
});

// ─── State for mock builders ──────────────────────────────────────────

let periodLocked = false;
let accountsResult: { id: string; code: string }[] = [];
let entryNumber = "JV-2025-0001";
let journalEntryResult: { data: unknown; error: unknown } = resolved({ id: "je-1" });
let linesError: Error | null = null;

function makeSupabase() {
  return {
    rpc: mock.fn((fnName: string, _params?: Record<string, unknown>) => {
      if (fnName === "check_period_locked") {
        return { data: periodLocked, error: null };
      }
      if (fnName === "generate_journal_entry_number") {
        return { data: entryNumber, error: null };
      }
      throw new Error(`Unexpected RPC: ${fnName}`);
    }),
    from: mock.fn((table: string) => {
      if (table === "chart_of_accounts") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              in: mock.fn(async () => resolved(accountsResult)),
            })),
          })),
        };
      }
      if (table === "journal_entries") {
        return {
          insert: mock.fn(() => ({
            select: mock.fn(() => ({
              single: mock.fn(async () => journalEntryResult),
            })),
          })),
        };
      }
      if (table === "journal_entry_lines") {
        return {
          insert: mock.fn(async () => {
            if (linesError) return { error: linesError };
            return { error: null };
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

let createJournalEntry: (...args: unknown[]) => Promise<{ success: boolean; error?: string }>;

test.before(async () => {
  const mod = await import("@/lib/accounting-utils");
  createJournalEntry = mod.createJournalEntry;
});

test.beforeEach(() => {
  captureSpy.mock.resetCalls();
  afterSpy.mock.resetCalls();
  periodLocked = false;
  accountsResult = [
    { id: "acc-1", code: "1000" },
    { id: "acc-2", code: "4000" },
  ];
  entryNumber = "JV-2025-0001";
  journalEntryResult = resolved({ id: "je-1" });
  linesError = null;
});

test("createJournalEntry creates journal entry with valid lines", async () => {
  const result = await createJournalEntry(makeSupabase(), {
    organizationId: "org-123",
    userId: "user-1",
    branchId: "branch-1",
    referenceType: "sale",
    referenceId: "sale-1",
    entryDate: "2025-01-15",
    description: "Test entry",
    accountCodes: ["1000", "4000"],
    lines: [
      { account_id: "1000", debit_amount: 10000, credit_amount: 0 },
      { account_id: "4000", debit_amount: 0, credit_amount: 10000 },
    ],
  });

  assert.equal(result.success, true);
});

test("createJournalEntry returns error when period is locked", async () => {
  periodLocked = true;

  const result = await createJournalEntry(makeSupabase(), {
    organizationId: "org-123",
    userId: "user-1",
    branchId: "branch-1",
    referenceType: "sale",
    referenceId: "sale-1",
    entryDate: "2025-01-15",
    description: "Test",
    accountCodes: ["1000", "4000"],
    lines: [
      { account_id: "1000", debit_amount: 10000, credit_amount: 0 },
      { account_id: "4000", debit_amount: 0, credit_amount: 10000 },
    ],
  });

  assert.equal(result.success, false);
  assert.ok(result.error?.includes("хаагдсан"));
});

test("createJournalEntry returns error when accounts not found", async () => {
  accountsResult = [];

  const result = await createJournalEntry(makeSupabase(), {
    organizationId: "org-123",
    userId: "user-1",
    branchId: "branch-1",
    referenceType: "sale",
    referenceId: "sale-1",
    entryDate: "2025-01-15",
    description: "Test",
    accountCodes: ["9999"],
    lines: [
      { account_id: "9999", debit_amount: 10000, credit_amount: 0 },
      { account_id: "8888", debit_amount: 0, credit_amount: 10000 },
    ],
  });

  assert.equal(result.success, false);
  assert.ok(result.error);
});

test("createJournalEntry returns error for unbalanced entry", async () => {
  const result = await createJournalEntry(makeSupabase(), {
    organizationId: "org-123",
    userId: "user-1",
    branchId: "branch-1",
    referenceType: "sale",
    referenceId: "sale-1",
    entryDate: "2025-01-15",
    description: "Unbalanced",
    accountCodes: ["1000", "4000"],
    lines: [
      { account_id: "1000", debit_amount: 10000, credit_amount: 0 },
      { account_id: "4000", debit_amount: 0, credit_amount: 5000 },
    ],
  });

  assert.equal(result.success, false);
  assert.ok(result.error?.includes("тэнцүү"));
});

test("createJournalEntry handles journal entry creation error", async () => {
  journalEntryResult = { data: null, error: new Error("Insert failed") };

  const result = await createJournalEntry(makeSupabase(), {
    organizationId: "org-123",
    userId: "user-1",
    branchId: "branch-1",
    referenceType: "sale",
    referenceId: "sale-1",
    entryDate: "2025-01-15",
    description: "Test",
    accountCodes: ["1000", "4000"],
    lines: [
      { account_id: "1000", debit_amount: 10000, credit_amount: 0 },
      { account_id: "4000", debit_amount: 0, credit_amount: 10000 },
    ],
  });

  assert.equal(result.success, false);
});

test("createJournalEntry handles lines insert error", async () => {
  linesError = new Error("Lines insert failed");

  const result = await createJournalEntry(makeSupabase(), {
    organizationId: "org-123",
    userId: "user-1",
    branchId: "branch-1",
    referenceType: "sale",
    referenceId: "sale-1",
    entryDate: "2025-01-15",
    description: "Test",
    accountCodes: ["1000", "4000"],
    lines: [
      { account_id: "1000", debit_amount: 10000, credit_amount: 0 },
      { account_id: "4000", debit_amount: 0, credit_amount: 10000 },
    ],
  });

  assert.equal(result.success, false);
});
