import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockParams,
  createMockRequest,
  parseResponse,
} from "@/test/mocks";
import {
  createMockSupabase,
  type MockFrom,
  setQueryResult,
} from "@/test/supabase-mock";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { PATCH } from "../error-reports/[id]/route";

const mockCreateClient = vi.mocked(createClient);

describe("Error Reports API", () => {
  let mock: MockFrom & { _queryResults: Map<string, unknown> };

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    mockCreateClient.mockResolvedValue(mock as never);
  });

  // ── PATCH /admin/api/error-reports/[id] ─────────────────────────
  describe("PATCH /api/error-reports/[id]", () => {
    it("updates status to resolved", async () => {
      setQueryResult(mock, "public_error_reports", null);

      const res = await PATCH(
        createMockRequest(
          { status: "resolved" },
          undefined,
          "PATCH",
        ) as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual({ ok: true });
    });

    it("updates status to dismissed", async () => {
      setQueryResult(mock, "public_error_reports", null);

      const res = await PATCH(
        createMockRequest(
          { status: "dismissed" },
          undefined,
          "PATCH",
        ) as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(body).toEqual({ ok: true });
    });

    it("returns 400 for invalid status value", async () => {
      const res = await PATCH(
        createMockRequest(
          { status: "pending" },
          undefined,
          "PATCH",
        ) as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/resolved/);
      expect(body.error).toMatch(/dismissed/);
    });

    it("returns 400 for status not in allowed enum", async () => {
      const res = await PATCH(
        createMockRequest(
          { status: "open" },
          undefined,
          "PATCH",
        ) as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );

      expect(res.status).toBe(400);
    });

    it("returns 400 when status is missing", async () => {
      const res = await PATCH(
        createMockRequest({}, undefined, "PATCH") as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );

      expect(res.status).toBe(400);
    });

    it("returns 400 when body is null/empty", async () => {
      // request.json() returns null when body is empty
      const res = await PATCH(
        {
          json: () => Promise.resolve(null),
          nextUrl: new URL("http://localhost/admin/api/error-reports/r1"),
          method: "PATCH",
          headers: new Headers(),
        } as never,
        { params: createMockParams("report-1") },
      );

      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ user: null }) as never,
      );

      const res = await PATCH(
        createMockRequest(
          { status: "resolved" },
          undefined,
          "PATCH",
        ) as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );

      expect(res.status).toBe(401);
    });

    it("returns 500 on database error", async () => {
      setQueryResult(
        mock,
        "public_error_reports",
        null,
        new Error("update failed"),
      );

      const res = await PATCH(
        createMockRequest(
          { status: "resolved" },
          undefined,
          "PATCH",
        ) as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );
      const body = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: "update failed" });
    });

    it("rejects arbitrary string as status", async () => {
      const res = await PATCH(
        createMockRequest(
          { status: "something_else" },
          undefined,
          "PATCH",
        ) as unknown as NextRequest,
        { params: createMockParams("report-1") },
      );

      expect(res.status).toBe(400);
    });
  });
});
