import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { resetPassword } from "../actions";

const mockCreateClient = vi.mocked(createClient);

const REDIRECT_ERROR = new Error("NEXT_REDIRECT");

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    password: "newpassword123",
    confirmPassword: "newpassword123",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(key, value);
  }
  return fd;
}

async function runWithRedirect(formData: FormData = makeFormData()) {
  redirectMock.mockImplementation(() => {
    throw REDIRECT_ERROR;
  });
  await expect(resetPassword({}, formData)).rejects.toThrow(REDIRECT_ERROR);
  expect(redirectMock).toHaveBeenCalledWith("/auth/login?reset=success");
}

beforeEach(() => {
  vi.resetAllMocks();
  mockCreateClient.mockResolvedValue(createMockSupabaseClient() as never);
});

describe("resetPassword", () => {
  it("returns field errors for a short password", async () => {
    const result = await resetPassword({}, makeFormData({ password: "short" }));

    expect(result.fieldErrors?.password).toMatch(/at least 8 characters/i);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("returns a field error when the passwords do not match", async () => {
    const result = await resetPassword(
      {},
      makeFormData({ confirmPassword: "different" }),
    );

    expect(result.fieldErrors?.confirmPassword).toBe("Passwords do not match");
  });

  it("updates the user password and redirects with the reset flag", async () => {
    const client = createMockSupabaseClient();
    const updateUser = vi.fn().mockResolvedValue({ data: {}, error: null });
    client.auth.updateUser = updateUser;
    mockCreateClient.mockResolvedValue(client as never);

    await runWithRedirect();

    expect(updateUser).toHaveBeenCalledWith({ password: "newpassword123" });
  });

  it("returns the update error as a form error", async () => {
    const client = createMockSupabaseClient();
    const updateUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "Password should be at least 8 characters" },
    });
    client.auth.updateUser = updateUser;
    mockCreateClient.mockResolvedValue(client as never);

    const result = await resetPassword({}, makeFormData());

    expect(result.formError).toBe("Password should be at least 8 characters");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
