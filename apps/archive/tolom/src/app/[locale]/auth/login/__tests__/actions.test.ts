import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { reportServerError } from "@/lib/sentry-report-server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { login } from "../actions";

const mockReportServerError = vi.mocked(reportServerError);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    identifier: "user@example.com",
    password: "password123",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(key, value);
  }
  return fd;
}

function setupServiceRole() {
  const serviceRole = createMockSupabaseClient();
  // Route `.maybeSingle()` through the shared thenable qb
  serviceRole
    .from("profiles")
    .maybeSingle.mockReturnValue(serviceRole.from("profiles") as never);
  mockCreateServiceRoleClient.mockResolvedValue(serviceRole as never);
  return serviceRole;
}

function setupClient(signInWithPassword: ReturnType<typeof vi.fn>) {
  const client = createMockSupabaseClient();
  client.auth.signInWithPassword = signInWithPassword;
  mockCreateClient.mockResolvedValue(client as never);
  return client;
}

beforeEach(() => {
  vi.resetAllMocks();
  setupServiceRole();
  setupClient(
    vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
  );
});

describe("login", () => {
  it("returns field errors when fields are empty", async () => {
    const result = await login({}, new FormData());

    expect(result.fieldErrors).toMatchObject({
      identifier: expect.any(String),
      password: expect.any(String),
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("signs in directly with an email identifier", async () => {
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ data: { session: {} }, error: null });
    setupClient(signInWithPassword);

    const result = await login({}, makeFormData());

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
    expect(result).toEqual({ redirectTo: "/auth/select-organization" });
  });

  it("carries the redirectTo query parameter for email logins", async () => {
    setupClient(
      vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    );

    const fd = makeFormData();
    fd.set("redirectTo", "/dashboard/expenses");
    const result = await login({}, fd);

    expect(result.redirectTo).toBe(
      "/auth/select-organization?redirectTo=%2Fdashboard%2Fexpenses",
    );
  });

  it("returns the sign-in error as a form error", async () => {
    setupClient(
      vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: "Invalid login credentials" },
      }),
    );

    const result = await login({}, makeFormData());

    expect(result.formError).toBe("Invalid login credentials");
    expect(result.values).toEqual({ identifier: "user@example.com" });
  });

  it("looks up phone profiles and signs in with the linked auth email", async () => {
    const serviceRole = setupServiceRole();
    serviceRole.__qb.resolveOnce({ data: { id: "prof-1" }, error: null });
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ data: { session: {} }, error: null });
    setupClient(signInWithPassword);
    serviceRole.auth.admin = {
      ...serviceRole.auth.admin,
      getUserById: vi.fn().mockResolvedValue({
        data: { user: { id: "prof-1", email: "real@example.com" } },
        error: null,
      }),
    };

    const result = await login({}, makeFormData({ identifier: "99112233" }));

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "real@example.com",
      password: "password123",
    });
    expect(result.redirectTo).toBe("/auth/select-organization");
  });

  it("reports a no-account username without a profile", async () => {
    const serviceRole = setupServiceRole();
    serviceRole.__qb.resolveOnce({ data: null, error: null });

    const result = await login({}, makeFormData({ identifier: "ghost_user" }));

    expect(result.formError).toBe("No account found with this username");
  });

  it("reports a no-account phone number", async () => {
    const serviceRole = setupServiceRole();
    serviceRole.__qb.resolveOnce({ data: null, error: null });

    const result = await login({}, makeFormData({ identifier: "99990000" }));

    expect(result.formError).toBe("No account found with this phone number");
  });

  it("reports profile lookup errors", async () => {
    setupServiceRole();
    const serviceRole = createMockSupabaseClient();
    serviceRole
      .from("profiles")
      .maybeSingle.mockReturnValue(serviceRole.from("profiles") as never);
    serviceRole.__qb.resolveOnce({
      data: null,
      error: { message: "boom" },
    });
    mockCreateServiceRoleClient.mockResolvedValue(serviceRole as never);

    const result = await login({}, makeFormData({ identifier: "99112233" }));

    expect(result.formError).toBe("Database lookup error: boom");
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Login lookup database error:",
      { message: "boom" },
    );
  });

  it("reports auth-user lookup errors", async () => {
    const serviceRole = setupServiceRole();
    serviceRole.__qb.resolveOnce({ data: { id: "prof-1" }, error: null });
    serviceRole.auth.admin = {
      ...serviceRole.auth.admin,
      getUserById: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "auth down" },
      }),
    };

    const result = await login({}, makeFormData({ identifier: "99112233" }));

    expect(result.formError).toBe("Auth lookup error: auth down");
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Login auth user fetch error:",
      { message: "auth down" },
    );
  });

  it("handles a profile without a linked email as no account", async () => {
    const serviceRole = setupServiceRole();
    serviceRole.__qb.resolveOnce({ data: { id: "prof-1" }, error: null });
    serviceRole.auth.admin = {
      ...serviceRole.auth.admin,
      getUserById: vi.fn().mockResolvedValue({
        data: { user: { id: "prof-1", email: null } },
        error: null,
      }),
    };

    const result = await login({}, makeFormData({ identifier: "99112233" }));

    expect(result.formError).toBe("No account found with this phone number");
  });

  it("swallows unexpected errors into a generic form error", async () => {
    setupClient(vi.fn().mockRejectedValue(new Error("network exploded")));

    const result = await login({}, makeFormData());

    expect(result.formError).toBe(
      "An unexpected error occurred. Please try again.",
    );
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Login unexpected error:",
      expect.any(Error),
    );
  });
});
