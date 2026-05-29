import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onLinkHover, prefetchCriticalRoutes } from "./prefetch";

describe("prefetch utility", () => {
  beforeEach(() => {
    // Clear any existing link elements
    document.querySelectorAll('link[rel="prefetch"]').forEach((el) => {
      el.remove();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("prefetchCriticalRoutes", () => {
    it("should create prefetch link elements for critical routes", () => {
      // Mock requestIdleCallback
      const mockRequestIdleCallback = vi.fn((cb) => cb());
      vi.stubGlobal("requestIdleCallback", mockRequestIdleCallback);

      prefetchCriticalRoutes();

      // Should have called requestIdleCallback
      expect(mockRequestIdleCallback).toHaveBeenCalled();

      // Should have created prefetch links
      const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
      expect(prefetchLinks.length).toBeGreaterThan(0);
    });

    it("should prefetch auth routes", () => {
      const mockRequestIdleCallback = vi.fn((cb) => cb());
      vi.stubGlobal("requestIdleCallback", mockRequestIdleCallback);

      prefetchCriticalRoutes();

      const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
      const hrefs = Array.from(prefetchLinks).map((link) =>
        link.getAttribute("href"),
      );

      expect(hrefs).toContain("/auth/login");
      expect(hrefs).toContain("/auth/signup");
    });

    it("should prefetch dashboard routes", () => {
      const mockRequestIdleCallback = vi.fn((cb) => cb());
      vi.stubGlobal("requestIdleCallback", mockRequestIdleCallback);

      prefetchCriticalRoutes();

      const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
      const hrefs = Array.from(prefetchLinks).map((link) =>
        link.getAttribute("href"),
      );

      expect(hrefs).toContain("/dashboard");
      expect(hrefs).toContain("/dashboard/work-orders");
    });
  });

  describe("onLinkHover", () => {
    it("should return a function that creates a prefetch link", () => {
      const hoverHandler = onLinkHover("/pricing");

      expect(typeof hoverHandler).toBe("function");

      hoverHandler();

      const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
      const hrefs = Array.from(prefetchLinks).map((link) =>
        link.getAttribute("href"),
      );

      expect(hrefs).toContain("/pricing");
    });

    it("should create prefetch link with correct attributes", () => {
      const hoverHandler = onLinkHover("/auth/login");

      hoverHandler();

      const prefetchLink = document.querySelector(
        'link[href="/auth/login"]',
      ) as HTMLLinkElement;
      expect(prefetchLink).toBeTruthy();
      expect(prefetchLink.rel).toBe("prefetch");
      expect(prefetchLink.as).toBe("document");
    });
  });
});
