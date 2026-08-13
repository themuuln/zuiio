/**
 * Custom-domain server actions: TXT ownership verification with automatic
 * Vercel attachment, the DNS-pointing check, and domain change handling in
 * updatePublicProfile.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  mockCapture,
  mockWithDbCapture,
  mockRequireActionContext,
  mockResolveTxt,
  mockResolve4,
  mockResolveCname,
  mockAttach,
  mockGetStatus,
  mockDetach,
} = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockWithDbCapture: vi.fn(
    (
      _label: string,
      query: { then: (r: (v: unknown) => unknown) => unknown },
    ) => query.then((v: unknown) => v),
  ),
  mockRequireActionContext: vi.fn(),
  mockResolveTxt: vi.fn(),
  mockResolve4: vi.fn(),
  mockResolveCname: vi.fn(),
  mockAttach: vi.fn(),
  mockGetStatus: vi.fn(),
  mockDetach: vi.fn(),
}));

vi.mock("@zuiio/capture", () => ({
  capture: mockCapture,
  withDbCapture: mockWithDbCapture,
}));

vi.mock("@/lib/action-utils", () => ({
  requireActionContext: mockRequireActionContext,
}));

vi.mock("@/lib/revalidate", () => ({
  revalidateEntity: vi.fn(),
  revalidateEntityTag: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  default: {
    resolveTxt: mockResolveTxt,
    resolve4: mockResolve4,
    resolveCname: mockResolveCname,
  },
  resolveTxt: mockResolveTxt,
  resolve4: mockResolve4,
  resolveCname: mockResolveCname,
}));

vi.mock("@/lib/vercel-domains", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/vercel-domains")>();
  return {
    ...actual,
    attachDomainToVercel: mockAttach,
    getVercelDomainStatus: mockGetStatus,
    detachDomainFromVercel: mockDetach,
  };
});

import {
  checkAdminDomainDns,
  checkCustomDomainDns,
  updatePublicProfile,
  verifyAdminDomain,
  verifyCustomDomain,
} from "@/app/(dashboard)/settings/organization/actions";

const ORG_ID = "5a60b8f8-0daf-47df-8a10-c172c60e16bd";
const EXPECTED_TOKEN = "216ddbaae4ad";

/** Chainable supabase mock: each `from(table)` call resolves the next
 * scripted result for that table, in order. */
function supabaseMock(
  scriptByTable: Record<string, Array<{ data?: unknown; error?: unknown }>>,
) {
  const cursors: Record<string, number> = {};
  const supabase = {
    from: vi.fn((table: string) => {
      const chain = {
        // biome-ignore lint/suspicious/noThenProperty: supabase chains are awaitable; the mock must be too
        then: (resolve: (v: unknown) => unknown) => {
          const script = scriptByTable[table] ?? [];
          const next = script[cursors[table] ?? 0] ?? {
            data: null,
            error: null,
          };
          cursors[table] = (cursors[table] ?? 0) + 1;
          return Promise.resolve(next).then(resolve);
        },
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn(() => chain),
        update: vi.fn(() => chain),
        upsert: vi.fn(() => chain),
        onConflict: vi.fn(() => chain),
      };
      return chain;
    }),
  };
  return supabase;
}

function authedCtx(supabase: ReturnType<typeof supabaseMock>) {
  return { organizationId: ORG_ID, userId: "user-1", supabase };
}

function profileFormData(customDomain?: string): FormData {
  const fd = new FormData();
  if (customDomain !== undefined) fd.set("custom_domain", customDomain);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireActionContext.mockResolvedValue(authedCtx(supabaseMock({})));
});

afterEach(() => {
  vi.resetModules();
});

