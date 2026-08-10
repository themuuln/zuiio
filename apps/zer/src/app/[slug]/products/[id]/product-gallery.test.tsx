import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductGallery } from "./product-gallery";

// OptimizedImage is an IntersectionObserver-based lazy loader — stub it to a
// plain <img> so we can assert the gallery's switch logic without a browser.
vi.mock("@/components/ui/optimized-image", () => ({
  OptimizedImage: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // biome-ignore lint/performance/noImgElement: test stub
    <img src={src} alt={alt} className={className} />
  ),
}));

const IMAGES = ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"];

describe("ProductGallery", () => {
  it("renders the first image as the main image", () => {
    render(<ProductGallery images={IMAGES} alt="Цамц" />);
    expect(screen.getByAltText("Цамц")).toHaveAttribute(
      "src",
      "https://cdn.test/a.jpg",
    );
  });

  it("clicking a thumbnail switches the main image", () => {
    render(<ProductGallery images={IMAGES} alt="Цамц" />);
    fireEvent.click(screen.getByRole("button", { name: "Зураг 2" }));
    expect(screen.getByAltText("Цамц")).toHaveAttribute(
      "src",
      "https://cdn.test/b.jpg",
    );
    expect(screen.getByRole("button", { name: "Зураг 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not render thumbnails for a single image", () => {
    render(<ProductGallery images={[IMAGES[0]]} alt="Цамц" />);
    expect(screen.queryByRole("button", { name: /Зураг/ })).toBeNull();
  });
});
