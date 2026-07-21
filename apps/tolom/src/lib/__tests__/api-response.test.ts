import { describe, expect, it, vi } from "vitest";

const { mockJson, MockNextResponse } = vi.hoisted(() => {
  const json = vi.fn();
  class NextResponse {
    static json = json;
    status: number;
    body: unknown;
    constructor(body: unknown, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status ?? 200;
    }
  }
  return { mockJson: json, MockNextResponse: NextResponse };
});

vi.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

vi.mock("../api-handler", () => ({
  createRouteHandler: vi.fn(),
  createSimpleRouteHandler: vi.fn(),
}));

import {
  apiError,
  createRouteHandler,
  createSimpleRouteHandler,
  created,
  noContent,
  ok,
} from "../api-response";

describe("ok", () => {
  it("returns 200 with data wrapped in response", () => {
    const data = { id: 1, name: "test" };
    ok(data);
    expect(mockJson).toHaveBeenCalledWith({ data }, undefined);
  });

  it("passes through init options", () => {
    const headers = new Headers({ "X-Custom": "value" });
    ok({ x: 1 }, { status: 200, headers });
    expect(mockJson).toHaveBeenCalledWith(
      { data: { x: 1 } },
      { status: 200, headers },
    );
  });

  it("returns response when called without init", () => {
    mockJson.mockReturnValue(new MockNextResponse(null));
    const result = ok("hello");
    expect(result).toBeInstanceOf(MockNextResponse);
  });
});

describe("created", () => {
  it("returns 201 with data wrapped in response", () => {
    created({ id: 1 });
    expect(mockJson).toHaveBeenCalledWith(
      { data: { id: 1 } },
      { status: 201 },
    );
  });

  it("returns 201 for falsy data", () => {
    created(null);
    expect(mockJson).toHaveBeenCalledWith({ data: null }, { status: 201 });
  });
});

describe("noContent", () => {
  it("returns 204 with null body", () => {
    const result = noContent();
    expect(result).toBeInstanceOf(MockNextResponse);
    expect(result.status).toBe(204);
    expect(result.body).toBeNull();
  });
});

describe("apiError", () => {
  it("returns structured error with given status", () => {
    apiError("NOT_FOUND", "Resource not found", 404);
    expect(mockJson).toHaveBeenCalledWith(
      { error: { code: "NOT_FOUND", message: "Resource not found" } },
      { status: 404, headers: undefined },
    );
  });

  it("accepts custom headers", () => {
    const headers = { "X-Error-Code": "rate-limit" };
    apiError("RATE_LIMIT", "Too many requests", 429, headers);
    expect(mockJson).toHaveBeenCalledWith(
      { error: { code: "RATE_LIMIT", message: "Too many requests" } },
      { status: 429, headers },
    );
  });

  it("handles empty message string", () => {
    apiError("OK", "", 200);
    expect(mockJson).toHaveBeenCalledWith(
      { error: { code: "OK", message: "" } },
      { status: 200, headers: undefined },
    );
  });
});

describe("re-exports", () => {
  it("re-exports createRouteHandler from api-handler", () => {
    expect(createRouteHandler).toBeDefined();
    expect(createRouteHandler).toEqual(expect.any(Function));
  });

  it("re-exports createSimpleRouteHandler from api-handler", () => {
    expect(createSimpleRouteHandler).toBeDefined();
    expect(createSimpleRouteHandler).toEqual(expect.any(Function));
  });
});
