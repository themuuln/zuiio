import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockSupabaseClient } from "@/test/mocks/supabase";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const storefrontPropsMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock("../_components/storefront-page", () => ({
  StorefrontPage: (props: unknown) => {
    storefrontPropsMock(props);
    return <div data-testid="storefront" />;
  },
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/a11y/useAltText: test double keeps next/image contract
    // biome-ignore lint/performance/noImgElement: test double for next/image
    <img {...props} />
  ),
}));

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import StorefrontRoute from "../page";

const org = {
  id: "org-1",
  name: "Acme Auto",
  slug: "acme",
  logo_url: null,
};

const vmToyota = {
  id: "vm-1",
  make: "Toyota",
  model: "Prius",
  generation: null,
  year_start: 2010,
  year_end: 2015,
  is_active: true,
  deleted_at: null,
  organization_id: "org-1",
};

const vmHonda = {
  id: "vm-2",
  make: "Honda",
  model: "Fit",
  generation: null,
  year_start: null,
  year_end: null,
  is_active: true,
  deleted_at: null,
  organization_id: "org-1",
};

const partOilFilter = {
  id: "p-1",
  name: "Oil filter",
  name_mn: null,
  part_number: "OF-1",
  category: "Filter",
  default_price: 10000,
  is_active: true,
  deleted_at: null,
  image_url: null,
};

const partBrakePads = {
  id: "p-2",
  name: "Brake pads",
  name_mn: null,
  part_number: "BP-2",
  category: "Brakes",
  default_price: 20000,
  is_active: true,
  deleted_at: null,
  image_url: null,
};

/**
 * Drain the RSC stream so Suspense resolves and all renders complete.
 * Render errors (e.g. notFound) surface through onError + stream abort,
 * so they are captured and returned instead of rejecting the promise.
 */
async function renderRoute(slug: string): Promise<unknown[]> {
  const errors: unknown[] = [];
  const stream = await renderToReadableStream(
    <StorefrontRoute
      params={Promise.resolve({ locale: "mn", orgSlug: slug })}
    />,
    { onError: (error) => errors.push(error) },
  );
  try {
    const reader = stream.getReader();
    while (!(await reader.read()).done) {
      // drain
    }
  } catch {
    // stream may abort with the render error — already captured via onError
  }
  return errors;
}

describe("StorefrontRoute (parts catalog RSC)", () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockClient as never);
  });

  it("builds brands, models and parts with price fallback and stock", async () => {
    mockClient.__qb.resolveOnce({ data: org, error: null });
    mockClient.__qb.resolveOnce({
      data: [
        {
          vehicle_model_id: "vm-1",
          part_id: "p-1",
          specific_price: 15000,
          vehicle_models: vmToyota,
          parts_catalog: partOilFilter,
        },
        {
          vehicle_model_id: "vm-2",
          part_id: "p-2",
          specific_price: null,
          vehicle_models: vmHonda,
          parts_catalog: partBrakePads,
        },
      ],
      error: null,
    });
    mockClient.__qb.resolveOnce({
      data: [{ part_id: "p-1", quantity_on_hand: 5 }],
      error: null,
    });

    await renderRoute("acme");

    const props = storefrontPropsMock.mock.calls[0][0] as {
      org: typeof org;
      brands: Array<{ make: string; model_count: number }>;
      models: Array<{ id: string; part_count: number }>;
      parts: Array<{
        id: string;
        price: number | null;
        in_stock: boolean;
        vehicle_model_id: string;
      }>;
    };

    expect(props.org).toEqual(org);
    // Brands sorted by make; Toyota gets 1 model (Honda 1).
    expect(props.brands).toEqual([
      { make: "Honda", model_count: 1 },
      { make: "Toyota", model_count: 1 },
    ]);
    expect(props.models).toHaveLength(2);
    expect(props.models.every((m) => m.part_count === 1)).toBe(true);
    // specific_price overrides default_price; missing balance = out of stock
    expect(props.parts).toEqual([
      expect.objectContaining({
        id: "p-1",
        price: 15000,
        in_stock: true,
        vehicle_model_id: "vm-1",
      }),
      expect.objectContaining({
        id: "p-2",
        price: 20000,
        in_stock: false,
        vehicle_model_id: "vm-2",
      }),
    ]);
  });

  it("filters inactive and soft-deleted vehicle models and parts", async () => {
    mockClient.__qb.resolveOnce({ data: org, error: null });
    mockClient.__qb.resolveOnce({
      data: [
        {
          vehicle_model_id: "vm-1",
          part_id: "p-1",
          specific_price: null,
          vehicle_models: { ...vmToyota, is_active: false },
          parts_catalog: partOilFilter,
        },
        {
          vehicle_model_id: "vm-2",
          part_id: "p-2",
          specific_price: null,
          vehicle_models: vmHonda,
          parts_catalog: { ...partBrakePads, deleted_at: "2026-01-01" },
        },
      ],
      error: null,
    });

    await renderRoute("acme");

    const props = storefrontPropsMock.mock.calls[0][0] as {
      brands: unknown[];
      models: unknown[];
      parts: unknown[];
    };
    expect(props.brands).toEqual([]);
    expect(props.models).toEqual([]);
    expect(props.parts).toEqual([]);
  });

  it("calls notFound when the org does not exist", async () => {
    mockClient.__qb.resolveOnce({ data: null, error: { message: "nope" } });

    const errors = await renderRoute("missing");
    expect(
      errors.some((e) => e instanceof Error && e.message === "NEXT_NOT_FOUND"),
    ).toBe(true);
    expect(storefrontPropsMock).not.toHaveBeenCalled();
  });

  it("renders an empty catalog for an org with no parts", async () => {
    mockClient.__qb.resolveOnce({ data: org, error: null });
    mockClient.__qb.resolveOnce({ data: [], error: null });

    await renderRoute("acme");

    const props = storefrontPropsMock.mock.calls[0][0] as {
      brands: unknown[];
      models: unknown[];
      parts: unknown[];
    };
    expect(props).toEqual({
      org,
      brands: [],
      models: [],
      parts: [],
    });
  });
});
