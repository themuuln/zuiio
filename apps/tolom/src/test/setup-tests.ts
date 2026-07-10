import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Global mock for @/lib/audit — services call logAuditAfter which uses next/after
// This must be in setup so it's available before any test file imports
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(),
  logAuditAfter: vi.fn(),
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
