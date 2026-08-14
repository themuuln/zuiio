import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StorefrontLayout from "./layout";

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/lib/supabase/server-service", () => ({
  createServiceClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockMaybeSingle(table),
        }),
      }),
    }),
    rpc: (name: string) => mockRpc(name),
  }),
}));

async function renderLayout(slug: string): Promise<string> {
  const stream = await renderToReadableStream(
    <StorefrontLayout params={Promise.resolve({ slug })}>
      <main>content</main>
    </StorefrontLayout>,
  );
  const reader = stream.getReader();
  const chunks: string[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(new TextDecoder().decode(value));
  }
  return chunks.join("");
}

describe("StorefrontLayout", () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset();
    mockRpc.mockReset();
    // Header categories are fetched via the cached shell (RPC) — default to
    // an empty list so the org-missing path never depends on it.
    mockRpc.mockResolvedValue({ data: [], error: null });
  });

  it("renders children when the org is missing", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const html = await renderLayout("missing-shop");

    expect(html).toContain("content");
  });

  it("queries brand_config for the org through the cached shell", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await renderLayout("test-shop");

    // Shell query 1: organizations row (includes brand_config).
    expect(mockMaybeSingle).toHaveBeenCalledWith("organizations");
  });

  it("queries the public profile once the org resolves", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: {
          id: "org-1",
          name: "Test Shop",
          slug: "test-shop",
          currency: "MNT",
          company_type: "retail",
          brand_config: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          organization_id: "org-1",
          catalog_enabled: true,
          display_name: null,
          ga_measurement_id: null,
          meta_pixel_id: null,
        },
        error: null,
      });

    await renderLayout("test-shop");

    // Shell query 2: profile row for the resolved org id.
    expect(mockMaybeSingle).toHaveBeenCalledWith(
      "organization_public_profiles",
    );
  });

  it("injects the org brand theme into the page", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: {
          id: "org-1",
          name: "Test Shop",
          slug: "test-shop",
          currency: "MNT",
          company_type: "retail",
          brand_config: {
            theme: "blue",
            radius: 0.75,
            custom_colors: { primary: "#123456" },
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          organization_id: "org-1",
          catalog_enabled: true,
          display_name: "Test Shop",
          ga_measurement_id: null,
          meta_pixel_id: null,
        },
        error: null,
      });

    const html = await renderLayout("test-shop");

    expect(html).toContain('id="brand-theme"');
    expect(html).toContain("--primary: #123456;");
    expect(html).toContain("--radius: 0.75rem;");
  });

  it("falls back to the org name when the profile has no display name", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: {
          id: "org-1",
          name: "Test Shop",
          slug: "test-shop",
          currency: "MNT",
          company_type: "retail",
          brand_config: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          organization_id: "org-1",
          catalog_enabled: true,
          display_name: null,
          ga_measurement_id: null,
          meta_pixel_id: null,
        },
        error: null,
      });

    const html = await renderLayout("test-shop");

    expect(html).toContain("Test Shop");
  });
});
