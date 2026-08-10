import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));
vi.mock("@/lib/services/email-service", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/sentry-report-server", () => ({ reportServerError: vi.fn() }));

import { reportServerError } from "@/lib/sentry-report-server";
import { sendEmail } from "@/lib/services/email-service";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { requestPasswordReset } from "../actions";

const mockReportServerError = vi.mocked(reportServerError);
const mockSendEmail = vi.mocked(sendEmail);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tolom.example");
  mockSendEmail.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function makeFormData(identifier: string): FormData {
  const fd = new FormData();
  fd.set("identifier", identifier);
  return fd;
}

function setupServiceRole(admin: Record<string, ReturnType<typeof vi.fn>>) {
  const client = createMockSupabaseClient();
  (client.auth as { admin?: Record<string, ReturnType<typeof vi.fn>> }).admin =
    admin;
  // Route `.maybeSingle()` through the shared thenable qb so sequential
  // awaits consume `client.__qb.resolveOnce(...)` entries.
  client
    .from("profiles")
    .maybeSingle.mockReturnValue(client.from("profiles") as never);
  mockCreateServiceRoleClient.mockResolvedValue(client as never);
  return client;
}

const generateLink = vi.fn();

describe("requestPasswordReset", () => {
  it("returns field errors for an empty identifier", async () => {
    const result = await requestPasswordReset({}, new FormData());

    expect(result.fieldErrors?.identifier).toBeDefined();
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it("sends a recovery email for an email identifier", async () => {
    setupServiceRole({ generateLink });
    generateLink.mockResolvedValue({
      data: {
        properties: { action_link: "https://tolom.example/recover/abc" },
      },
      error: null,
    });

    const result = await requestPasswordReset(
      {},
      makeFormData("user@example.com"),
    );

    expect(result).toEqual({ success: true });
    expect(generateLink).toHaveBeenCalledWith({
      type: "recovery",
      email: "user@example.com",
      options: { redirectTo: "https://tolom.example/auth/reset-password" },
    });
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Нууц үг сэргээх хүсэлт",
      html: expect.stringContaining("https://tolom.example/recover/abc"),
    });
  });

  it("looks up phone profiles and emails the linked auth address", async () => {
    const client = setupServiceRole({ generateLink });
    generateLink.mockResolvedValue({
      data: {
        properties: { action_link: "https://tolom.example/recover/xyz" },
      },
      error: null,
    });
    // 1. phone lookup → profile id; 2. full_name lookup
    client.__qb.resolveOnce({ data: { id: "prof-1" }, error: null });
    client.__qb.resolveOnce({
      data: { full_name: "Bat Erdene" },
      error: null,
    });
    client.auth.admin = {
      ...client.auth.admin,
      getUserById: vi.fn().mockResolvedValue({
        data: { user: { email: "real@example.com" } },
        error: null,
      }),
      generateLink,
    };

    const result = await requestPasswordReset({}, makeFormData("99112233"));

    expect(result).toEqual({ success: true });
    // display name from the profile is used in the email HTML
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "real@example.com",
        html: expect.stringContaining("Bat Erdene"),
      }),
    );
  });

  it("never reveals unknown phone numbers — no email is sent", async () => {
    setupServiceRole({ generateLink });

    const result = await requestPasswordReset({}, makeFormData("99990000"));

    expect(result).toEqual({ success: true });
    expect(generateLink).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("stays silent when no action link is generated", async () => {
    setupServiceRole({ generateLink });
    generateLink.mockResolvedValue({ data: { properties: {} }, error: null });

    const result = await requestPasswordReset(
      {},
      makeFormData("user@example.com"),
    );

    expect(result).toEqual({ success: true });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("swallows email failures but reports them", async () => {
    setupServiceRole({ generateLink });
    generateLink.mockResolvedValue({
      data: { properties: { action_link: "https://tolom.example/recover/1" } },
      error: null,
    });
    const failure = new Error("smtp down");
    mockSendEmail.mockRejectedValue(failure);

    const result = await requestPasswordReset(
      {},
      makeFormData("user@example.com"),
    );

    expect(result).toEqual({ success: true });
    expect(mockReportServerError).toHaveBeenCalledWith(
      "Unexpected error",
      failure,
    );
  });
});
