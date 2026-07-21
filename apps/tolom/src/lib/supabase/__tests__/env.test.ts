import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// env.ts functions read process.env at call time, so a single import is safe
import { env, getSupabaseKey } from "../env";

describe("env", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("env()", () => {
    it("returns the value when env var is set", () => {
      expect(env("NEXT_PUBLIC_SUPABASE_URL")).toBe("https://test.supabase.co");
    });

    it("returns another value when another var is set", () => {
      expect(env("NEXT_PUBLIC_SUPABASE_ANON_KEY")).toBe("test-anon-key");
    });

    it("throws when env var is missing", () => {
      expect(() => env("NONEXISTENT_VAR")).toThrow("Missing env var: NONEXISTENT_VAR");
    });

    it("throws when env var is empty string", () => {
      vi.stubEnv("EMPTY_VAR", "");
      expect(() => env("EMPTY_VAR")).toThrow("Missing env var: EMPTY_VAR");
    });
  });

  describe("getSupabaseKey()", () => {
    it("prefers publishable key over anon key", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key-123");
      expect(getSupabaseKey()).toBe("publishable-key-123");
    });

    it("falls back to anon key when publishable key is not set", () => {
      expect(getSupabaseKey()).toBe("test-anon-key");
    });

    it("returns anon key when publishable key is empty string", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
      expect(getSupabaseKey()).toBe("test-anon-key");
    });

    it("throws when neither key is set", () => {
      vi.unstubAllEnvs();
      expect(() => getSupabaseKey()).toThrow(
        "Missing Supabase API key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    });
  });
});
