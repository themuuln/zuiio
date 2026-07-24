import { beforeEach, describe, expect, it, vi } from "vitest";
import { cacheTags } from "@/lib/cache/keys";
import { ValidationError } from "@/lib/errors";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { importParts } from "./part-import-service";

vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key: unknown, fn: () => unknown) => fn()),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const mockClient = createMockSupabaseClient();

// `from()` always returns the same internal query builder, so we can reach
// `.single()` / `.insert()` / `.select()` through it.
const qb = mockClient.from("parts_catalog");

const revalidateTag = vi.mocked(await import("next/cache")).revalidateTag;

// A valid CSV with a header row + 2 data rows.
const VALID_CSV = [
  "name,name_mn,part_number,barcode,category,description,unit,default_price,purchase_price,location",
  "Oil Filter,Тосны шүүлтүүр,OF-123,12345,Filters,Engine oil filter,piece,15000,10000,Shelf A",
  "Brake Pad,Тормозны хальтса,BP-456,,Brakes,,piece,25000,20000,Shelf B",
].join("\n");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("importParts", () => {
  it("inserts every valid row, scopes to org, applies defaults, and revalidates", async () => {
    // Non-terminal insert(...).select("id") resolves via __qb.resolveWith
    mockClient.__qb.resolveWith({
      error: null,
      data: [{ id: "p-1" }, { id: "p-2" }],
    });

    const result = await importParts(
      mockClient as never,
      "org-1",
      VALID_CSV,
      "user-1",
    );

    expect(result.imported).toBe(2);
    expect(result.errors).toHaveLength(0);

    // One batched insert with both rows
    expect(qb.insert).toHaveBeenCalledTimes(1);
    const inserted = qb.insert.mock.calls[0]?.[0] as Record<string, unknown>[];
    expect(inserted).toHaveLength(2);

    // Org isolation + audit fields on every row
    for (const row of inserted) {
      expect(row.organization_id).toBe("org-1");
      expect(row.created_by).toBe("user-1");
      expect(row.is_active).toBe(true);
    }

    // Numeric prices parsed from strings
    expect(inserted[0].name).toBe("Oil Filter");
    expect(inserted[0].name_mn).toBe("Тосны шүүлтүүр");
    // unit defaults to "piece" when missing
    expect(inserted[1].unit).toBe("piece");
    expect(inserted[0].default_price).toBe(15000);
    expect(inserted[0].purchase_price).toBe(10000);
    // null for blank optional fields
    expect(inserted[1].barcode).toBeNull();

    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.partsCatalog("org-1"),
      "max",
    );
  });

  it("uses name_mn as the display name when name is blank", async () => {
    const csv = [
      "name,name_mn,part_number,category",
      ",Зөөлөн сэлбэг,SP-1,Spare",
    ].join("\n");
    mockClient.__qb.resolveWith({ error: null, data: [{ id: "p-1" }] });

    const result = await importParts(
      mockClient as never,
      "org-1",
      csv,
      "user-1",
    );

    expect(result.imported).toBe(1);
    const inserted = qb.insert.mock.calls[0]?.[0] as Record<string, unknown>[];
    expect(inserted[0].name).toBe("Зөөлөн сэлбэг");
    expect(inserted[0].name_mn).toBe("Зөөлөн сэлбэг");
  });

  it("skips rows missing name and name_mn, recording a per-row error", async () => {
    const csv = [
      "name,name_mn,part_number",
      "Good Part,Сайн хэсэг,GP-1",
      ",,", // no name, no name_mn → invalid
    ].join("\n");
    mockClient.__qb.resolveWith({ error: null, data: [{ id: "p-1" }] });

    const result = await importParts(
      mockClient as never,
      "org-1",
      csv,
      "user-1",
    );

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      row: 2,
      message: expect.stringContaining("name or name_mn"),
    });
    // Only the valid row was inserted
    const inserted = qb.insert.mock.calls[0]?.[0] as Record<string, unknown>[];
    expect(inserted).toHaveLength(1);
    expect(inserted[0].name).toBe("Good Part");
  });

  it("returns zero imported for a header-only CSV but still revalidates", async () => {
    const csv = "name,name_mn,part_number";
    const result = await importParts(
      mockClient as never,
      "org-1",
      csv,
      "user-1",
    );

    expect(result.imported).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(qb.insert).not.toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith(
      cacheTags.partsCatalog("org-1"),
      "max",
    );
  });

  it("falls back to per-row insert when the batch insert fails, counting successes and failures", async () => {
    // First (batched) insert fails
    mockClient.__qb.resolveWith({
      error: { message: "batch failed" },
      data: null,
    });
    // Per-row inserts resolve via .single(): row 1 ok, row 2 fails
    qb.single
      .mockResolvedValueOnce({ data: { id: "p-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "dup key" } });

    const result = await importParts(
      mockClient as never,
      "org-1",
      VALID_CSV,
      "user-1",
    );

    // 1 success counted, 1 failure recorded
    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ row: 2, message: "dup key" });
    // Batched insert + 2 single inserts = 3 total insert calls
    expect(qb.insert).toHaveBeenCalledTimes(3);
  });

  it("throws ValidationError on an unparseable CSV", async () => {
    // Unterminated quoted field forces a Papa parse error
    const badCsv = 'name,name_mn\n"unterminated';

    await expect(
      importParts(mockClient as never, "org-1", badCsv, "user-1"),
    ).rejects.toThrow(ValidationError);
  });
});
