import { describe, expect, it } from "vitest";
import { ok, created, noContent, apiError } from "./api-response";

describe("ok", () => {
  it("returns 200 with data", async () => {
    const res = ok({ id: "1", name: "test" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: { id: "1", name: "test" } });
  });

  it("accepts custom init", async () => {
    const res = ok({ id: "1" }, { headers: { "X-Custom": "value" } });
    expect(res.headers.get("X-Custom")).toBe("value");
  });
});

describe("created", () => {
  it("returns 201 with data", async () => {
    const res = created({ id: "new-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ data: { id: "new-1" } });
  });
});

describe("noContent", () => {
  it("returns 204 with no body", () => {
    const res = noContent();
    expect(res.status).toBe(204);
  });
});

describe("apiError", () => {
  it("returns structured error response", async () => {
    const res = apiError("NOT_FOUND", "Resource not found", 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      error: { code: "NOT_FOUND", message: "Resource not found" },
    });
  });

  it("includes custom headers", async () => {
    const res = apiError("AUTH_REQUIRED", "Login required", 401, {
      "X-Auth-Required": "true",
    });
    expect(res.headers.get("X-Auth-Required")).toBe("true");
  });
});
