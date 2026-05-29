import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("service worker registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerServiceWorker", () => {
    it("should be a function", async () => {
      const { registerServiceWorker } = await import("./sw-register");
      expect(typeof registerServiceWorker).toBe("function");
    });

    it("should not throw when called", async () => {
      const { registerServiceWorker } = await import("./sw-register");
      expect(() => registerServiceWorker()).not.toThrow();
    });
  });

  describe("unregisterServiceWorker", () => {
    it("should be a function", async () => {
      const { unregisterServiceWorker } = await import("./sw-register");
      expect(typeof unregisterServiceWorker).toBe("function");
    });

    it("should not throw when called", async () => {
      const { unregisterServiceWorker } = await import("./sw-register");
      expect(() => unregisterServiceWorker()).not.toThrow();
    });
  });

  describe("service worker file", () => {
    it("should have install event listener", async () => {
      const swContent = await import("node:fs").then((fs) =>
        fs.default.readFileSync("public/sw.js", "utf-8"),
      );
      expect(swContent).toContain('addEventListener("install"');
    });

    it("should have activate event listener", async () => {
      const swContent = await import("node:fs").then((fs) =>
        fs.default.readFileSync("public/sw.js", "utf-8"),
      );
      expect(swContent).toContain('addEventListener("activate"');
    });

    it("should have fetch event listener", async () => {
      const swContent = await import("node:fs").then((fs) =>
        fs.default.readFileSync("public/sw.js", "utf-8"),
      );
      expect(swContent).toContain('addEventListener("fetch"');
    });

    it("should cache static assets on install", async () => {
      const swContent = await import("node:fs").then((fs) =>
        fs.default.readFileSync("public/sw.js", "utf-8"),
      );
      expect(swContent).toContain("cache.addAll(PRE_CACHE_ASSETS)");
    });

    it("should clean up old caches on activate", async () => {
      const swContent = await import("node:fs").then((fs) =>
        fs.default.readFileSync("public/sw.js", "utf-8"),
      );
      expect(swContent).toContain("caches.delete(name)");
    });
  });
});
