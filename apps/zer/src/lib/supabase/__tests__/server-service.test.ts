/**
 * Tests for src/lib/supabase/server-service.ts
 */
import { describe, expect, it, vi } from "vitest";

const mockGetSupabaseEnv = vi.fn();
vi.mock("../env", () => ({
  getSupabaseEnv: mockGetSupabaseEnv,
}));

// Mock server-only so it doesn't throw in test env
vi.mock("server-only", () => ({}));

describe("createServiceClient", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    vi.clearAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("creates a Supabase client with service_role key", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const { createServiceClient } = await import("../server-service");
    const client = createServiceClient();

    expect(client).toBeDefined();
    expect(mockGetSupabaseEnv).toHaveBeenCalledTimes(1);
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    mockGetSupabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createServiceClient } = await import("../server-service");
    expect(() => createServiceClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });
});
