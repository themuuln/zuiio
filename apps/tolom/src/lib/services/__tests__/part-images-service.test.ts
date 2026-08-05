import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/cache/keys", () => ({
  cacheTags: {
    partImages: (o: string, p: string) => `part-images:${o}:${p}`,
  },
}));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ValidationError";
    }
  },
}));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { NotFoundError, ValidationError } from "@/lib/errors";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);

import {
  addPartImage,
  getPartImages,
  removePartImage,
  setPrimaryImage,
} from "../part-images-service";

const ORG_ID = "org-1";
const PART_ID = "part-1";
const USER_ID = "user-1";
const IMAGE_ID = "img-1";
const IMAGE_URL = "https://example.com/part.jpg";

let db: ReturnType<typeof createMockSupabaseClient>;

function makeImage(o: Record<string, string | boolean | number | null> = {}) {
  return {
    id: IMAGE_ID,
    organization_id: ORG_ID,
    part_id: PART_ID,
    image_url: IMAGE_URL,
    is_primary: false,
    sort_order: 0,
    created_by: USER_ID,
    created_at: "2025-01-15T10:00:00Z",
    ...o,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getPartImages ──────────────────────────────────────────────────────────

describe("getPartImages", () => {
  it("returns images ordered by sort_order", async () => {
    const images = [
      makeImage({ id: "img-2", sort_order: 2 }),
      makeImage({ id: "img-1", sort_order: 1 }),
    ];
    db.__qb.resolveOnce({ data: images, error: null });

    const result = await getPartImages(db as never, ORG_ID, PART_ID);

    expect(result).toHaveLength(2);
    expect(db.from).toHaveBeenCalledWith("part_images");
    expect(result[0].id).toBe("img-2");
  });

  it("returns empty array when no images exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getPartImages(db as never, ORG_ID, PART_ID);

    expect(result).toEqual([]);
  });

  it("throws on error", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "DB error" } });

    await expect(getPartImages(db as never, ORG_ID, PART_ID)).rejects.toThrow(
      "DB error",
    );
  });
});

// ── addPartImage ────────────────────────────────────────────────────────────

describe("addPartImage", () => {
  it("adds an image and returns it", async () => {
    // max sort query (no existing images)
    db.__qb.resolveOnce({ data: null, error: null });
    // unset existing primary (runs because isPrimary=true)
    db.__qb.resolveOnce({ data: null, error: null });
    // insert
    db.__qb.resolveOnce({
      data: makeImage({ is_primary: true, sort_order: 0 }),
      error: null,
    });

    const result = await addPartImage(
      db as never,
      ORG_ID,
      PART_ID,
      IMAGE_URL,
      true,
      USER_ID,
    );

    expect(result.image_url).toBe(IMAGE_URL);
    expect(result.is_primary).toBe(true);
    expect(result.sort_order).toBe(0);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("unset existing primary when new image is primary", async () => {
    // max sort query
    db.__qb.resolveOnce({ data: { sort_order: 2 }, error: null });
    // unset primary update
    db.__qb.resolveOnce({ data: null, error: null });
    // insert
    db.__qb.resolveOnce({
      data: makeImage({ is_primary: true, sort_order: 3 }),
      error: null,
    });

    const result = await addPartImage(
      db as never,
      ORG_ID,
      PART_ID,
      IMAGE_URL,
      true,
      USER_ID,
    );

    expect(result.is_primary).toBe(true);
    expect(result.sort_order).toBe(3);
  });

  it("throws ValidationError for empty URL", async () => {
    await expect(
      addPartImage(db as never, ORG_ID, PART_ID, "", false, USER_ID),
    ).rejects.toThrow(ValidationError);
  });

  it("throws on DB error during insert", async () => {
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: { message: "Insert failed" } });

    await expect(
      addPartImage(db as never, ORG_ID, PART_ID, IMAGE_URL, false, USER_ID),
    ).rejects.toThrow("Insert failed");
  });
});

// ── removePartImage ─────────────────────────────────────────────────────────

describe("removePartImage", () => {
  it("removes an image and invalidates cache", async () => {
    // Fetch existing image
    db.__qb.resolveOnce({
      data: makeImage(),
      error: null,
    });
    // Delete
    db.__qb.resolveOnce({ data: null, error: null });

    await removePartImage(db as never, ORG_ID, IMAGE_ID, USER_ID);

    expect(db.from).toHaveBeenCalledWith("part_images");
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError if image does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      removePartImage(db as never, ORG_ID, "nonexistent", USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws on DB error during delete", async () => {
    db.__qb.resolveOnce({
      data: makeImage(),
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: { message: "Delete failed" } });

    await expect(
      removePartImage(db as never, ORG_ID, IMAGE_ID, USER_ID),
    ).rejects.toThrow("Delete failed");
  });
});

// ── setPrimaryImage ─────────────────────────────────────────────────────────

describe("setPrimaryImage", () => {
  it("sets an image as primary for the part", async () => {
    // Verify image exists
    db.__qb.resolveOnce({
      data: makeImage(),
      error: null,
    });
    // Unset existing primary
    db.__qb.resolveOnce({ data: null, error: null });
    // Set new primary
    db.__qb.resolveOnce({
      data: makeImage({ is_primary: true }),
      error: null,
    });

    const result = await setPrimaryImage(
      db as never,
      ORG_ID,
      PART_ID,
      IMAGE_ID,
      USER_ID,
    );

    expect(result.is_primary).toBe(true);
    expect(mockLogAudit).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("throws NotFoundError if image does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      setPrimaryImage(db as never, ORG_ID, PART_ID, "nonexistent", USER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws on DB error during set", async () => {
    db.__qb.resolveOnce({
      data: makeImage(),
      error: null,
    });
    db.__qb.resolveOnce({ data: null, error: null });
    db.__qb.resolveOnce({ data: null, error: { message: "Update failed" } });

    await expect(
      setPrimaryImage(db as never, ORG_ID, PART_ID, IMAGE_ID, USER_ID),
    ).rejects.toThrow("Update failed");
  });
});
