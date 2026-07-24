/**
 * Tests for src/lib/contact-utils.ts — findOrCreateContact.
 */
import assert from "node:assert/strict";
import test, { mock } from "node:test";

mock.module("server-only", { exports: {} });
const captureSpy = mock.fn();
mock.module("@zuiio/capture", { exports: { capture: captureSpy } });
mock.module("@/lib/validation", {
  exports: {
    normalizePhone: mock.fn((p: string | null) => {
      if (!p) return null;
      const digits = p.replace(/\D/g, "");
      if (digits.startsWith("976")) return `+${digits}`;
      return digits;
    }),
  },
});

import { resolved } from "./actions-helpers";

let existingContact: { id: string } | null = null;
let existingError: Error | null = null;
let insertResponse = { data: { id: "new-contact-1" }, error: null };

function makeSupabase() {
  return {
    from: mock.fn((table: string) => {
      assert.equal(table, "contacts");
      const selectMock = mock.fn(() => ({
        eq: mock.fn(() => ({
          eq: mock.fn(() => ({
            eq: mock.fn(() => ({
              maybeSingle: mock.fn(async () => {
                if (existingError) return { data: null, error: existingError };
                if (existingContact) return resolved(existingContact);
                return resolved(null);
              }),
            })),
          })),
        })),
      }));
      const insertMock = mock.fn(() => ({
        select: mock.fn(() => ({
          single: mock.fn(async () => insertResponse),
        })),
      }));
      return { select: selectMock, insert: insertMock };
    }),
  };
}

let findOrCreateContact: (...args: unknown[]) => Promise<{ id: string } | { error: string }>;

test.before(async () => {
  const mod = await import("@/lib/contact-utils");
  findOrCreateContact = mod.findOrCreateContact;
});

test.beforeEach(() => {
  captureSpy.mock.resetCalls();
  existingContact = null;
  existingError = null;
  insertResponse = { data: { id: "new-contact-1" }, error: null };
});

test("findOrCreateContact returns existing contact when found", async () => {
  existingContact = { id: "existing-1" };
  const result = await findOrCreateContact(makeSupabase(), "org-123", "customer", "Test Customer");
  assert.ok("id" in result);
  if ("id" in result) assert.equal(result.id, "existing-1");
});

test("findOrCreateContact creates new contact when not found", async () => {
  const result = await findOrCreateContact(makeSupabase(), "org-123", "customer", "New Customer", "99112233");
  assert.ok("id" in result);
  if ("id" in result) assert.equal(result.id, "new-contact-1");
});

test("findOrCreateContact creates new contact with null phone", async () => {
  const result = await findOrCreateContact(makeSupabase(), "org-123", "supplier", "Supplier Co", null);
  assert.ok("id" in result);
  if ("id" in result) assert.equal(result.id, "new-contact-1");
});

test("findOrCreateContact returns error when insert fails", async () => {
  insertResponse = { data: null, error: new Error("insert failed") };
  const result = await findOrCreateContact(makeSupabase(), "org-123", "customer", "Fail Contact");
  assert.ok("error" in result);
  if ("error" in result) assert.ok(result.error.includes("алдаа"));
  assert.equal(captureSpy.mock.calls.length, 1);
});

test("findOrCreateContact captures error on find query failure", async () => {
  existingError = new Error("query timeout");
  const result = await findOrCreateContact(makeSupabase(), "org-123", "customer", "Retry Contact");
  assert.ok("id" in result);
  assert.equal(captureSpy.mock.calls.length, 1);
});
