import { describe, expect, it } from "vitest";
import { GET as GET_GUIDE_PAGE } from "../[...slug]/route";
import { GET as GET_GUIDE } from "../route";

describe("guide routes", () => {
  it("serves the generated guide index as HTML", async () => {
    const response = await GET_GUIDE();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("TOLOM");
  });

  it("serves a generated guide page from its HTML alternate path", async () => {
    const response = await GET_GUIDE_PAGE(
      new Request("http://localhost/guide/work-orders"),
      {
        params: Promise.resolve({ slug: ["work-orders"] }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("work-orders");
  });

  it("returns not found for an unknown guide page", async () => {
    const response = await GET_GUIDE_PAGE(
      new Request("http://localhost/guide/does-not-exist"),
      { params: Promise.resolve({ slug: ["does-not-exist"] }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });
});
