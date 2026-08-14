import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod, resolved } from "./actions-helpers";

const captureMock = mock.fn(() => {});
const withDbCaptureMock = mock.fn(async (_name, query) => {
  const result = await query;
  return result;
});
mockMod("@zuiio/capture", {
  capture: captureMock,
  withDbCapture: withDbCaptureMock,
});
mockMod("server-only", {});
mockMod("@/lib/format", { formatCurrency: mock.fn((n: number) => `₮${n}`) });

interface MockEntry {
  entry_type: string;
  amount: number;
}
let mockEntries: MockEntry[] = [];
let mockContact: Promise<{
  data: Record<string, unknown> | null;
  error: unknown;
}> | null = null;

function makeSupabase() {
  return {
    from: mock.fn((table: string) => {
      if (table === "customer_account_entries") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(async () => resolved(mockEntries)),
            })),
          })),
          insert: mock.fn(() => ({
            select: mock.fn(() => ({
              single: mock.fn(async () => resolved({ id: "entry-1" })),
            })),
          })),
        };
      }
      if (table === "contacts") {
        return {
          select: mock.fn(() => ({
            eq: mock.fn(() => ({
              eq: mock.fn(() => ({
                single: mock.fn(
                  async () =>
                    mockContact ?? resolved(null, new Error("not found")),
                ),
              })),
            })),
          })),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

// Unchecked cast — mock supabase satisfies the SupabaseClient interface structurally
const mockSupabase = () => makeSupabase() as unknown as Record<string, unknown>;

let creditAccounts: typeof import("@/lib/credit-accounts");
test.before(async () => {
  creditAccounts = await import("@/lib/credit-accounts");
});

test.beforeEach(() => {
  captureMock.mock.resetCalls();
  withDbCaptureMock.mock.resetCalls();
  mockEntries = [];
  mockContact = null;
});

// ─── getContactBalance ──────────────────────────────────────────────

test("getContactBalance returns 0 for no entries", async () => {
  mockEntries = [];
  const balance = await creditAccounts.getContactBalance(
    mockSupabase(),
    "org-1",
    "contact-1",
  );
  assert.equal(balance, 0);
});

test("getContactBalance calculates balance correctly (sale_debit 1000, payment_credit 300 → 700)", async () => {
  mockEntries = [
    { entry_type: "sale_debit", amount: 1000 },
    { entry_type: "payment_credit", amount: 300 },
  ];
  const balance = await creditAccounts.getContactBalance(
    mockSupabase(),
    "org-1",
    "contact-1",
  );
  assert.equal(balance, 700);
});

test("getContactBalance handles multiple entry types", async () => {
  mockEntries = [
    { entry_type: "sale_debit", amount: 1000 }, // +1000
    { entry_type: "payment_credit", amount: 200 }, // -200
    { entry_type: "refund", amount: 100 }, // -100
    { entry_type: "adjustment", amount: 50 }, // +50
  ];
  const balance = await creditAccounts.getContactBalance(
    mockSupabase(),
    "org-1",
    "contact-1",
  );
  assert.equal(balance, 750);
});

test("getContactBalance throws on query error", async () => {
  withDbCaptureMock.mock.mockImplementationOnce(async () => ({
    data: null,
    error: new Error("db failure"),
  }));

  await assert.rejects(
    () =>
      creditAccounts.getContactBalance(mockSupabase(), "org-1", "contact-1"),
    { message: "Үйлчлүгчийн үлдэгдэл татахад алдаа гарлаа." },
  );
  assert.equal(captureMock.mock.callCount(), 1);
});

// ─── getAvailableCredit ─────────────────────────────────────────────

test("getAvailableCredit returns available credit when limit set", async () => {
  mockContact = resolved({ credit_limit: 5000 });
  mockEntries = [{ entry_type: "sale_debit", amount: 1000 }];

  const result = await creditAccounts.getAvailableCredit(
    mockSupabase(),
    "org-1",
    "contact-1",
  );
  assert.deepEqual(result, {
    balance: 1000,
    creditLimit: 5000,
    available: 4000,
  });
});

test("getAvailableCredit returns null available when no credit limit", async () => {
  mockContact = resolved({ credit_limit: null });
  mockEntries = [{ entry_type: "sale_debit", amount: 500 }];

  const result = await creditAccounts.getAvailableCredit(
    mockSupabase(),
    "org-1",
    "contact-1",
  );
  assert.deepEqual(result, {
    balance: 500,
    creditLimit: null,
    available: null,
  });
});

test("getAvailableCredit throws when contact not found", async () => {
  mockContact = null;

  await assert.rejects(
    () =>
      creditAccounts.getAvailableCredit(mockSupabase(), "org-1", "contact-1"),
    { message: "Үйлчлүгчийн мэдээлэл олдсонгүй." },
  );
  assert.equal(captureMock.mock.callCount(), 1);
});

// ─── createAccountEntry ─────────────────────────────────────────────

test("createAccountEntry rejects negative amount", async () => {
  const result = await creditAccounts.createAccountEntry(mockSupabase(), {
    organizationId: "org-1",
    contactId: "contact-1",
    entryType: "sale_debit",
    amount: -100,
  });
  assert.deepEqual(result, {
    success: false,
    error: "Бүртгэлийн дүн сөрөг байж болохгүй. Засварын төрөл сонгоно уу.",
  });
});

test("createAccountEntry inserts entry successfully", async () => {
  const result = await creditAccounts.createAccountEntry(mockSupabase(), {
    organizationId: "org-1",
    contactId: "contact-1",
    entryType: "payment_credit",
    amount: 500,
  });
  assert.deepEqual(result, { success: true, entryId: "entry-1" });
});

test("createAccountEntry handles insert error", async () => {
  withDbCaptureMock.mock.mockImplementationOnce(async () => ({
    data: null,
    error: new Error("insert failed"),
  }));

  const result = await creditAccounts.createAccountEntry(mockSupabase(), {
    organizationId: "org-1",
    contactId: "contact-1",
    entryType: "sale_debit",
    amount: 100,
  });
  assert.deepEqual(result, { success: false, error: "insert failed" });
  assert.equal(captureMock.mock.callCount(), 1);
});

// ─── checkCreditLimit ───────────────────────────────────────────────

test("checkCreditLimit allows when no credit limit → allowed: true", async () => {
  mockContact = resolved({ credit_limit: null });
  mockEntries = [];

  const result = await creditAccounts.checkCreditLimit(
    mockSupabase(),
    "org-1",
    "contact-1",
    1000,
  );
  assert.deepEqual(result, { allowed: true });
});

test("checkCreditLimit allows when within limit → allowed: true", async () => {
  mockContact = resolved({ credit_limit: 5000 });
  mockEntries = [{ entry_type: "sale_debit", amount: 1000 }];

  // balance=1000, limit=5000, sale=3000 → projected=4000 ≤ 5000
  const result = await creditAccounts.checkCreditLimit(
    mockSupabase(),
    "org-1",
    "contact-1",
    3000,
  );
  assert.deepEqual(result, { allowed: true });
});

test("checkCreditLimit rejects when over limit → allowed: false with reason", async () => {
  mockContact = resolved({ credit_limit: 5000 });
  mockEntries = [{ entry_type: "sale_debit", amount: 4000 }];

  // balance=4000, limit=5000, sale=2000 → projected=6000 > 5000
  const result = await creditAccounts.checkCreditLimit(
    mockSupabase(),
    "org-1",
    "contact-1",
    2000,
  );
  assert.equal(result.allowed, false);
  assert.match(result.reason!, /Зээлийн хязгаар хэтэрсэн/);
  assert.match(result.reason!, /₮5000/);
  assert.match(result.reason!, /₮4000/);
  assert.match(result.reason!, /₮2000/);
  assert.match(result.reason!, /₮1000/);
});
