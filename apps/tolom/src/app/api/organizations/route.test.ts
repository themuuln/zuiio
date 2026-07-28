import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const getUserOrganizationMock = vi.fn();
const createOrganizationMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/organization-service", () => ({
  getUserOrganization: getUserOrganizationMock,
  createOrganization: createOrganizationMock,
}));

const { GET, POST } = await import("./route");

describe("GET /api/organizations", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user's organization", async () => {
    const org = { id: "org-1", name: "My Shop", slug: "my-shop" };
    getUserOrganizationMock.mockResolvedValue(org);

    const req = new NextRequest(new URL("http://localhost/api/organizations"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual(org);
    expect(getUserOrganizationMock).toHaveBeenCalledWith({}, "user-1");
  });

  it("returns null when user has no organization", async () => {
    getUserOrganizationMock.mockResolvedValue(null);

    const req = new NextRequest(new URL("http://localhost/api/organizations"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toBeNull();
  });

  it("handles service error", async () => {
    getUserOrganizationMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(new URL("http://localhost/api/organizations"));
    await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});

describe("POST /api/organizations", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an organization successfully", async () => {
    const createdOrg = { id: "org-1", name: "My Shop", slug: "my-shop" };
    createOrganizationMock.mockResolvedValue(createdOrg);

    const req = new NextRequest(new URL("http://localhost/api/organizations"), {
      method: "POST",
      body: JSON.stringify({ name: "My Shop", slug: "my-shop" }),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual(createdOrg);
    expect(createOrganizationMock).toHaveBeenCalledWith(
      {},
      { name: "My Shop", slug: "my-shop" },
      "user-1",
    );
  });

  it("returns validation error when name is missing", async () => {
    createOrganizationMock.mockRejectedValue(
      Object.assign(new Error("Name is required"), { statusCode: 400 }),
    );

    const req = new NextRequest(new URL("http://localhost/api/organizations"), {
      method: "POST",
      body: JSON.stringify({ slug: "my-shop" }),
    });

    await expect(POST({ request: req, supabase: {}, user })).rejects.toThrow(
      "Name is required",
    );
  });

  it("returns validation error when slug is missing", async () => {
    createOrganizationMock.mockRejectedValue(
      Object.assign(new Error("Slug is required"), { statusCode: 400 }),
    );

    const req = new NextRequest(new URL("http://localhost/api/organizations"), {
      method: "POST",
      body: JSON.stringify({ name: "My Shop" }),
    });

    await expect(POST({ request: req, supabase: {}, user })).rejects.toThrow(
      "Slug is required",
    );
  });

  it("handles service error", async () => {
    createOrganizationMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(new URL("http://localhost/api/organizations"), {
      method: "POST",
      body: JSON.stringify({ name: "My Shop", slug: "my-shop" }),
    });

    await expect(POST({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});
