import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCacheTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: mockCacheTag,
}));

const mockGetPublicCategories = vi.hoisted(() => vi.fn());
const mockGetPublicCatalog = vi.hoisted(() => vi.fn());
const mockGetPublicBranches = vi.hoisted(() => vi.fn());
vi.mock("@/lib/public-catalog", () => ({
  getPublicCategories: (...a: unknown[]) => mockGetPublicCategories(...a),
  getPublicCatalog: (...a: unknown[]) => mockGetPublicCatalog(...a),
  getPublicBranches: (...a: unknown[]) => mockGetPublicBranches(...a),
  getPublicProduct: vi.fn(),
  getPublicPromotions: vi.fn(),
  getPublicReviews: vi.fn(),
  getPublicBlogPosts: vi.fn(),
}));

// Chainable supabase stub: `from(table)` keys on the table name, `rpc(name)`
// keys on the RPC name. Mirrors the server-service shape the module uses.
const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockMaybeSingle(table),
        }),
      }),
    }),
    rpc: (name: string, args: unknown) => mockRpc(name, args),
  }),
}));

import {
  getPublicBlogPostsCached,
  getPublicBranchesCached,
  getPublicCatalogCached,
  getStorefrontShell,
} from "./storefront-cache";

const ORG_ROW = {
  id: "org-1",
  name: "Test Shop",
  slug: "test-shop",
  currency: "MNT",
  company_type: "retail",
  brand_config: null,
};

const PROFILE_ROW = {
  id: "profile-1",
  organization_id: "org-1",
  display_name: "Test Shop",
  catalog_enabled: true,
};

const CATEGORY = {
  id: "cat-1",
  name: "Хүнс",
  product_count: 3,
};

function shellSupabase() {
  mockMaybeSingle.mockReset();
  mockRpc.mockReset();
  mockGetPublicCategories.mockReset().mockResolvedValue([CATEGORY]);
  // organizations first, organization_public_profiles second.
  mockMaybeSingle
    .mockResolvedValueOnce({ data: ORG_ROW, error: null })
    .mockResolvedValueOnce({ data: PROFILE_ROW, error: null });
}

describe("getStorefrontShell", () => {
  beforeEach(() => {
    mockCacheTag.mockReset();
  });

  it("returns null when the org is missing", async () => {
    mockMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null });

    const shell = await getStorefrontShell("missing-shop");

    expect(shell).toBeNull();
    expect(mockCacheTag).not.toHaveBeenCalled();
  });

  it("bundles org, profile and categories into one shell", async () => {
    shellSupabase();

    const shell = await getStorefrontShell("test-shop");

    expect(shell).toEqual({
      org: {
        id: "org-1",
        name: "Test Shop",
        slug: "test-shop",
        currency: "MNT",
        company_type: "retail",
        brand_config: null,
      },
      profile: PROFILE_ROW,
      categories: [CATEGORY],
    });
    // Categories come from the public RPC, fetched in parallel with the
    // profile — one cache entry covers the whole shell.
    expect(mockGetPublicCategories).toHaveBeenCalledWith(
      expect.anything(),
      "test-shop",
    );
  });

  it("tags the entry with storefront:<orgId> once the org resolves", async () => {
    shellSupabase();

    await getStorefrontShell("test-shop");

    expect(mockCacheTag).toHaveBeenCalledWith("storefront:org-1");
  });
});

describe("getPublicCatalogCached", () => {
  beforeEach(() => {
    mockCacheTag.mockReset();
  });

  it("returns null when the shell has no org", async () => {
    mockMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null });

    const catalog = await getPublicCatalogCached("missing-shop");

    expect(catalog).toBeNull();
    expect(mockGetPublicCatalog).not.toHaveBeenCalled();
  });

  it("forwards options and tags products + storefront for the org", async () => {
    shellSupabase();
    const catalogResult = { organization: null, products: [], total: 0 };
    mockGetPublicCatalog.mockResolvedValue(catalogResult);

    const catalog = await getPublicCatalogCached("test-shop", {
      page: 2,
      search: "цамц",
    });

    expect(catalog).toEqual(catalogResult);
    expect(mockGetPublicCatalog).toHaveBeenCalledWith(
      expect.anything(),
      "test-shop",
      { page: 2, search: "цамц" },
    );
    expect(mockCacheTag).toHaveBeenCalledWith("products:org-1");
    expect(mockCacheTag).toHaveBeenCalledWith("storefront:org-1");
  });
});

describe("getPublicBranchesCached", () => {
  beforeEach(() => {
    mockCacheTag.mockReset();
  });

  it("returns [] for a missing org and branches for a live one", async () => {
    mockMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
    expect(await getPublicBranchesCached("missing-shop")).toEqual([]);

    shellSupabase();
    mockGetPublicBranches.mockResolvedValue([{ id: "br-1", name: "Салбар" }]);
    expect(await getPublicBranchesCached("test-shop")).toEqual([
      { id: "br-1", name: "Салбар" },
    ]);
    expect(mockCacheTag).toHaveBeenCalledWith("storefront:org-1");
  });
});

describe("getPublicBlogPostsCached", () => {
  beforeEach(() => {
    mockCacheTag.mockReset();
  });

  it("returns null when the RPC fails and [] for an empty storefront", async () => {
    shellSupabase();
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    expect(await getPublicBlogPostsCached("test-shop")).toBeNull();

    shellSupabase();
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await getPublicBlogPostsCached("test-shop")).toEqual([]);
  });

  it("tags posts with blog:<orgId>", async () => {
    shellSupabase();
    mockRpc.mockResolvedValue({ data: [{ id: "b-1" }], error: null });

    await getPublicBlogPostsCached("test-shop");

    expect(mockRpc).toHaveBeenCalledWith("get_public_blog_posts", {
      p_slug: "test-shop",
    });
    expect(mockCacheTag).toHaveBeenCalledWith("blog:org-1");
  });
});
