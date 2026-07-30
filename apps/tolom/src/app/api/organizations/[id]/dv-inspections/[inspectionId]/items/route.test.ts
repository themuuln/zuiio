import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const addInspectionItemMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/dvi-service", () => ({
  addInspectionItem: addInspectionItemMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/dv-inspections/[inspectionId]/items POST", () => {
  const orgId = "org-1";
  const inspectionId = "insp-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const url = `http://localhost/api/organizations/${orgId}/dv-inspections/${inspectionId}/items`;

  it("adds an item to an inspection", async () => {
    addInspectionItemMock.mockResolvedValue({
      id: "item-1",
      inspection_id: inspectionId,
      category: "brakes",
      item_name: "Front brake pads",
      condition: "poor",
    });

    const body = {
      category: "brakes",
      item_name: "Front brake pads",
      condition: "poor",
      measurement_value: 4.5,
      estimated_cost: 120000,
    };
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: { inspectionId },
    });
    const data = await response.json();

    expect(addInspectionItemMock).toHaveBeenCalledWith(
      supabase,
      inspectionId,
      orgId,
      user.id,
      expect.objectContaining({
        category: "brakes",
        item_name: "Front brake pads",
      }),
    );
    expect(data.data.id).toBe("item-1");
    expect(response.status).toBe(201);
  });

  it("returns 400 when category is missing", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ item_name: "Test item" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: { inspectionId },
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when item_name is missing", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ category: "brakes" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: { inspectionId },
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when inspectionId is missing", async () => {
    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ category: "brakes", item_name: "Pads" }),
      headers: { "content-type": "application/json" },
    });
    const response = await (POST as any)({
      request,
      orgId,
      user,
      supabase,
      params: {},
    });
    expect(response.status).toBe(400);
  });

  it("handles service error", async () => {
    addInspectionItemMock.mockRejectedValue(new Error("DB error"));

    const supabase = { from: vi.fn() };
    const request = new NextRequest(url, {
      method: "POST",
      body: JSON.stringify({ category: "brakes", item_name: "Pads" }),
      headers: { "content-type": "application/json" },
    });
    await expect(
      (POST as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId },
      }),
    ).rejects.toThrow("DB error");
  });
});
