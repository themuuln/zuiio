import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { StorefrontPage } from "../storefront-page";

// Breadcrumb renders next-intl Link — mock it so next-intl's navigation
// (which fails to resolve `next/navigation` under vitest + Next 16) never loads.
vi.mock("@/lib/i18n/navigation", () => ({
  Link: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} />
  ),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/a11y/useAltText: mock keeps the same contract as next/image
    // biome-ignore lint/performance/noImgElement: test double for next/image
    <img {...props} />
  ),
}));

const org = {
  id: "org-1",
  name: "Acme Auto",
  slug: "acme",
  logo_url: null,
};

const brands = [
  { make: "Toyota", model_count: 2 },
  { make: "Honda", model_count: 1 },
];

const models = [
  {
    id: "vm-1",
    make: "Toyota",
    model: "Prius",
    generation: "XW30",
    year_start: 2010,
    year_end: 2015,
    part_count: 6,
  },
  {
    id: "vm-2",
    make: "Toyota",
    model: "Corolla",
    generation: null,
    year_start: 2014,
    year_end: null,
    part_count: 1,
  },
  {
    id: "vm-3",
    make: "Honda",
    model: "Fit",
    generation: null,
    year_start: null,
    year_end: null,
    part_count: 3,
  },
];

type PartFixture = {
  id: string;
  name: string;
  name_mn: string | null;
  part_number: string | null;
  category: string | null;
  price: number | null;
  in_stock: boolean;
  image_url: string | null;
  vehicle_model_id: string;
};

function makePart(overrides: Partial<PartFixture> = {}): PartFixture {
  return {
    id: "p-1",
    name: "Oil filter",
    name_mn: null,
    part_number: "OF-1",
    category: "Filter",
    price: 15000,
    in_stock: true,
    image_url: null,
    vehicle_model_id: "vm-1",
    ...overrides,
  };
}

const parts: PartFixture[] = [
  makePart(),
  makePart({
    id: "p-2",
    name: "Brake pads",
    category: "Brakes",
    price: 20000,
    in_stock: false,
  }),
  makePart({ id: "p-3", name: "Air filter", category: "Filter", price: 12000 }),
  makePart({ id: "p-4", name: "Oil", category: "Fluids", price: 9000 }),
  makePart({ id: "p-5", name: "Filter fuel", category: "Filter", price: 8000 }),
  makePart({ id: "p-6", name: "Wiper", category: "Wipers", price: 5000 }),
];

function renderStorefront(
  overrides: Partial<Parameters<typeof StorefrontPage>[0]> = {},
) {
  render(
    <StorefrontPage
      org={org}
      brands={brands}
      models={models}
      parts={parts}
      {...overrides}
    />,
  );
}

describe("StorefrontPage", () => {
  it("renders the brand grid with org name and model counts", () => {
    renderStorefront();

    expect(screen.getByRole("heading", { name: "Acme Auto" })).toBeTruthy();
    expect(screen.getByText("Browse by Vehicle")).toBeTruthy();
    expect(screen.getByText("Toyota")).toBeTruthy();
    expect(screen.getByText("2 models")).toBeTruthy();
    expect(screen.getByText("1 model")).toBeTruthy();
  });

  it("navigates from a brand to its models", () => {
    renderStorefront();

    fireEvent.click(screen.getByText("Toyota"));

    expect(screen.getByText("Toyota Models")).toBeTruthy();
    // Model cards render "make model" in one text node
    expect(screen.getByText(/Prius/)).toBeTruthy();
    expect(screen.getByText(/Corolla/)).toBeTruthy();
    // Honda models are filtered out
    expect(screen.queryByText(/Fit/)).not.toBeInTheDocument();
    // Generation + year range on model cards
    expect(screen.getByText("XW30")).toBeTruthy();
    expect(screen.getByText("2010–2015")).toBeTruthy();
  });

  it("shows the parts table with stock badges and prices", () => {
    renderStorefront();

    fireEvent.click(screen.getByText("Toyota"));
    fireEvent.click(screen.getByText(/Prius/));

    expect(screen.getByText("Toyota Prius")).toBeTruthy();
    expect(screen.getByText("6 parts available")).toBeTruthy();
    expect(screen.getByText("Oil filter")).toBeTruthy();
    expect(screen.getAllByText("In Stock").length).toBeGreaterThan(0);
    expect(screen.getByText("Out of Stock")).toBeTruthy();
    expect(screen.getByText(/15,000/)).toBeTruthy();
    expect(screen.getByText(/20,000/)).toBeTruthy();
  });

  it("filters parts by category chips", () => {
    renderStorefront();

    fireEvent.click(screen.getByText("Toyota"));
    fireEvent.click(screen.getByText(/Prius/));
    fireEvent.click(screen.getByRole("button", { name: "Brakes" }));

    expect(screen.getByText("Brake pads")).toBeTruthy();
    expect(screen.queryByText("Oil filter")).not.toBeInTheDocument();
  });

  it("searches parts by name and clears filters", () => {
    renderStorefront();

    fireEvent.click(screen.getByText("Toyota"));
    fireEvent.click(screen.getByText(/Prius/));

    fireEvent.change(screen.getByPlaceholderText("Search parts..."), {
      target: { value: "oil" },
    });
    expect(screen.getByText("Oil filter")).toBeTruthy();
    expect(screen.queryByText("Wiper")).not.toBeInTheDocument();

    // No-match state with a clear-filters action
    fireEvent.change(screen.getByPlaceholderText("Search parts..."), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No parts match your filters.")).toBeTruthy();
    fireEvent.click(screen.getByText("Clear filters"));
    expect(screen.getByText("Wiper")).toBeTruthy();
  });

  it("shows the empty state when there are no brands", () => {
    renderStorefront({ brands: [] });

    expect(screen.getByText("No parts available yet.")).toBeTruthy();
  });

  it("shows no-parts-message when a model has no parts", () => {
    renderStorefront({ parts: [] });

    fireEvent.click(screen.getByText("Toyota"));
    fireEvent.click(screen.getByText(/Prius/));

    expect(screen.getByText("No parts available for this model.")).toBeTruthy();
  });

  it("renders a logo image when the org has one", () => {
    renderStorefront({ org: { ...org, logo_url: "/logo.png" } });

    expect(document.querySelector("img")).toHaveAttribute("src", "/logo.png");
  });
});
