import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PosProduct } from "@/lib/pos";
import { type PosCategory, PosProductGrid } from "./pos-product-grid";

// Avoid the product image component's IntersectionObserver + Supabase URLs.
vi.mock("@/components/ui/optimized-image", () => ({
  OptimizedImage: ({ alt }: { alt?: string }) => (
    <span data-testid="opt-img">{alt}</span>
  ),
}));

const product = (overrides: Partial<PosProduct> = {}): PosProduct => ({
  id: "p1",
  name: "Талх",
  sale_price: 5000,
  current_stock: 10,
  unit: "ш",
  barcode: "1234567890",
  sku: "SKU-1",
  categoryId: null,
  image_url: null,
  has_variants: false,
  ...overrides,
});

const categories: PosCategory[] = [{ id: "c1", name: "Хүнс" }];

function renderGrid(
  products: PosProduct[] = [product()],
  onAdd = vi.fn(),
  onOpenVariants = vi.fn(),
) {
  return render(
    <PosProductGrid
      products={products}
      categories={categories}
      onAdd={onAdd}
      onOpenVariants={onOpenVariants}
    />,
  );
}

describe("PosProductGrid", () => {
  it("renders product tiles with price and stock badge", () => {
    renderGrid([
      product(),
      product({
        id: "p2",
        name: "Сүү",
        sale_price: 6000,
        current_stock: 5,
      }),
    ]);
    expect(screen.getByText("Талх")).toBeInTheDocument();
    expect(screen.getByText("Сүү")).toBeInTheDocument();
    expect(screen.getByText("₮ 5,000")).toBeInTheDocument();
    expect(screen.getByText("Нөөц: 10")).toBeInTheDocument();
    expect(screen.getByText("Нөөц: 5")).toBeInTheDocument();
  });

  it("disables out-of-stock tiles and marks them Дууссан", () => {
    const onAdd = vi.fn();
    renderGrid([product({ current_stock: 0 })], onAdd);
    const tile = screen.getByRole("button", { name: /Талх/ });
    expect(tile).toBeDisabled();
    expect(screen.getByText("Дууссан")).toBeInTheDocument();
    fireEvent.click(tile);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("taps a tile to add the product", () => {
    const onAdd = vi.fn();
    renderGrid([product()], onAdd);
    fireEvent.click(screen.getByRole("button", { name: /Талх/ }));
    expect(onAdd).toHaveBeenCalledWith(product());
  });

  it("opens the variant dialog for variant products", () => {
    const onOpenVariants = vi.fn();
    const variantProduct = product({
      id: "pv",
      name: "Цамц",
      has_variants: true,
    });
    renderGrid([variantProduct], vi.fn(), onOpenVariants);
    fireEvent.click(screen.getByRole("button", { name: /Цамц/ }));
    expect(onOpenVariants).toHaveBeenCalledWith(variantProduct);
  });

  it("filters by name, barcode and sku", () => {
    renderGrid([
      product(),
      product({ id: "p2", name: "Сүү", barcode: "987654", sku: "SKU-2" }),
    ]);
    const search = screen.getByRole("textbox", { name: "Бүтээгдэхүүн хайх" });

    fireEvent.change(search, { target: { value: "сүү" } });
    expect(screen.queryByText("Талх")).not.toBeInTheDocument();
    expect(screen.getByText("Сүү")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "987654" } });
    expect(screen.getByText("Сүү")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "SKU-1" } });
    expect(screen.getByText("Талх")).toBeInTheDocument();
    expect(screen.queryByText("Сүү")).not.toBeInTheDocument();
  });

  it("filters by category chip", () => {
    renderGrid([
      product(),
      product({ id: "p2", name: "Сүү", categoryId: "c1" }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Хүнс" }));
    expect(screen.queryByText("Талх")).not.toBeInTheDocument();
    expect(screen.getByText("Сүү")).toBeInTheDocument();
  });

  it("taps the first match on Enter", () => {
    const onAdd = vi.fn();
    renderGrid([product()], onAdd);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Бүтээгдэхүүн хайх" }),
      { target: { value: "талх" } },
    );
    fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Бүтээгдэхүүн хайх" }),
      {
        key: "Enter",
      },
    );
    expect(onAdd).toHaveBeenCalledWith(product());
  });

  it("shows the empty state when nothing matches", () => {
    renderGrid([product()]);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Бүтээгдэхүүн хайх" }),
      { target: { value: "zzz" } },
    );
    expect(screen.getByText("Бүтээгдэхүүн олдсонгүй")).toBeInTheDocument();
  });
});
