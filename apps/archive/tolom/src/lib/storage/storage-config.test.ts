import { beforeEach, describe, expect, it, vi } from "vitest";

interface StorageConfigModule {
  getStorageBackend: () => "supabase" | "r2";
}

let mod: StorageConfigModule;

beforeEach(async () => {
  vi.unstubAllEnvs();
  mod = await import("./storage-config");
});

// ══════════════════════════════════════════════════════════════════════════
//  getStorageBackend
// ══════════════════════════════════════════════════════════════════════════

describe("getStorageBackend", () => {
  it('returns "supabase" by default when STORAGE_BACKEND is not set', () => {
    expect(mod.getStorageBackend()).toBe("supabase");
  });

  it('returns "r2" when STORAGE_BACKEND is set to "r2"', () => {
    vi.stubEnv("STORAGE_BACKEND", "r2");
    expect(mod.getStorageBackend()).toBe("r2");
  });

  it('returns "supabase" when STORAGE_BACKEND is set to "supabase"', () => {
    vi.stubEnv("STORAGE_BACKEND", "supabase");
    expect(mod.getStorageBackend()).toBe("supabase");
  });

  it("throws when STORAGE_BACKEND is set to an invalid value", () => {
    vi.stubEnv("STORAGE_BACKEND", "gcs");
    expect(() => mod.getStorageBackend()).toThrow(
      'Invalid STORAGE_BACKEND "gcs"',
    );
  });

  it("throws with a descriptive message including valid options", () => {
    vi.stubEnv("STORAGE_BACKEND", "azure");
    expect(() => mod.getStorageBackend()).toThrow('Must be "supabase" or "r2"');
  });
});
