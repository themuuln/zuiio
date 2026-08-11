import { describe, expect, it } from "vitest";
import { apiError, created, noContent, ok } from "@/lib/api-response";

/**
 * Wire-contract tests for the universal API response helpers.
 *
 * Every route in the app emits responses through these helpers. These tests
 * pin the exact HTTP wire shape so a silent shape change anywhere fails here
 * first — the contract every route inherits.
 */
describe("api-response contract", () => {
  describe("ok", () => {
    it("returns 200 with { data } exactly", async () => {
      const response = ok({ synced: 3 });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      await expect(response.json()).resolves.toEqual({ data: { synced: 3 } });
    });

    it("passes through primitives, arrays, and null data", async () => {
      expect((await ok("x").json()).data).toBe("x");
      expect((await ok([1, 2]).json()).data).toEqual([1, 2]);
      expect((await ok(null).json()).data).toBeNull();
    });
  });

  describe("created", () => {
    it("returns 201 with { data }", async () => {
      const response = created({ id: "wo-1" });

      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({ data: { id: "wo-1" } });
    });
  });

  describe("noContent", () => {
    it("returns 204 with an empty body", async () => {
      const response = noContent();

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
      expect(response.body).toBeNull();
    });
  });

  describe("apiError", () => {
    it("returns the status with { error: { code, message } }", async () => {
      const response = apiError("FORBIDDEN", "Not a member", 403);

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: { code: "FORBIDDEN", message: "Not a member" },
      });
    });

    it("passes through custom headers", async () => {
      const response = apiError("RATE_LIMITED", "Too many requests", 429, {
        "Retry-After": "30",
      });

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("30");
    });
  });
});
