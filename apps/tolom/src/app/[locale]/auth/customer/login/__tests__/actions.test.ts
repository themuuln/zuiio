import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { customerLogin } from "../actions";

const mockCreateClient = vi.mocked(createClient);

const REDIRECT_ERROR = new Error("NEXT_REDIRECT");

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    email: "customer@example.com",
    password: "password123",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(key, value);
  }
  return fd;
}

async function runWithRedirect(
  path: string,
  formData: FormData = makeFormData(),
) {
  redirectMock.mockImplementation(() => {
    throw REDIRECT_ERROR;
  });
  await expect(customerLogin({}, formData)).rejects.toThrow(REDIRECT_ERROR);
  expect(redirectMock).toHaveBeenCalledWith(path);
}

function setupClient(signInWithPassword: ReturnType<typeof vi.fn>) {
  const client = createMockSupabaseClient();
  client.auth.signInWithPassword = signInWithPassword;
  mockCreateClient.mockResolvedValue(client as never);
  return client;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockCreateClient.mockResolvedValue(createMockSupabaseClient() as never);
});

describe("customerLogin", () => {
  it("returns field errors for an invalid email", async () => {
    const result = await customerLogin(
      {},
      makeFormData({ email: "not-an-email" }),
    );

    expect(result.fieldErrors?.email).toBe("Invalid email address");
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("signs in and redirects to the portal by default", async () => {
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ data: { session: {} }, error: null });
    setupClient(signInWithPassword);

    await runWithRedirect("/portal");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "customer@example.com",
      password: "password123",
    });
  });

  it("redirects to the requested redirectTo path", async () => {
    setupClient(
      vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    );

    await runWithRedirect(
      "/portal/invoices?status=open",
      makeFormData({ redirectTo: "/portal/invoices?status=open" }),
    );
  });

  it("returns the sign-in error as a form error", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });
    setupClient(signInWithPassword);

    const result = await customerLogin({}, makeFormData());

    expect(result.formError).toBe("Invalid login credentials");
    expect(result.values).toEqual({ email: "customer@example.com" });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
