// Polyfill IndexedDB for jsdom — required by @zuiio/query factory's offline cache
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

// Global mock for @/lib/audit — services call logAuditAfter which uses next/after
// This must be in setup so it's available before any test file imports
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(),
  logAuditAfter: vi.fn(),
}));

// Mock @/lib/i18n/navigation — next-intl's createNavigation imports the bare
// "next/navigation" specifier, which pnpm's strict node_modules cannot resolve
// under vitest. Tests that care about routing mock this module per-file; this
// fallback keeps components that render Link/useRouter importable everywhere.
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children?: React.ReactNode;
  }) => createElement("a", { href: String(href), ...props }, children),
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  getPathname: (href: string) => href,
}));

// Mock @/lib/offline/idb-store so the factory's IndexedDB operations are
// instant in tests (fake-indexeddb works but openDB + upgrade is slow).
vi.mock("@/lib/offline/idb-store", () => ({
  putRecord: vi.fn().mockResolvedValue(undefined),
  putRecords: vi.fn().mockResolvedValue(undefined),
  putListResponse: vi.fn().mockResolvedValue(undefined),
  getListResponse: vi.fn().mockResolvedValue(null),
  getOrgRecords: vi.fn().mockResolvedValue([]),
  getRecord: vi.fn().mockResolvedValue(null),
  getRecordsByIds: vi.fn().mockResolvedValue([]),
  deleteRecord: vi.fn().mockResolvedValue(undefined),
  deleteRecords: vi.fn().mockResolvedValue(undefined),
  getOrgListResponses: vi.fn().mockResolvedValue([]),
  clearOrgData: vi.fn().mockResolvedValue(undefined),
  clearAllData: vi.fn().mockResolvedValue(undefined),
  getStorageEstimate: vi.fn().mockResolvedValue({ usage: 0, quota: 0 }),
  STORES: [],
}));

// Polyfills required by cmdk (Command component) in jsdom
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Polyfill getAnimations (required by @base-ui/react ScrollAreaViewport in jsdom)
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}

// Polyfill window.matchMedia (required by next-themes)
if (!globalThis.window) {
  (globalThis as { window: typeof globalThis }).window = globalThis;
}
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
// jsdom 29+ throws SecurityError for localStorage on opaque origins.
// Zustand persist middleware requires localStorage; stub it globally for all tests.
const storageMap = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, String(value));
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => [...storageMap.keys()][index] ?? null,
});

afterEach(() => cleanup());
