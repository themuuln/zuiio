import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/lib/errors";

// ── Mock refs ──────────────────────────────────────────────────

const authRateLimitCheckMock = vi.fn();
const createClientMock = vi.fn();
const createServiceRoleClientMock = vi.fn();
const createUserMock = vi.fn();

// Supabase query chain leaf mocks
const customerLookupMaybeSingleMock = vi.fn();
const emailLookupMaybeSingleMock = vi.fn();
const customerUpdateEqMock = vi.fn();

// ── Module mocks ──────────────────────────────────────────────

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/rate-limit", () => ({
  authRateLimiter: { check: authRateLimitCheckMock },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: createServiceRoleClientMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("POST /api/portal/set-password", () => {
  const customer = {
    id: "cust-1",
    organization_id: "org-1",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    portal_token: "token-123",
  };

  const validBody = {
    token: "token-123",
    email: "john@example.com",
    password: "NewPass1!",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: allow rate limit
    authRateLimitCheckMock.mockResolvedValue({
      allowed: true,
      resetAt: Date.now() + 60_000,
    });

    // Build supabase client mock with chain builders
    const supabase = {
      from: vi.fn((table: string) => {
        if (table !== "customers") return {};
        return {
          select: vi.fn((fields: string) => {
            if (fields.includes("organization_id")) {
              // Token lookup chain: .select(...).eq(..).is(..).maybeSingle()
              return {
                eq: vi.fn(() => ({
                  is: vi.fn(() => ({
                    maybeSingle: customerLookupMaybeSingleMock,
                  })),
                })),
              };
            }
            // Email lookup chain: .select(...).eq(..).is(..).maybeSingle()
            return {
              eq: vi.fn(() => ({
                is: vi.fn(() => ({
                  maybeSingle: emailLookupMaybeSingleMock,
                })),
              })),
            };
          }),
          // Update chain: .update(..).eq(..)
          update: vi.fn(() => ({
            eq: customerUpdateEqMock,
          })),
        };
      }),
    };
    createClientMock.mockResolvedValue(supabase);

    // Build service role client mock
    const serviceRole = {
      auth: {
        admin: {
          createUser: createUserMock,
        },
      },
    };
    createServiceRoleClientMock.mockResolvedValue(serviceRole);

    // Default: customer update succeeds
    customerUpdateEqMock.mockResolvedValue({ error: null });
  });

  it("creates a user and links to the customer record", async () => {
    customerLookupMaybeSingleMock.mockResolvedValue({
      data: customer,
      error: null,
    });
    createUserMock.mockResolvedValue({
      data: { user: { id: "auth-uid-1" } },
      error: null,
    });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const response = await (POST as any)({ request: req });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { success: true } });
    expect(createUserMock).toHaveBeenCalledWith({
      email: "john@example.com",
      password: "NewPass1!",
      email_confirm: true,
    });
    expect(customerUpdateEqMock).toHaveBeenCalledWith("id", "cust-1");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    authRateLimitCheckMock.mockResolvedValue({
      allowed: false,
      resetAt: Date.now() + 5_000,
    });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    const response = await (POST as any)({ request: req });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(response.headers.get("Retry-After")).toBeDefined();
  });

  it("throws ValidationError when required fields are missing", async () => {
    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await expect((POST as any)({ request: req })).rejects.toThrow(
      ValidationError,
    );
  });

  it("throws ValidationError when portal token is invalid", async () => {
    customerLookupMaybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    await expect((POST as any)({ request: req })).rejects.toThrow(
      ValidationError,
    );
  });

  it("throws ConflictError when email belongs to a different customer", async () => {
    customerLookupMaybeSingleMock.mockResolvedValue({
      data: customer,
      error: null,
    });
    createUserMock.mockResolvedValue({
      data: null,
      error: { message: "User already registered", status: 422 },
    });
    // The email lookup finds a different customer who already has a user_id
    emailLookupMaybeSingleMock.mockResolvedValue({
      data: {
        id: "cust-other",
        customer_user_id: "auth-uid-other",
      },
      error: null,
    });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    await expect((POST as any)({ request: req })).rejects.toThrow(
      ConflictError,
    );
  });

  it("throws ConflictError as fallback when email exists but can't be resolved", async () => {
    customerLookupMaybeSingleMock.mockResolvedValue({
      data: customer,
      error: null,
    });
    createUserMock.mockResolvedValue({
      data: null,
      error: { message: "User already registered", status: 422 },
    });
    // No customer record found for this email
    emailLookupMaybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    await expect((POST as any)({ request: req })).rejects.toThrow(
      ConflictError,
    );
  });

  it("throws the original error for unknown Supabase errors", async () => {
    customerLookupMaybeSingleMock.mockResolvedValue({
      data: customer,
      error: null,
    });
    const dbError = new Error("Database connection failed");
    createUserMock.mockResolvedValue({ data: null, error: dbError });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    await expect((POST as any)({ request: req })).rejects.toThrow(
      "Database connection failed",
    );
  });

  it("throws when customer lookup fails", async () => {
    const lookupError = new Error("Customer query failed");
    customerLookupMaybeSingleMock.mockResolvedValue({
      data: null,
      error: lookupError,
    });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    await expect((POST as any)({ request: req })).rejects.toThrow(
      "Customer query failed",
    );
  });

  it("throws when customer update fails after user creation", async () => {
    customerLookupMaybeSingleMock.mockResolvedValue({
      data: customer,
      error: null,
    });
    createUserMock.mockResolvedValue({
      data: { user: { id: "auth-uid-1" } },
      error: null,
    });
    customerUpdateEqMock.mockResolvedValue({
      error: new Error("Update failed"),
    });

    const req = new NextRequest("http://localhost/api/portal/set-password", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    await expect((POST as any)({ request: req })).rejects.toThrow(
      "Update failed",
    );
  });
});
