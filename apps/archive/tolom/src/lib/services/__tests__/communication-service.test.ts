import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from "@/test/mocks/supabase";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAuditAfter: vi.fn() }));
vi.mock("@/lib/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/errors", () => ({
  NotFoundError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "ValidationError";
    }
  },
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockLogAudit = vi.mocked(logAuditAfter);

import {
  createCustomerCommunication,
  deleteCustomerCommunication,
  getCustomerCommunications,
} from "../communication-service";

const ORG_ID = "org-1";
const CUSTOMER_ID = "cust-1";
const USER_ID = "user-1";
const COMM_ID = "comm-1";
const NOW = "2026-07-25T10:00:00.000Z";

function makeCommRow(overrides: Record<string, unknown> = {}) {
  return {
    id: COMM_ID,
    organization_id: ORG_ID,
    customer_id: CUSTOMER_ID,
    type: "note",
    direction: "outbound",
    subject: "Test subject",
    content: "Test content",
    staff_id: USER_ID,
    created_at: NOW,
    deleted_at: null,
    ...overrides,
  };
}

let db: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMockSupabaseClient();
});

// ── getCustomerCommunications ──────────────────────────────────

describe("getCustomerCommunications", () => {
  it("should return communications with staff name mapped", async () => {
    const row = makeCommRow();
    db.__qb.resolveOnce({
      data: [{ ...row, profiles: { full_name: "John Doe" } }],
      error: null,
    });

    const result = await getCustomerCommunications(db, ORG_ID, CUSTOMER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(COMM_ID);
    expect(result[0].staff_name).toBe("John Doe");
    expect(result[0].content).toBe("Test content");
  });

  it("should handle null staff profile", async () => {
    db.__qb.resolveOnce({
      data: [{ ...makeCommRow(), profiles: null }],
      error: null,
    });

    const result = await getCustomerCommunications(db, ORG_ID, CUSTOMER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].staff_name).toBeNull();
  });

  it("should return empty array when no communications exist", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    const result = await getCustomerCommunications(db, ORG_ID, CUSTOMER_ID);

    expect(result).toEqual([]);
  });

  it("should throw when supabase query fails", async () => {
    db.__qb.resolveOnce({ data: null, error: { message: "DB error" } });

    await expect(
      getCustomerCommunications(db, ORG_ID, CUSTOMER_ID),
    ).rejects.toThrow("DB error");
  });

  it("should build correct query chain", async () => {
    db.__qb.resolveOnce({ data: [], error: null });

    await getCustomerCommunications(db, ORG_ID, CUSTOMER_ID);

    expect(db.from).toHaveBeenCalledWith("customer_communications");
    expect(db.from("customer_communications").select).toHaveBeenCalledWith(
      "*, profiles:staff_id ( full_name )",
    );
    expect(db.from("customer_communications").eq).toHaveBeenCalledWith(
      "organization_id",
      ORG_ID,
    );
    expect(db.from("customer_communications").eq).toHaveBeenCalledWith(
      "customer_id",
      CUSTOMER_ID,
    );
    expect(db.from("customer_communications").is).toHaveBeenCalledWith(
      "deleted_at",
      null,
    );
    expect(db.from("customer_communications").order).toHaveBeenCalledWith(
      "created_at",
      { ascending: false },
    );
  });
});

// ── createCustomerCommunication ────────────────────────────────

