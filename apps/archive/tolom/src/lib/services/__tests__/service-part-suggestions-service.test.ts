import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

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

import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  addServicePartSuggestion,
  getServicePartSuggestions,
  removeServicePartSuggestion,
} from "../service-part-suggestions-service";

const ORG_ID = "org-1";
const SERVICE_ID = "svc-1";
const PART_ID = "part-1";
const SUGGESTION_ID = "sug-1";
const USER_ID = "user-1";

function makeSuggestion(overrides: Record<string, unknown> = {}) {
  return {
    id: SUGGESTION_ID,
    organization_id: ORG_ID,
    service_id: SERVICE_ID,
    part_id: PART_ID,
    quantity: 1,
    notes: null,
    created_at: "2025-01-15T10:00:00Z",
    created_by: USER_ID,
    updated_at: "2025-01-15T10:00:00Z",
    updated_by: USER_ID,
    ...overrides,
  };
}

function makePartCatalog() {
  return { name: "Oil Filter", part_number: "OF-001" };
}

let db: ReturnType<typeof createMockSupabaseClient>;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getServicePartSuggestions ──────────────────────────────────

describe("getServicePartSuggestions", () => {
  it("returns suggestions with part info for a service", async () => {
    const suggestion = {
      ...makeSuggestion(),
      parts_catalog: makePartCatalog(),
    };
    db.__qb.resolveWith({ data: [suggestion], error: null });

    const result = await getServicePartSuggestions(
      db as never,
      ORG_ID,
      SERVICE_ID,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(SUGGESTION_ID);
    expect(result[0].service_id).toBe(SERVICE_ID);
    expect(result[0].part_id).toBe(PART_ID);
    expect(result[0].part_name).toBe("Oil Filter");
    expect(result[0].part_number).toBe("OF-001");
    expect(result[0].quantity).toBe(1);

    expect(db.from).toHaveBeenCalledWith("service_part_suggestions");
  });

  it("returns empty array when no suggestions exist", async () => {
    db.__qb.resolveWith({ data: [], error: null });

    const result = await getServicePartSuggestions(
      db as never,
      ORG_ID,
      SERVICE_ID,
    );

    expect(result).toEqual([]);
  });

  it("handles missing part catalog data gracefully", async () => {
    const suggestion = {
      ...makeSuggestion(),
      parts_catalog: null,
    };
    db.__qb.resolveWith({ data: [suggestion], error: null });

    const result = await getServicePartSuggestions(
      db as never,
      ORG_ID,
      SERVICE_ID,
    );

    expect(result).toHaveLength(1);
    expect(result[0].part_name).toBeNull();
    expect(result[0].part_number).toBeNull();
  });

  it("throws on database error", async () => {
    db.__qb.resolveWith({ data: null, error: { message: "DB error" } });

    await expect(
      getServicePartSuggestions(db as never, ORG_ID, SERVICE_ID),
    ).rejects.toThrow("DB error");
  });

  it("returns empty when org has part suggestions disabled", async () => {
    // maybeSingle(organizations) resolves immediately — mock the settings row
    vi.mocked(db.from("organizations").maybeSingle).mockResolvedValueOnce({
      data: { settings: { enable_part_suggestions: false } },
      error: null,
    });

    const result = await getServicePartSuggestions(
      db as never,
      ORG_ID,
      SERVICE_ID,
    );

    expect(result).toEqual([]);
    // Should NOT touch the suggestions table when disabled
    expect(db.from).toHaveBeenCalledWith("organizations");
    expect(db.from).not.toHaveBeenCalledWith("service_part_suggestions");
  });

  it("returns suggestions when flag is absent (default enabled)", async () => {
    vi.mocked(db.from("organizations").maybeSingle).mockResolvedValueOnce({
      data: { settings: {} },
      error: null,
    });
    db.__qb.resolveWith({
      data: [{ ...makeSuggestion(), parts_catalog: makePartCatalog() }],
      error: null,
    });

    const result = await getServicePartSuggestions(
      db as never,
      ORG_ID,
      SERVICE_ID,
    );

    expect(result).toHaveLength(1);
  });
});

// ── addServicePartSuggestion ───────────────────────────────────

describe("addServicePartSuggestion", () => {
  it("adds a part suggestion with default quantity of 1", async () => {
    db.__qb.resolveOnce({ data: makeSuggestion(), error: null });

    const result = await addServicePartSuggestion(
      db as never,
      ORG_ID,
      SERVICE_ID,
      { partId: PART_ID },
      USER_ID,
    );

    expect(result.id).toBe(SUGGESTION_ID);
    expect(result.part_id).toBe(PART_ID);
    expect(result.quantity).toBe(1);

    expect(db.from).toHaveBeenCalledWith("service_part_suggestions");
  });

  it("accepts custom quantity and notes", async () => {
    const suggestion = makeSuggestion({ quantity: 2, notes: "Use premium" });
    db.__qb.resolveOnce({ data: suggestion, error: null });

    const result = await addServicePartSuggestion(
      db as never,
      ORG_ID,
      SERVICE_ID,
      { partId: PART_ID, quantity: 2, notes: "Use premium" },
    );

    expect(result.quantity).toBe(2);
    expect(result.notes).toBe("Use premium");
  });

  it("rejects empty partId with ValidationError", async () => {
    await expect(
      addServicePartSuggestion(db as never, ORG_ID, SERVICE_ID, {
        partId: "",
      }),
    ).rejects.toThrow(ValidationError);

    await expect(
      addServicePartSuggestion(db as never, ORG_ID, SERVICE_ID, {
        partId: "   ",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects duplicate suggestion with ValidationError", async () => {
    const errPayload = {
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    };
    db.__qb.resolveOnce(errPayload);

    await expect(
      addServicePartSuggestion(db as never, ORG_ID, SERVICE_ID, {
        partId: PART_ID,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects with meaningful message on duplicate", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    await expect(
      addServicePartSuggestion(db as never, ORG_ID, SERVICE_ID, {
        partId: PART_ID,
      }),
    ).rejects.toThrow("This part is already suggested for this service");
  });

  it("throws on generic database error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: { message: "DB error", code: "PGRST104" },
    });

    await expect(
      addServicePartSuggestion(db as never, ORG_ID, SERVICE_ID, {
        partId: PART_ID,
      }),
    ).rejects.toThrow("DB error");
  });
});

// ── removeServicePartSuggestion ────────────────────────────────

describe("removeServicePartSuggestion", () => {
  it("removes a suggestion by id", async () => {
    db.__qb.resolveOnce({ data: { id: SUGGESTION_ID }, error: null });

    await removeServicePartSuggestion(db as never, ORG_ID, SUGGESTION_ID);

    expect(db.from).toHaveBeenCalledWith("service_part_suggestions");
  });

  it("throws NotFoundError when suggestion does not exist", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    await expect(
      removeServicePartSuggestion(db as never, ORG_ID, "nonexistent"),
    ).rejects.toThrow(NotFoundError);
  });
});
