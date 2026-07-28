import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
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

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn() },
}));

const { POST } = await import("./route");

describe("POST /api/webhooks/sentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default env vars for tests that need them
    vi.stubEnv("GITHUB_TOKEN", "gh_token_xyz");
    vi.stubEnv("GITHUB_REPOSITORY", "themuuln/tolom");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("dispatches sentry alert to GitHub successfully", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    const payload = {
      id: "issue-42",
      message: "TypeError: undefined is not a function",
      event: {
        level: "error",
        culprit: "app/page.tsx",
      },
    };

    const req = new NextRequest("http://localhost/api/webhooks/sentry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response = await POST({ request: req });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      received: true,
      dispatched: true,
      issue_id: "issue-42",
    });

    // Verify the GitHub dispatch call
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/themuuln/tolom/dispatches");
    expect(opts.method).toBe("POST");
    expect(opts.headers).toMatchObject({
      Authorization: "Bearer gh_token_xyz",
    });
    expect(JSON.parse(opts.body)).toMatchObject({
      event_type: "sentry-issue",
      client_payload: {
        issue_id: "issue-42",
        title: "[error] TypeError: undefined is not a function",
      },
    });

    fetchMock.mockRestore();
  });

  it("returns 400 when issue ID is missing", async () => {
    const payload = { message: "Some error without an ID" };

    const req = new NextRequest("http://localhost/api/webhooks/sentry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response = await POST({ request: req });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("Missing issue ID");
  });

  it("returns dispatched=false when GITHUB_TOKEN is not configured", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("GITHUB_REPOSITORY", "themuuln/tolom");

    const payload = { id: "issue-7" };

    const req = new NextRequest("http://localhost/api/webhooks/sentry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response = await POST({ request: req });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      received: true,
      dispatched: false,
    });
  });

  it("returns dispatched=false when GITHUB_REPOSITORY is not configured", async () => {
    vi.stubEnv("GITHUB_TOKEN", "gh_token_xyz");
    vi.stubEnv("GITHUB_REPOSITORY", "");

    const payload = { id: "issue-7" };

    const req = new NextRequest("http://localhost/api/webhooks/sentry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response = await POST({ request: req });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      received: true,
      dispatched: false,
    });
  });

  it("returns 502 when GitHub dispatch fails", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("Not Found", { status: 404, statusText: "Not Found" }),
      );

    const payload = { id: "issue-99" };

    const req = new NextRequest("http://localhost/api/webhooks/sentry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response = await POST({ request: req });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error.code).toBe("DISPATCH_FAILED");
    expect(body.error.message).toBe("Failed to dispatch to GitHub");

    fetchMock.mockRestore();
  });

  it("extracts issue_id from event.event_id when top-level id is missing", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    const payload = {
      event: { event_id: "evt-abc", title: "RangeError", level: "fatal" },
    };

    const req = new NextRequest("http://localhost/api/webhooks/sentry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response = await POST({ request: req });
    const body = await response.json();

    expect(body.data).toEqual({
      received: true,
      dispatched: true,
      issue_id: "evt-abc",
    });

    fetchMock.mockRestore();
  });

  it("throws on invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/sentry", {
      method: "POST",
      body: "not-json",
    });

    await expect(POST({ request: req })).rejects.toThrow("Invalid JSON body");
  });
});
