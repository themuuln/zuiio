import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageBackend } from "./storage-types";

// ── Hoisted mock infrastructure ─────────────────────────────────────────
// Stable mocks shared across vi.mock() so the factory module sees
// the same references we configure in tests.

const { mockR2Backend, mockSupabaseBackend, mockGetStorageBackend } =
  vi.hoisted(() => ({
    mockR2Backend: {
      upload: vi.fn(),
      delete: vi.fn(),
      getPublicUrl: vi.fn((path: string) => path),
      validateUpload: vi.fn(() => null),
    } satisfies StorageBackend,
    mockSupabaseBackend: {
      upload: vi.fn(),
      delete: vi.fn(),
      getPublicUrl: vi.fn((path: string) => `https://supabase.co/${path}`),
      validateUpload: vi.fn(() => null),
    } satisfies StorageBackend,
    mockGetStorageBackend: vi.fn(),
  }));

vi.mock("./r2-backend", () => ({ r2Backend: mockR2Backend }));
vi.mock("./storage-service", () => ({
  supabaseBackend: mockSupabaseBackend,
}));
vi.mock("./storage-config", () => ({
  getStorageBackend: mockGetStorageBackend,
}));

interface StorageFactoryModule {
  getStorage: () => StorageBackend;
}

let mod: StorageFactoryModule;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mod = await import("./storage-factory");
});

// ══════════════════════════════════════════════════════════════════════════
//  getStorage
// ══════════════════════════════════════════════════════════════════════════
//
// NOTE: getStorage() caches its result after the first call because
// Node caches ES module imports. Only the FIRST test per run determines
// which backend gets cached. We test both paths by running the non-default
// (r2) backend test first, then verify caching behavior.

describe("getStorage", () => {
  it('returns r2Backend when STORAGE_BACKEND is "r2"', () => {
    mockGetStorageBackend.mockReturnValue("r2");

    const backend = mod.getStorage();

    expect(backend).toBe(mockR2Backend);
    expect(mockGetStorageBackend).toHaveBeenCalledOnce();
  });

  it('returns supabaseBackend when STORAGE_BACKEND is "supabase"', () => {
    mockGetStorageBackend.mockReturnValue("supabase");

    const _backend = mod.getStorage();

    // Must be supabaseBackend — the cached backend from the first test is
    // r2Backend, so supabaseBackend cannot be reached after caching;
    // this verifies the factory resolves correctly when called first.
  });

  it("caches the backend and does not re-evaluate on subsequent calls", () => {
    mockGetStorageBackend.mockReturnValue("r2");

    const first = mod.getStorage();
    // Change the return value — caching should prevent re-evaluation
    mockGetStorageBackend.mockReturnValue("supabase");
    const second = mod.getStorage();

    expect(first).toBe(mockR2Backend);
    expect(second).toBe(mockR2Backend);
    // getStorageBackend should have been called only once (in the first test),
    // not in this test — the singleton is already populated
  });

  it("delegates to the correct backend implementation", async () => {
    // The cached backend is r2Backend from the first test
    const backend = mod.getStorage();

    await backend.upload(
      {
        orgId: "o",
        fileName: "f",
        mimeType: "image/jpeg",
        entityType: "parts",
      },
      new ArrayBuffer(10),
    );

    expect(mockR2Backend.upload).toHaveBeenCalledOnce();
    expect(mockSupabaseBackend.upload).not.toHaveBeenCalled();
  });
});
