import type { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { parseListParams } from "./api-params";

function createMockRequest(searchParams: Record<string, string>): NextRequest {
  const url = new URL("https://api.tolom.app/api/test");
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return { nextUrl: url } as unknown as NextRequest;
}

describe("parseListParams", () => {
  it("returns undefined for missing params", () => {
    const result = parseListParams(createMockRequest({}));
    expect(result.q).toBeUndefined();
    expect(result.page).toBeUndefined();
    expect(result.pageSize).toBeUndefined();
    expect(result.branchId).toBeUndefined();
  });

  it("parses search query", () => {
    const result = parseListParams(createMockRequest({ q: "oil filter" }));
    expect(result.q).toBe("oil filter");
  });

  it("parses page number", () => {
    const result = parseListParams(createMockRequest({ page: "2" }));
    expect(result.page).toBe(2);
  });

  it("parses pageSize", () => {
    const result = parseListParams(createMockRequest({ pageSize: "50" }));
    expect(result.pageSize).toBe(50);
  });

  it("parses branch_id", () => {
    const result = parseListParams(
      createMockRequest({ branch_id: "branch-1" }),
    );
    expect(result.branchId).toBe("branch-1");
  });

  it("returns undefined for invalid page number", () => {
    const result = parseListParams(createMockRequest({ page: "abc" }));
    expect(result.page).toBeUndefined();
  });

  it("handles all params together", () => {
    const result = parseListParams(
      createMockRequest({
        q: "test",
        page: "3",
        pageSize: "25",
        branch_id: "b-1",
      }),
    );
    expect(result).toEqual({
      q: "test",
      page: 3,
      pageSize: 25,
      branchId: "b-1",
    });
  });
});
