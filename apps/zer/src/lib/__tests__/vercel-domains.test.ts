import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachDomainToVercel,
  detachDomainFromVercel,
  dnsRecordFor,
  getVercelDomainStatus,
  VERCEL_CNAME_TARGET,
  VERCEL_EDGE_IP,
} from "@/lib/vercel-domains";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  process.env.VERCEL_API_TOKEN = "test-token";
  process.env.VERCEL_PROJECT_ID = "prj_test";
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.VERCEL_API_TOKEN;
  delete process.env.VERCEL_PROJECT_ID;
});

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("attachDomainToVercel", () => {
  it("attaches the domain and reports not-already-present", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { name: "shop.mn" }));
    const result = await attachDomainToVercel("shop.mn");

    expect(result).toEqual({
      configured: true,
      attached: true,
      alreadyPresent: false,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v9/projects/prj_test/domains",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "shop.mn" }),
      }),
    );
  });

  it("treats Vercel 400 as idempotent success (domain already attached)", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(400, { error: { code: "already_exists" } }),
    );
    const result = await attachDomainToVercel("shop.mn");
    expect(result).toEqual({
      configured: true,
      attached: true,
      alreadyPresent: true,
    });
  });

  it("surfaces other errors without throwing", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(500, { error: { message: "boom" } }),
    );
    const result = await attachDomainToVercel("shop.mn");
    expect(result.configured).toBe(true);
    if (result.configured) {
      expect(result.attached).toBe(false);
      expect(result.error).toContain("boom");
    }
  });

  it("reports unconfigured when env vars are missing", async () => {
    delete process.env.VERCEL_API_TOKEN;
    await expect(attachDomainToVercel("shop.mn")).resolves.toEqual({
      configured: false,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("getVercelDomainStatus", () => {
  it("reads the verified flag", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { verified: true }));
    await expect(getVercelDomainStatus("shop.mn")).resolves.toEqual({
      configured: true,
      present: true,
      verified: true,
    });
  });

  it("reports absent on 404", async () => {
    mockFetch.mockResolvedValue(jsonResponse(404, {}));
    await expect(getVercelDomainStatus("shop.mn")).resolves.toEqual({
      configured: true,
      present: false,
      verified: false,
    });
  });
});

describe("detachDomainFromVercel", () => {
  it("deletes the domain", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));
    await expect(detachDomainFromVercel("shop.mn")).resolves.toEqual({
      configured: true,
      detached: true,
    });
  });

  it("treats 404 as already gone", async () => {
    mockFetch.mockResolvedValue(jsonResponse(404, {}));
    await expect(detachDomainFromVercel("shop.mn")).resolves.toEqual({
      configured: true,
      detached: true,
    });
  });
});

describe("dnsRecordFor", () => {
  it("returns the apex A record for a two-label domain", () => {
    expect(dnsRecordFor("bujin.mn")).toEqual({
      kind: "apex",
      type: "A",
      name: "@",
      value: VERCEL_EDGE_IP,
    });
  });

  it("returns the CNAME record for a subdomain", () => {
    expect(dnsRecordFor("shop.bujin.mn")).toEqual({
      kind: "subdomain",
      type: "CNAME",
      name: "shop",
      value: VERCEL_CNAME_TARGET,
    });
  });
});
