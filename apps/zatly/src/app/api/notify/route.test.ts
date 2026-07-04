import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";

// Mock the auth dependency
vi.mock("@/lib/apiAuth", () => ({
  requireAuth: vi.fn(),
}));

// Mock nodemailer
vi.mock("nodemailer", () => {
  const sendMailMock = vi.fn();
  const createTransportMock = vi.fn(() => ({
    sendMail: sendMailMock,
  }));
  return {
    default: {
      createTransport: createTransportMock,
    },
    createTransport: createTransportMock,
  };
});

import { requireAuth } from "@/lib/apiAuth";
import nodemailer from "nodemailer";
import type { NextRequest } from "next/server";

function createRequest(method = "POST", body?: unknown): NextRequest {
  const { Request } = require("next/dist/compiled/@edge-runtime/primitives");
  const request = new Request("http://localhost:3001/api/notify", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return request as NextRequest;
}

const validPayload = {
  to: "test@example.com",
  subject: "Test Subject",
  text: "Test body",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue(null);
});

describe("POST /api/notify", () => {
  it("returns 200 with success: true for a valid payload", async () => {
    const response = await POST(createRequest("POST", validPayload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: undefined,
          pass: undefined,
        },
      }),
    );
  });

  it("sends an email with the correct parameters", async () => {
    await POST(createRequest("POST", validPayload));

    const sendMailMock = vi.mocked(nodemailer.createTransport).mock.results[0].value.sendMail;
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test body",
        from: undefined,
      }),
    );
  });

  it("includes html when provided", async () => {
    const payloadWithHtml = {
      ...validPayload,
      html: "<p>HTML body</p>",
    };

    await POST(createRequest("POST", payloadWithHtml));

    const sendMailMock = vi.mocked(nodemailer.createTransport).mock.results[0].value.sendMail;
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: "<p>HTML body</p>",
      }),
    );
  });

  it("returns 400 when to field is missing", async () => {
    const { to: _, ...payload } = validPayload;
    const response = await POST(createRequest("POST", payload));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when subject is missing", async () => {
    const { subject: _, ...payload } = validPayload;
    const response = await POST(createRequest("POST", payload));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when text is missing", async () => {
    const { text: _, ...payload } = validPayload;
    const response = await POST(createRequest("POST", payload));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 for an invalid email", async () => {
    const response = await POST(
      createRequest("POST", { ...validPayload, to: "not-an-email" }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.toLowerCase()).toContain("email");
  });

  it("returns 401 without authentication", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(createRequest("POST", validPayload));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 500 with error message when SMTP fails", async () => {
    // Make createTransport return an object with a sendMail that rejects
    const sendMailMock = vi.fn().mockRejectedValue(new Error("SMTP connection refused"));
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const response = await POST(createRequest("POST", validPayload));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error).toContain("SMTP connection refused");
  });

  it("handles SMTP errors gracefully without crashing", async () => {
    const sendMailMock = vi.fn().mockRejectedValue(new Error("Connection timeout"));
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const response = await POST(createRequest("POST", validPayload));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when request body is not valid JSON", async () => {
    const { Request } = require("next/dist/compiled/@edge-runtime/primitives");
    const request = new Request("http://localhost:3001/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    }) as unknown as NextRequest;

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("uses SMTP_HOST and SMTP_PORT from env when set", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_USER", "user@example.com");
    vi.stubEnv("SMTP_PASS", "app-password");

    await POST(createRequest("POST", validPayload));

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.com",
        port: 465,
        secure: true,
        auth: {
          user: "user@example.com",
          pass: "app-password",
        },
      }),
    );

    vi.unstubAllEnvs();
  });
});
