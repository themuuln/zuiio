import type { S3Client } from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mock infrastructure ─────────────────────────────────────────

const { mockS3Client, mockS3ClientInstance } = vi.hoisted(() => {
  const mockSend = vi.fn();
  // Use a regular function so `new S3Client(...)` works (arrow functions are not constructible)
  const instance = { send: mockSend };
  return {
    mockS3Client: vi.fn(() => instance),
    mockS3ClientInstance: instance,
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: mockS3Client,
}));

interface R2ClientModule {
  getR2Client: () => S3Client;
  getR2Bucket: () => string;
  isR2Configured: () => boolean;
}

let mod: R2ClientModule;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mod = await import("./r2-client");
});

// ══════════════════════════════════════════════════════════════════════════
//  getR2Client
// ══════════════════════════════════════════════════════════════════════════
//
// NOTE: `getR2Client()` caches a singleton after first successful call.
// The "throws" tests MUST run before any test that successfully creates the
// singleton, because Node caches the module across dynamic imports.

describe("getR2Client", () => {
  it("throws when all env vars are missing", () => {
    expect(() => mod.getR2Client()).toThrow("Missing R2 credentials");
  });

  it("throws when only R2_ACCOUNT_ID is set", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    expect(() => mod.getR2Client()).toThrow("Missing R2 credentials");
  });

  it("throws when R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are missing", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    vi.stubEnv("R2_BUCKET", "my-bucket");
    expect(() => mod.getR2Client()).toThrow("Missing R2 credentials");
  });

  it("creates a new S3Client with R2 config when env vars are set", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");
    vi.stubEnv("R2_BUCKET", "my-bucket");

    const client = mod.getR2Client();

    expect(client).toBeDefined();
    expect(mockS3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "auto",
        endpoint: "https://acct-123.r2.cloudflarestorage.com",
        credentials: { accessKeyId: "ak-test", secretAccessKey: "sk-test" },
      }),
    );
  });

  it("returns the same singleton on subsequent calls", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");
    vi.stubEnv("R2_BUCKET", "my-bucket");

    const first = mod.getR2Client();
    mockS3Client.mockClear();
    const second = mod.getR2Client();

    expect(second).toBe(first);
    expect(mockS3Client).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  getR2Bucket
// ══════════════════════════════════════════════════════════════════════════

describe("getR2Bucket", () => {
  it("returns the bucket name when R2_BUCKET is set", () => {
    vi.stubEnv("R2_BUCKET", "my-bucket");
    expect(mod.getR2Bucket()).toBe("my-bucket");
  });

  it("throws when R2_BUCKET is missing", () => {
    expect(() => mod.getR2Bucket()).toThrow("Missing R2_BUCKET");
  });

  it("throws when R2_BUCKET is empty string", () => {
    vi.stubEnv("R2_BUCKET", "");
    expect(() => mod.getR2Bucket()).toThrow("Missing R2_BUCKET");
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  isR2Configured
// ══════════════════════════════════════════════════════════════════════════

describe("isR2Configured", () => {
  it("returns true when all env vars are set", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");
    vi.stubEnv("R2_BUCKET", "my-bucket");

    expect(mod.isR2Configured()).toBe(true);
  });

  it("returns false when R2_ACCOUNT_ID is missing", () => {
    vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");
    vi.stubEnv("R2_BUCKET", "my-bucket");

    expect(mod.isR2Configured()).toBe(false);
  });

  it("returns false when R2_ACCESS_KEY_ID is missing", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");
    vi.stubEnv("R2_BUCKET", "my-bucket");

    expect(mod.isR2Configured()).toBe(false);
  });

  it("returns false when R2_SECRET_ACCESS_KEY is missing", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
    vi.stubEnv("R2_BUCKET", "my-bucket");

    expect(mod.isR2Configured()).toBe(false);
  });

  it("returns false when R2_BUCKET is missing", () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-123");
    vi.stubEnv("R2_ACCESS_KEY_ID", "ak-test");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "sk-test");

    expect(mod.isR2Configured()).toBe(false);
  });

  it("returns false when no env vars are set", () => {
    expect(mod.isR2Configured()).toBe(false);
  });
});
