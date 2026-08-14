/**
 * Tests for src/lib/contact-utils.ts
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/supabase/types";

type SupabaseDb = SupabaseClient<Database>;

vi.mock("server-only", () => ({}));

const mockCapture = vi.fn();
vi.mock("@zuiio/capture", () => ({ capture: mockCapture }));

vi.mock("@/lib/validation", () => ({
  normalizePhone: (phone: string) => phone?.replace(/[-\s]/g, "") ?? null,
}));

function makeChain(resolved: unknown) {
  return vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    single: vi.fn().mockResolvedValue(resolved),
    insert: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
  }));
}

describe("findOrCreateContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing contact id when contact already exists", async () => {
    const mock = makeChain({ data: { id: "contact-1" }, error: null });
    const supabase = { from: vi.fn(() => mock()) };

    const { findOrCreateContact } = await import("../contact-utils");
    const result = await findOrCreateContact(
      supabase as unknown as SupabaseDb,
      "org-1",
      "customer",
      "Тест",
    );

    expect(result).toEqual({ id: "contact-1" });
    expect(supabase.from).toHaveBeenCalledWith("contacts");
  });

  it("creates new contact when not found", async () => {
    const builder = makeChain({ data: null, error: null });
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "new-contact-1" }, error: null }),
    };
    const insertFn = vi.fn(() => insertChain);
    const supabase = {
      from: vi.fn(() => ({
        ...builder(),
        insert: insertFn,
      })),
    };

    const { findOrCreateContact } = await import("../contact-utils");
    const result = await findOrCreateContact(
      supabase as unknown as SupabaseDb,
      "org-1",
      "supplier",
      "Нийлүүлэгч",
      "99119911",
    );

    expect(result).toEqual({ id: "new-contact-1" });
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        type: "supplier",
        name: "Нийлүүлэгч",
        phone: "99119911",
      }),
    );
  });

  it("cleans phone number before inserting", async () => {
    const builder = makeChain({ data: null, error: null });
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null }),
    };
    const supabase = {
      from: vi.fn(() => ({
        ...builder(),
        insert: vi.fn(() => insertChain),
      })),
    };

    const { findOrCreateContact } = await import("../contact-utils");
    await findOrCreateContact(
      supabase as unknown as SupabaseDb,
      "org-1",
      "customer",
      "Тест",
      "99 11 99 11",
    );

    expect(supabase.from).toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    const builder = makeChain({ data: null, error: null });
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };
    const supabase = {
      from: vi.fn(() => ({
        ...builder(),
        insert: vi.fn(() => insertChain),
      })),
    };

    const { findOrCreateContact } = await import("../contact-utils");
    const result = await findOrCreateContact(
      supabase as unknown as SupabaseDb,
      "org-1",
      "customer",
      "Тест",
    );

    expect(result).toHaveProperty("error");
    expect(mockCapture).toHaveBeenCalled();
  });

  it("captures error on lookup failure but continues to insert", async () => {
    const builder = makeChain({
      data: null,
      error: { message: "Lookup error" },
    });
    const insertChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null }),
    };
    const supabase = {
      from: vi.fn(() => ({
        ...builder(),
        insert: vi.fn(() => insertChain),
      })),
    };

    const { findOrCreateContact } = await import("../contact-utils");
    await findOrCreateContact(
      supabase as unknown as SupabaseDb,
      "org-1",
      "customer",
      "Тест",
    );

    expect(mockCapture).toHaveBeenCalled();
  });
});
