import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/sentry-report-server", () => ({
  reportServerError: vi.fn(),
}));

const importGlobalPartsToOrgMock = vi.fn();
vi.mock("@/lib/services/global-catalog-service", () => ({
  importGlobalPartsToOrg: importGlobalPartsToOrgMock,
}));

const { POST } = await import("./route");

describe("POST /api/global-catalog/parts/import", () => {
  const supabase = {} as unknown as SupabaseClient;
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("imports selected parts to org catalog", async () => {
    const importResult = { imported: 2, skipped: 0, errors: [] };
    importGlobalPartsToOrgMock.mockResolvedValue(importResult);

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts/import"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: "org-1",
          partIds: ["gp-1", "gp-2"],
        }),
      },
    );

    const response = await POST({ request: req, supabase, user });
    const body = await response.json();

    expect(importGlobalPartsToOrgMock).toHaveBeenCalledWith(
      supabase,
      "org-1",
      user.id,
      ["gp-1", "gp-2"],
    );
    expect(response.status).toBe(201);
    expect(body.data).toEqual(importResult);
  });

  it("returns 400 for missing organizationId", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts/import"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partIds: ["gp-1"] }),
      },
    );

    const response = await POST({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for empty partIds", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts/import"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "org-1", partIds: [] }),
      },
    );

    const response = await POST({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts/import"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      },
    );

    const response = await POST({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_BODY");
  });

  it("returns 400 when service throws validation error", async () => {
    importGlobalPartsToOrgMock.mockRejectedValue(
      new Error("Organization ID is required"),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts/import"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "org-1", partIds: ["invalid"] }),
      },
    );

    const response = await POST({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("IMPORT_ERROR");
  });

  it("returns 500 on service error", async () => {
    importGlobalPartsToOrgMock.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const req = new NextRequest(
      new URL("http://localhost/api/global-catalog/parts/import"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: "org-1", partIds: ["gp-1"] }),
      },
    );

    const response = await POST({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("IMPORT_ERROR");
  });
});
