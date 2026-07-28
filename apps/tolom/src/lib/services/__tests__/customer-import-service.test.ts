import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));

vi.mock("p-map", () => ({
  default: vi.fn((items: unknown[], fn: (item: unknown) => unknown) =>
    Promise.all(items.map(fn)),
  ),
}));

vi.mock("papaparse", () => ({
  default: { parse: vi.fn() },
}));

import { revalidateTag } from "next/cache";
import { ValidationError } from "@/lib/errors";

const mockRevalidateTag = vi.mocked(revalidateTag);

import pMap from "p-map";
import Papa from "papaparse";

const mockPapaParse = vi.mocked(Papa.parse);
const mockPMap = vi.mocked(pMap);

import { importCustomers } from "../customer-import-service";

const ORG_ID = "org-1";
const USER_ID = "user-1";

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── importCustomers ───────────────────────────────────────────────

describe("importCustomers", () => {
  const validCsvRow = {
    firstName: "John",
    lastName: "Doe",
    phone: "+976-99112233",
    email: "john@example.com",
    address: "123 Main St",
    notes: "Regular customer",
    type: "individual",
    source: "walk-in",
  };

  it("imports valid CSV rows successfully", async () => {
    mockPapaParse.mockReturnValue({
      data: [validCsvRow],
      errors: [],
      meta: {
        fields: [
          "firstName",
          "lastName",
          "phone",
          "email",
          "address",
          "notes",
          "type",
          "source",
        ],
      },
    } as never);

    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [{ id: "c1" }], error: null });

    const result = await importCustomers(
      db as never,
      ORG_ID,
      "csv,content",
      USER_ID,
    );

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("handles CSV with alternate column names (first_name)", async () => {
    const rowWithAltNames = {
      first_name: "Jane",
      last_name: "Smith",
      phone: "+976-99556677",
    };
    mockPapaParse.mockReturnValue({
      data: [rowWithAltNames],
      errors: [],
      meta: { fields: ["first_name", "last_name", "phone"] },
    } as never);

    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [{ id: "c2" }], error: null });

    const result = await importCustomers(
      db as never,
      ORG_ID,
      "csv,content",
      USER_ID,
    );

    expect(result.imported).toBe(1);
  });

  it("throws ValidationError on CSV parse error", async () => {
    mockPapaParse.mockReturnValue({
      data: [],
      errors: [{ row: 1, message: "Unexpected quote character" }],
      meta: { fields: [] },
    } as never);

    await expect(
      importCustomers(db as never, ORG_ID, "bad csv", USER_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when CSV has no content", async () => {
    mockPapaParse.mockReturnValue({
      data: [],
      errors: [],
      meta: { fields: [] },
    } as never);

    await expect(
      importCustomers(db as never, ORG_ID, "", USER_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when CSV has no expected headers", async () => {
    mockPapaParse.mockReturnValue({
      data: [{ unknown: "data" }],
      errors: [],
      meta: { fields: ["unknown"] },
    } as never);

    await expect(
      importCustomers(db as never, ORG_ID, "unknown,data", USER_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("reports per-row errors for missing identifying fields", async () => {
    mockPapaParse.mockReturnValue({
      data: [
        { firstName: "Valid", phone: "+976-1111" },
        { notes: "Missing all required fields" },
        { email: "valid@example.com" },
      ],
      errors: [],
      meta: { fields: ["firstName", "phone", "notes", "email"] },
    } as never);

    db.__qb.resolveOnce({ data: [], error: null });
    db.__qb.resolveOnce({ data: [{ id: "c1" }, { id: "c2" }], error: null });

    const result = await importCustomers(
      db as never,
      ORG_ID,
      "csv,content",
      USER_ID,
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3);
    expect(result.errors[0].message).toContain("Missing identifying fields");
    expect(result.imported).toBe(2);
  });

  it("skips duplicate phone numbers", async () => {
    mockPapaParse.mockReturnValue({
      data: [
        { firstName: "Alice", phone: "+976-1111" },
        { firstName: "Bob", phone: "+976-1111" },
      ],
      errors: [],
      meta: { fields: ["firstName", "phone"] },
    } as never);

    // No existing phones in DB — duplicates are within the CSV rows
    db.__qb.resolveOnce({ data: [], error: null });

    // Batch insert fails because both rows have the same phone
    // (unique constraint on organization_id + phone)
    db.__qb.resolveOnce({
      data: null,
      error: new Error("duplicate key value violates unique constraint"),
    });

    // Individual inserts: first succeeds, second fails as duplicate
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("duplicate key value violates unique constraint"),
    });

    const result = await importCustomers(
      db as never,
      ORG_ID,
      "csv,content",
      USER_ID,
    );

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Duplicate phone");
  });

  it("returns imported=0 when all rows fail validation", async () => {
    mockPapaParse.mockReturnValue({
      data: [{ notes: "no id fields" }, { notes: "also no id fields" }],
      errors: [],
      meta: { fields: ["notes"] },
    } as never);

    const result = await importCustomers(
      db as never,
      ORG_ID,
      "csv,content",
      USER_ID,
    );

    expect(result.imported).toBe(0);
    expect(result.errors).toHaveLength(2);
  });

  it("falls back to individual inserts when batch insert fails", async () => {
    mockPapaParse.mockReturnValue({
      data: [
        { firstName: "John", phone: "+976-1111" },
        { firstName: "Jane", phone: "+976-2222" },
      ],
      errors: [],
      meta: { fields: ["firstName", "phone"] },
    } as never);

    db.__qb.resolveOnce({ data: [], error: null });

    mockPMap.mockImplementationOnce(
      async (_items: unknown[], fn: (item: unknown) => unknown) => [
        await fn(_items[0]),
      ],
    );

    // Batch insert → fails, triggering fallback
    db.__qb.resolveOnce({
      data: null,
      error: new Error("Batch insert failed"),
    });

    // Inner pMap (fallback): calls the per-row callback for each row
    mockPMap.mockImplementationOnce(
      async (_items: unknown[], fn: (item: unknown) => unknown) =>
        Promise.all(_items.map(fn)),
    );

    // Individual insert: first succeeds, second fails as duplicate
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({
      data: null,
      error: new Error("duplicate key violates unique constraint"),
    });

    const result = await importCustomers(
      db as never,
      ORG_ID,
      "csv,content",
      USER_ID,
    );

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});