describe("verifyCustomDomain", () => {
  it("marks verified and attaches the domain to Vercel on TXT match", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: { custom_domain: "shop.example.mn", domain_verified: false },
          error: null,
        },
        { data: null, error: null },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolveTxt.mockResolvedValue([[`zer-verify=${EXPECTED_TOKEN}`]]);
    mockAttach.mockResolvedValue({
      configured: true,
      attached: true,
      alreadyPresent: false,
    });

    const result = await verifyCustomDomain(undefined, new FormData());

    expect(result).toMatchObject({
      success: true,
      verified: true,
      token: EXPECTED_TOKEN,
      vercelAttached: true,
      dnsRecord: { type: "CNAME", name: "shop", value: "cname.vercel-dns.com" },
    });
    expect(mockAttach).toHaveBeenCalledWith("shop.example.mn");
  });

  it("reports the token and skips the update when TXT does not match", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: { custom_domain: "shop.example.mn", domain_verified: false },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolveTxt.mockResolvedValue([["something-else"]]);

    const result = await verifyCustomDomain(undefined, new FormData());

    expect(result.success).toBeUndefined();
    expect(result.error).toContain(EXPECTED_TOKEN);
    expect(result.token).toBe(EXPECTED_TOKEN);
    expect(mockAttach).not.toHaveBeenCalled();
  });

  it("errors when no domain is saved", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        { data: { custom_domain: null, domain_verified: false }, error: null },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const result = await verifyCustomDomain(undefined, new FormData());
    expect(result.error).toContain("домэйн");
  });
});

describe("checkCustomDomainDns", () => {
  it("reports live when the A record points at Vercel and Vercel verifies", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: { custom_domain: "bujin.mn", domain_verified: true },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolve4.mockResolvedValue(["76.76.21.21"]);
    mockResolveCname.mockRejectedValue(new Error("no CNAME"));
    mockGetStatus.mockResolvedValue({
      configured: true,
      present: true,
      verified: true,
    });

    const result = await checkCustomDomainDns(undefined, new FormData());

    expect(result).toMatchObject({
      success: true,
      pointing: true,
      live: true,
      vercelVerified: true,
      expected: "76.76.21.21",
    });
  });

  it("reports not pointing when records do not match", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: { custom_domain: "shop.example.mn", domain_verified: true },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolve4.mockResolvedValue(["203.0.113.10"]);
    mockResolveCname.mockRejectedValue(new Error("no CNAME"));
    mockGetStatus.mockResolvedValue({
      configured: true,
      present: true,
      verified: true,
    });

    const result = await checkCustomDomainDns(undefined, new FormData());
    expect(result).toMatchObject({ pointing: false, live: false });
  });

  it("accepts a CNAME target for subdomains", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: { custom_domain: "shop.example.mn", domain_verified: true },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolve4.mockRejectedValue(new Error("no A"));
    mockResolveCname.mockResolvedValue(["cname.vercel-dns.com"]);
    mockGetStatus.mockResolvedValue({
      configured: true,
      present: true,
      verified: true,
    });

    const result = await checkCustomDomainDns(undefined, new FormData());
    expect(result).toMatchObject({ pointing: true, live: true });
  });

  it("warns when the domain is not on the Vercel project", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: { custom_domain: "bujin.mn", domain_verified: true },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolve4.mockResolvedValue(["76.76.21.21"]);
    mockResolveCname.mockRejectedValue(new Error("no CNAME"));
    mockGetStatus.mockResolvedValue({
      configured: true,
      present: false,
      verified: false,
    });

    const result = await checkCustomDomainDns(undefined, new FormData());
    expect(result.error).toContain("Vercel");
  });
});

