import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const redirectMock = vi.hoisted(() => vi.fn());
const isRedirectErrorMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: isRedirectErrorMock,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));
vi.mock("@/lib/email/send", () => ({ sendWelcomeEmail: vi.fn() }));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { sendWelcomeEmail } from "@/lib/email/send";
import { reportServerError } from "@/lib/sentry-report-server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { signup } from "../actions";

const mockSendWelcomeEmail = vi.mocked(sendWelcomeEmail);
const mockReportServerError = vi.mocked(reportServerError);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const REDIRECT_ERROR = new Error("NEXT_REDIRECT");

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    fullName: "Bat Erdene",
    identifier: "bat@example.com",
    password: "password123",
    confirmPassword: "password123",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(key, value);
  }
  return fd;
}

/**
 * Run signup with redirect() armed to throw NEXT_REDIRECT and assert the
 * action re-throws it after calling redirect with the expected path.
 */
async function runWithRedirect(
  path: string,
  formData: FormData = makeFormData(),
) {
  redirectMock.mockImplementation(() => {
    throw REDIRECT_ERROR;
  });
  isRedirectErrorMock.mockReturnValue(true);
  await expect(signup({}, formData)).rejects.toThrow(REDIRECT_ERROR);
  expect(redirectMock).toHaveBeenCalledWith(path);
}

function setupServiceRole(createUser: ReturnType<typeof vi.fn>) {
  const client = createMockSupabaseClient();
  (client.auth as { admin?: { createUser: typeof createUser } }).admin = {
    createUser,
  };
  mockCreateServiceRoleClient.mockResolvedValue(client as never);
  return client;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  mockSendWelcomeEmail.mockResolvedValue(undefined);
  const client = createMockSupabaseClient();
  client.auth.signInWithPassword = vi
    .fn()
    .mockResolvedValue({ data: {}, error: null });
  mockCreateClient.mockResolvedValue(client as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signup", () => {
  it("returns field errors when required fields are missing", async () => {
    const result = await signup({}, new FormData());

    expect(result.fieldErrors).toMatchObject({
      identifier: expect.any(String),
      password: expect.any(String),
      confirmPassword: expect.any(String),
    });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it("reports mismatched passwords on the confirmPassword field", async () => {
    const result = await signup(
      {},
      makeFormData({ password: "password123", confirmPassword: "different" }),
    );

    expect(result.fieldErrors?.confirmPassword).toBe("Passwords do not match");
    expect(result.values).toEqual({
      fullName: "Bat Erdene",
      identifier: "bat@example.com",
    });
  });

  it("rejects usernames with invalid characters", async () => {
    const result = await signup({}, makeFormData({ identifier: "bad user!" }));

    expect(result.fieldErrors?.identifier).toBe(
      "Username can only contain letters, numbers, and underscores",
    );
  });

  it("rejects usernames shorter than 3 characters", async () => {
    const result = await signup({}, makeFormData({ identifier: "ab" }));

    expect(result.fieldErrors?.identifier).toBe(
      "Username must be between 3 and 30 characters",
    );
  });

  it("creates the user with a confirmed email, saves the profile and redirects to org setup", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    const client = setupServiceRole(createUser);
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ data: {}, error: null });
    mockCreateClient.mockResolvedValue({
      ...client,
      auth: { ...client.auth, signInWithPassword },
    } as never);

    await runWithRedirect("/auth/setup-organization");

    expect(createUser).toHaveBeenCalledWith({
      email: "bat@example.com",
      password: "password123",
      email_confirm: true,
      user_metadata: { full_name: "Bat Erdene" },
    });
    expect(client.from).toHaveBeenCalledWith("profiles");
    expect(client.from("profiles").upsert).toHaveBeenCalledWith(
      { id: "auth-1", full_name: "Bat Erdene" },
      { onConflict: "id" },
    );
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
      "bat@example.com",
      "Bat Erdene",
      "http://localhost:3000/auth/login",
    );
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "bat@example.com",
      password: "password123",
    });
  });

  it("normalizes Mongolian phone identifiers into the synthetic auth email", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "auth-2" } },
      error: null,
    });
    const client = setupServiceRole(createUser);

    await runWithRedirect(
      "/auth/setup-organization",
      makeFormData({ identifier: "99112233" }),
    );

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "phone_97699112233@tolom.auth" }),
    );
    expect(client.from("profiles").upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "auth-2",
        phone: "+97699112233",
      }),
      { onConflict: "id" },
    );
    // No welcome email for phone signups
    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("uses the lowercase username as the profile username", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "auth-3" } },
      error: null,
    });
    const client = setupServiceRole(createUser);

    await runWithRedirect(
      "/auth/setup-organization",
      makeFormData({ identifier: "BAT_ERDENE" }),
    );

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "username_bat_erdene@tolom.auth" }),
    );
    expect(client.from("profiles").upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "auth-3", username: "bat_erdene" }),
      { onConflict: "id" },
    );
  });

  it("redirects to the invite page when a redirectTo is provided", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    setupServiceRole(createUser);

    const fd = makeFormData();
    fd.set("redirectTo", "/invite/abc123");
    await runWithRedirect("/invite/abc123", fd);
  });

  it("redirects to login when the automatic sign-in fails", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    const client = setupServiceRole(createUser);
    mockCreateClient.mockResolvedValue({
      ...client,
      auth: {
        ...client.auth,
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: "invalid credentials" },
        }),
      },
    } as never);

    await runWithRedirect("/auth/login");
  });

  it("surfaces already-registered identifiers as a form error", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });
    setupServiceRole(createUser);

    const result = await signup({}, makeFormData());

    expect(result.formError).toBe(
      "This email, phone, or username is already in use",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns a network error message for connect timeouts", async () => {
    const createUser = vi.fn().mockRejectedValue(
      Object.assign(new Error("fetch failed"), {
        cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
      }),
    );
    setupServiceRole(createUser);

    const result = await signup({}, makeFormData());

    expect(result.formError).toBe(
      "Network error. Please check your connection and try again.",
    );
    expect(mockReportServerError).toHaveBeenCalledTimes(2);
  });

  it("rethrows unexpected errors after reporting them", async () => {
    const createUser = vi
      .fn()
      .mockRejectedValue(new Error("database exploded"));
    setupServiceRole(createUser);

    await expect(signup({}, makeFormData())).rejects.toThrow(
      "database exploded",
    );
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      expect.any(Error),
    );
  });
});
