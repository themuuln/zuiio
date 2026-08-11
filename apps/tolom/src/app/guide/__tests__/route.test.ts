import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as GET_GUIDE_PAGE } from "../[...slug]/route";
import { GET as GET_GUIDE } from "../route";

const GUIDE_DIR = path.join(process.cwd(), "public", "guide");

beforeAll(() => {
  // The guide is a VitePress build artifact (public/guide/ is gitignored).
  // Generate minimal fixtures so the route contract is tested deterministically
  // without running a full vitepress build.
  fs.mkdirSync(GUIDE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(GUIDE_DIR, "index.html"),
    "<html><body>TOLOM — Гарын авлага</body></html>",
  );
  fs.writeFileSync(
    path.join(GUIDE_DIR, "work-orders.html"),
    "<html><body>work-orders guide page</body></html>",
  );
});

afterAll(() => {
  fs.rmSync(GUIDE_DIR, { recursive: true, force: true });
});

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
