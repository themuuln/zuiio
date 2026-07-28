import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const importPartsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/part-import-service", () => ({
  importParts: importPartsMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

function buildFormData(name: string, content: string): FormData {
  const blob = new Blob([content], { type: "text/csv" });
  const file = new File([blob], name, { type: "text/csv" });
  const fd = new FormData();
  fd.set("file", file);
  return fd;
}

describe("organizations/[id]/inventory/parts/import route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/parts/import`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("imports parts from CSV file", async () => {
    const result = { imported: 5, errors: [] };
    importPartsMock.mockResolvedValue(result);

    const fd = buildFormData(
      "parts.csv",
      "part_number,name,quantity\nP001,Oil Filter,10",
    );
    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: fd,
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase: {},
    });
    const body = await response.json();

    expect(importPartsMock).toHaveBeenCalledWith(
      {},
      orgId,
      "part_number,name,quantity\nP001,Oil Filter,10",
      user.id,
    );
    expect(body.data).toEqual(result);
  });

  it("returns 400 when no file is provided", async () => {
    const fd = new FormData();
    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: fd,
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase: {},
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 400 when file is not CSV", async () => {
    const blob = new Blob(["data"], { type: "text/plain" });
    const file = new File([blob], "data.txt", { type: "text/plain" });
    const fd = new FormData();
    fd.set("file", file);

    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: fd,
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase: {},
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("returns 400 when CSV is empty", async () => {
    const fd = buildFormData("parts.csv", "");
    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: fd,
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase: {},
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("EMPTY_FILE");
  });

  it("handles service error", async () => {
    importPartsMock.mockRejectedValue(new Error("Import failed"));

    const fd = buildFormData("parts.csv", "part_number,name\nP001,Test");
    const request = new NextRequest(baseUrl, {
      method: "POST",
      body: fd,
    });
    await expect(
      (POST as any)({ request, orgId, user, supabase: {} }),
    ).rejects.toThrow("Import failed");
  });
});
