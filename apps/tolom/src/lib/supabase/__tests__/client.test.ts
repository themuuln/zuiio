import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({ createBrowserClient: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ getSupabaseKey: vi.fn() }));

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKey } from "@/lib/supabase/env";

const mockCreateBrowserClient = vi.mocked(createBrowserClient);
const mockGetSupabaseKey = vi.mocked(getSupabaseKey);

describe("createClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("creates a browser client with URL and key from env", async () => {
    const mockUrl = "https://test.supabase.co";
    const mockKey = "test-anon-key";
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", mockUrl);
    mockGetSupabaseKey.mockReturnValue(mockKey);

    const { createClient } = await import("../client");
    const _client = createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(mockUrl, mockKey);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing at module load time", async () => {
    mockGetSupabaseKey.mockReturnValue("some-key");
    await expect(import("../client")).rejects.toThrow(
      "Missing env var: NEXT_PUBLIC_SUPABASE_URL",
    );
  });
});
