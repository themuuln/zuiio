import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { setCustomerPassword } from "../actions";

const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const REDIRECT_ERROR = new Error("NEXT_REDIRECT");

const CUSTOMER = {
  id: "cust-1",
  organization_id: "org-1",
  first_name: "Bat",
  last_name: "Erdene",
  email: "customer@example.com",
  portal_token: "token-123",
};

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    token: "token-123",
    email: "customer@example.com",
    password: "password123",
    confirmPassword: "password123",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(key, value);
  }
  return fd;
}

/** Route customers-chain `.maybeSingle()` through the shared thenable qb. */
function routeMaybeSingleThroughQueue(
  client: ReturnType<typeof createMockSupabaseClient>,
) {
  client
    .from("customers")
    .maybeSingle.mockReturnValue(client.from("customers") as never);
}

function setupClient() {
  const client = createMockSupabaseClient();
  routeMaybeSingleThroughQueue(client);
  mockCreateClient.mockResolvedValue(client as never);
  return client;
}

function setupServiceRole(
  listUsers: ReturnType<typeof vi.fn>,
  createUser: ReturnType<typeof vi.fn>,
) {
  const serviceRole = createMockSupabaseClient();
  (
    serviceRole.auth as {
      admin?: { listUsers: typeof listUsers; createUser: typeof createUser };
    }
  ).admin = { listUsers, createUser };
  mockCreateServiceRoleClient.mockResolvedValue(serviceRole as never);
  return serviceRole;
}

async function runWithRedirect(formData: FormData = makeFormData()) {
  redirectMock.mockImplementation(() => {
    throw REDIRECT_ERROR;
  });
  await expect(setCustomerPassword({}, formData)).rejects.toThrow(
    REDIRECT_ERROR,
  );
  expect(redirectMock).toHaveBeenCalledWith("/portal");
}

beforeEach(() => {
  vi.resetAllMocks();
  setupClient();
  setupServiceRole(
    vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
    vi.fn().mockResolvedValue({
      data: { user: { id: "auth-2" } },
      error: null,
    }),
  );
});

describe("setCustomerPassword", () => {
  it("rejects a missing access token before validation", async () => {
    const result = await setCustomerPassword({}, makeFormData({ token: "" }));

    expect(result.formError).toBe(
      "No access token provided. Please use the link from your email or messaging app.",
    );
  });

  it("returns field errors for an invalid email or short password", async () => {
    const result = await setCustomerPassword(
      {},
      makeFormData({ email: "nope", password: "123" }),
    );

    expect(result.fieldErrors?.email).toBe("Invalid email address");
    expect(result.fieldErrors?.password).toMatch(/at least 6 characters/i);
  });

  it("creates the auth user, links the customer and redirects to the portal", async () => {
    const client = setupClient();
    client.__qb.resolveOnce({ data: CUSTOMER, error: null });
    const serviceRole = setupServiceRole(
      vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      vi.fn().mockResolvedValue({
        data: { user: { id: "auth-2" } },
        error: null,
      }),
    );

    await runWithRedirect();

    expect(serviceRole.auth.admin.createUser).toHaveBeenCalledWith({
      email: "customer@example.com",
      password: "password123",
      email_confirm: true,
    });
    expect(client.from).toHaveBeenCalledWith("customers");
    expect(client.from("customers").update).toHaveBeenCalledWith({
      customer_user_id: "auth-2",
    });
  });

  it("returns a form error for an invalid or expired token", async () => {
    const client = setupClient();
    client.__qb.resolveOnce({ data: null, error: null });

    const result = await setCustomerPassword({}, makeFormData());

    expect(result.formError).toBe("Invalid or expired token");
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it("propagates customer lookup errors", async () => {
    const client = setupClient();
    client.__qb.resolveOnce({
      data: null,
      error: { message: "query failed" },
    });

    const result = await setCustomerPassword({}, makeFormData());

    expect(result.formError).toBe("query failed");
  });

  it("blocks emails already linked to another customer", async () => {
    const client = setupClient();
    client.__qb.resolveOnce({ data: CUSTOMER, error: null });
    // Email conflict lookup finds a DIFFERENT customer record
    client.__qb.resolveOnce({
      data: { id: "cust-other" },
      error: null,
    });
    const serviceRole = setupServiceRole(
      vi.fn().mockResolvedValue({
        data: {
          users: [{ id: "auth-existing", email: "Customer@Example.com" }],
        },
        error: null,
      }),
      vi.fn(),
    );

    const result = await setCustomerPassword({}, makeFormData());

    expect(result.formError).toBe("Email is already linked to another account");
    // Case-insensitive email comparison hit, user creation skipped
    expect(serviceRole.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("allows the same customer to re-use their own email", async () => {
    const client = setupClient();
    client.__qb.resolveOnce({ data: CUSTOMER, error: null });
    // Conflict lookup resolves back to the SAME customer
    client.__qb.resolveOnce({ data: { id: "cust-1" }, error: null });
    setupServiceRole(
      vi.fn().mockResolvedValue({
        data: {
          users: [{ id: "auth-existing", email: "customer@example.com" }],
        },
        error: null,
      }),
      vi.fn().mockResolvedValue({
        data: { user: { id: "auth-2" } },
        error: null,
      }),
    );

    await runWithRedirect();
  });

  it("returns the user-creation error as a form error", async () => {
    const client = setupClient();
    client.__qb.resolveOnce({ data: CUSTOMER, error: null });
    setupServiceRole(
      vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "User already registered" },
      }),
    );

    const result = await setCustomerPassword({}, makeFormData());

    expect(result.formError).toBe("User already registered");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns the customer update error as a form error", async () => {
    const client = setupClient();
    client.__qb.resolveOnce({ data: CUSTOMER, error: null });
    // The `update().eq()` chain resolves through the same thenable queue
    client.__qb.resolveOnce({
      data: null,
      error: { message: "update denied" },
    });
    setupServiceRole(
      vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      vi.fn().mockResolvedValue({
        data: { user: { id: "auth-2" } },
        error: null,
      }),
    );

    const result = await setCustomerPassword({}, makeFormData());

    expect(result.formError).toBe("update denied");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