describe("updatePublicProfile", () => {
  it("rejects an invalid domain format before saving", async () => {
    const supabase = supabaseMock({});
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const result = await updatePublicProfile(
      undefined,
      profileFormData("https://shop.example.mn/path"),
    );

    expect(result.error).toContain("формат");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("detaches the old verified domain when the domain changes", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            custom_domain: "old.example.mn",
            domain_verified: true,
          },
          error: null,
        },
        { data: null, error: null },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const result = await updatePublicProfile(
      undefined,
      profileFormData("new.example.mn"),
    );

    expect(result.success).toBe(true);
    expect(mockDetach).toHaveBeenCalledWith("old.example.mn");
  });

  it("keeps verification when the domain is unchanged", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            custom_domain: "bujin.mn",
            domain_verified: true,
          },
          error: null,
        },
        { data: null, error: null },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    await updatePublicProfile(undefined, profileFormData("bujin.mn"));

    // from() call 0 = fetch existing profile, call 1 = the upsert.
    const upsertChain = supabase.from.mock.results[1]?.value as
      | { upsert?: { mock: { calls: Array<[unknown]> } } }
      | undefined;
    const payload = upsertChain?.upsert?.mock?.calls[0]?.[0] ?? null;
    expect(payload).toMatchObject({
      custom_domain: "bujin.mn",
      domain_verified: true,
    });
    expect(mockDetach).not.toHaveBeenCalled();
  });

  it("detaches the old verified admin domain when the admin domain changes", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            custom_domain: null,
            domain_verified: false,
            admin_domain: "old-erp.example.mn",
            admin_domain_verified: true,
          },
          error: null,
        },
        { data: null, error: null },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const fd = new FormData();
    fd.set("admin_domain", "new-erp.example.mn");
    const result = await updatePublicProfile(undefined, fd);

    expect(result.success).toBe(true);
    expect(mockDetach).toHaveBeenCalledWith("old-erp.example.mn");
  });

  it("keeps admin domain verification when the admin domain is unchanged", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            custom_domain: null,
            domain_verified: false,
            admin_domain: "erp.example.mn",
            admin_domain_verified: true,
          },
          error: null,
        },
        { data: null, error: null },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const fd = new FormData();
    fd.set("admin_domain", "erp.example.mn");
    await updatePublicProfile(undefined, fd);

    const upsertChain = supabase.from.mock.results[1]?.value as
      | { upsert?: { mock: { calls: Array<[unknown]> } } }
      | undefined;
    const payload = upsertChain?.upsert?.mock?.calls[0]?.[0] ?? null;
    expect(payload).toMatchObject({
      admin_domain: "erp.example.mn",
      admin_domain_verified: true,
    });
    expect(mockDetach).not.toHaveBeenCalled();
  });
});

describe("verifyAdminDomain", () => {
  it("marks admin_domain verified and attaches the domain to Vercel on TXT match", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            admin_domain: "erp.example.mn",
            admin_domain_verified: false,
          },
          error: null,
        },
        { data: null, error: null },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolveTxt.mockResolvedValue([[`zer-verify=${EXPECTED_TOKEN}`]]);
    mockAttach.mockResolvedValue({
      configured: true,
      attached: true,
      alreadyPresent: false,
    });

    const result = await verifyAdminDomain(undefined, new FormData());

    expect(result).toMatchObject({
      success: true,
      verified: true,
      token: EXPECTED_TOKEN,
      vercelAttached: true,
      dnsRecord: { type: "CNAME", name: "erp", value: "cname.vercel-dns.com" },
    });
    expect(mockAttach).toHaveBeenCalledWith("erp.example.mn");

    // The verified flag lands on admin_domain_verified, not domain_verified.
    const updateCall = (
      supabase.from.mock.results[1]?.value as
        | { update?: { mock: { calls: Array<[unknown]> } } }
        | undefined
    )?.update?.mock?.calls[0]?.[0];
    expect(updateCall).toMatchObject({ admin_domain_verified: true });
  });

  it("reports the token and skips the update when TXT does not match", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            admin_domain: "erp.example.mn",
            admin_domain_verified: false,
          },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolveTxt.mockResolvedValue([["something-else"]]);

    const result = await verifyAdminDomain(undefined, new FormData());

    expect(result.success).toBeUndefined();
    expect(result.error).toContain(EXPECTED_TOKEN);
    expect(result.token).toBe(EXPECTED_TOKEN);
    expect(mockAttach).not.toHaveBeenCalled();
  });

  it("errors when no admin domain is saved", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            admin_domain: null,
            admin_domain_verified: false,
          },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));

    const result = await verifyAdminDomain(undefined, new FormData());
    expect(result.error).toContain("домэйн");
  });
});

describe("checkAdminDomainDns", () => {
  it("reports live when the admin domain CNAME points at Vercel", async () => {
    const supabase = supabaseMock({
      organization_public_profiles: [
        {
          data: {
            admin_domain: "erp.example.mn",
            admin_domain_verified: true,
          },
          error: null,
        },
      ],
    });
    mockRequireActionContext.mockResolvedValue(authedCtx(supabase));
    mockResolve4.mockRejectedValue(new Error("no A"));
    mockResolveCname.mockResolvedValue(["cname.vercel-dns.com"]);
    mockGetStatus.mockResolvedValue({
      configured: true,
      present: true,
      verified: true,
    });

    const result = await checkAdminDomainDns(undefined, new FormData());

    expect(result).toMatchObject({ pointing: true, live: true });
  });
});