describe("createCustomerCommunication", () => {
  it("should create an SMS communication", async () => {
    const inserted = makeCommRow({
      type: "call",
      direction: "outbound",
      content: "Called customer",
    });
    db.__qb.resolveOnce({ data: inserted, error: null });

    const result = await createCustomerCommunication(
      db,
      ORG_ID,
      CUSTOMER_ID,
      { type: "call", direction: "outbound", content: "Called customer" },
      USER_ID,
    );

    expect(result.id).toBe(COMM_ID);
    expect(result.type).toBe("call");
    expect(result.content).toBe("Called customer");

    expect(db.from("customer_communications").insert).toHaveBeenCalledWith({
      organization_id: ORG_ID,
      customer_id: CUSTOMER_ID,
      type: "call",
      direction: "outbound",
      subject: null,
      content: "Called customer",
      staff_id: USER_ID,
    });

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        table_name: "customer_communications",
        record_id: COMM_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("should create an email communication with subject", async () => {
    const inserted = makeCommRow({
      type: "email",
      direction: "inbound",
      subject: "Customer inquiry",
      content: "I have a question about my invoice",
    });
    db.__qb.resolveOnce({ data: inserted, error: null });

    const result = await createCustomerCommunication(
      db,
      ORG_ID,
      CUSTOMER_ID,
      {
        type: "email",
        direction: "inbound",
        subject: "Customer inquiry",
        content: "I have a question about my invoice",
      },
      USER_ID,
    );

    expect(result.type).toBe("email");
    expect(result.subject).toBe("Customer inquiry");
  });

  it("should create a note communication without subject", async () => {
    const inserted = makeCommRow({ type: "note", subject: null });
    db.__qb.resolveOnce({ data: inserted, error: null });

    const result = await createCustomerCommunication(
      db,
      ORG_ID,
      CUSTOMER_ID,
      { type: "note", direction: "outbound", content: "Internal note" },
      USER_ID,
    );

    expect(result.type).toBe("note");
    expect(result.subject).toBeNull();
  });

  it("should trim subject and fallback to null when empty", async () => {
    const inserted = makeCommRow({ type: "note", subject: null });
    db.__qb.resolveOnce({ data: inserted, error: null });

    await createCustomerCommunication(
      db,
      ORG_ID,
      CUSTOMER_ID,
      { type: "note", direction: "outbound", content: "Note", subject: "   " },
      USER_ID,
    );

    const insertCall = db.from("customer_communications").insert.mock
      .calls[0][0];
    expect(insertCall.subject).toBeNull();
  });

  it("should throw when supabase insert returns error", async () => {
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    await expect(
      createCustomerCommunication(
        db,
        ORG_ID,
        CUSTOMER_ID,
        { type: "note", direction: "outbound", content: "Test" },
        USER_ID,
      ),
    ).rejects.toThrow("Insert failed");
  });

  it("should throw when supabase insert returns null data without error", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      createCustomerCommunication(
        db,
        ORG_ID,
        CUSTOMER_ID,
        { type: "note", direction: "outbound", content: "Test" },
        USER_ID,
      ),
    ).rejects.toThrow("Failed to create customer communication");
  });
});

// ── deleteCustomerCommunication ────────────────────────────────

describe("deleteCustomerCommunication", () => {
  it("should soft-delete a communication and log audit", async () => {
    db.__qb.resolveOnce({ data: { id: COMM_ID }, error: null }); // existing check
    db.__qb.resolveOnce({ data: null, error: null }); // update

    await deleteCustomerCommunication(
      db,
      ORG_ID,
      CUSTOMER_ID,
      COMM_ID,
      USER_ID,
    );

    expect(db.from("customer_communications").update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
    });
    expect(db.from("customer_communications").update().eq).toHaveBeenCalledWith(
      "id",
      COMM_ID,
    );

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "soft_delete",
        table_name: "customer_communications",
        record_id: COMM_ID,
        user_id: USER_ID,
        organization_id: ORG_ID,
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("should throw NotFoundError when communication does not exist", async () => {
    db.__qb.resolveOnce({ data: null, error: null }); // existing check returns null

    await expect(
      deleteCustomerCommunication(db, ORG_ID, CUSTOMER_ID, COMM_ID, USER_ID),
    ).rejects.toThrow("Customer communication not found");

    expect(db.from("customer_communications").update).not.toHaveBeenCalled();
    expect(mockLogAudit).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when communication is already soft-deleted", async () => {
    db.__qb.resolveOnce({ data: null, error: null });

    await expect(
      deleteCustomerCommunication(db, ORG_ID, CUSTOMER_ID, COMM_ID, USER_ID),
    ).rejects.toThrow("Customer communication not found");
  });

  it("should throw when update fails", async () => {
    db.__qb.resolveOnce({ data: { id: COMM_ID }, error: null }); // existing check
    db.__qb.resolveOnce({
      data: null,
      error: { message: "Update failed" },
    }); // update

    await expect(
      deleteCustomerCommunication(db, ORG_ID, CUSTOMER_ID, COMM_ID, USER_ID),
    ).rejects.toThrow("Update failed");
  });

  it("should verify existing record lookup uses correct filters", async () => {
    db.__qb.resolveOnce({ data: { id: COMM_ID }, error: null });
    db.__qb.resolveOnce({ data: null, error: null });

    await deleteCustomerCommunication(
      db,
      ORG_ID,
      CUSTOMER_ID,
      COMM_ID,
      USER_ID,
    );

    const selectChain = db.from("customer_communications");
    expect(selectChain.select).toHaveBeenCalledWith("id");
    expect(selectChain.eq).toHaveBeenCalledWith("id", COMM_ID);
    expect(selectChain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(selectChain.eq).toHaveBeenCalledWith("customer_id", CUSTOMER_ID);
    expect(selectChain.is).toHaveBeenCalledWith("deleted_at", null);
  });
});
