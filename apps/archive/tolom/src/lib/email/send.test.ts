import { describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockSend },
  })),
}));

vi.mock("./client", () => ({
  EMAIL_FROM: "TOLOM <noreply@zuiiotech.com>",
  resend: {
    emails: { send: mockSend },
  },
}));

vi.mock("react-email", () => ({
  render: vi.fn(() => "<html>Mocked</html>"),
}));

// Template components must be callable (send.ts calls them before passing to render)
vi.mock("./templates/confirm", () => ({ ConfirmEmail: () => null }));
vi.mock("./templates/welcome", () => ({ WelcomeEmail: () => null }));

import { sendConfirmEmail, sendWelcomeEmail } from "./send";

describe("sendWelcomeEmail", () => {
  it("sends welcome email with correct params", async () => {
    const result = await sendWelcomeEmail(
      "user@test.com",
      "Test User",
      "https://tolom.app/login",
    );

    expect(mockSend).toHaveBeenCalledWith({
      from: "TOLOM <noreply@zuiiotech.com>",
      to: "user@test.com",
      subject: "Welcome to TOLOM",
      html: "<html>Mocked</html>",
    });
    expect(result).toEqual({ data: { id: "email-1" }, error: null });
  });
});

describe("sendConfirmEmail", () => {
  it("sends confirmation email with correct params", async () => {
    const result = await sendConfirmEmail(
      "user@test.com",
      "Test User",
      "https://tolom.app/confirm?token=abc",
    );

    expect(mockSend).toHaveBeenCalledWith({
      from: "TOLOM <noreply@zuiiotech.com>",
      to: "user@test.com",
      subject: "Confirm your email — TOLOM",
      html: "<html>Mocked</html>",
    });
    expect(result).toEqual({ data: { id: "email-1" }, error: null });
  });
});
