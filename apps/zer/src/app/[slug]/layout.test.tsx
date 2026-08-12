import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StorefrontLayout from "./layout";

const mockSelect = vi.hoisted(() => vi.fn());
const mockMaybeSingle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (fields: string) => {
        mockSelect(table, fields);
        return { eq: () => ({ maybeSingle: mockMaybeSingle }) };
      },
    }),
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
    mockSelect.mockReset();
    mockMaybeSingle.mockReset();
  });

  it("renders children when the org is missing", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const html = await renderLayout("missing-shop");

    expect(html).toContain("content");
  });

  it("queries brand_config for the org", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await renderLayout("test-shop");

    expect(mockSelect).toHaveBeenCalledWith(
      "organizations",
      expect.stringContaining("brand_config"),
    );
  });

  it("injects the org brand theme into the page", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: {
          id: "org-1",
          name: "Test Shop",
          brand_config: {
            theme: "blue",
            radius: 0.75,
            custom_colors: { primary: "#123456" },
          },
          public_profile: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const html = await renderLayout("test-shop");

    expect(html).toContain('id="brand-theme"');
    expect(html).toContain("--primary: #123456;");
    expect(html).toContain("--radius: 0.75rem;");
  });
});
