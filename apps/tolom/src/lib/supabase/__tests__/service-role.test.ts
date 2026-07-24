import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ env: vi.fn() }));

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/supabase/env";

const mockCreateClient = vi.mocked(createClient);
const mockEnv = vi.mocked(env);

describe("createServiceRoleClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    mockEnv.mockReturnValue("https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { createServiceRoleClient } = await import("../service-role");
    await expect(createServiceRoleClient()).rejects.toThrow(
      "Missing SUPABASE_SERVICE_ROLE_KEY",
    );
  });

  it("creates a service role client with correct config", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-123");
    mockEnv.mockReturnValue("https://test.supabase.co");

    const { createServiceRoleClient } = await import("../service-role");
    await createServiceRoleClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key-123",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  });
});
