import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_BRAND_CONFIG } from "@/lib/branding";
import { BrandingForm } from "./branding-form";

const mockUpdateBrandConfig = vi.hoisted(() => vi.fn());

vi.mock("./actions", () => ({
  updateBrandConfig: (...args: unknown[]) => mockUpdateBrandConfig(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderForm(initialConfig = DEFAULT_BRAND_CONFIG) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrandingForm initialConfig={initialConfig} />
    </QueryClientProvider>,
  );
}

describe("BrandingForm — shadcn-style theme editor", () => {
  beforeEach(() => {
    mockUpdateBrandConfig.mockResolvedValue({ success: true });
  });

  it("shows every base color as a selectable swatch", () => {
    renderForm();

    // Zuiio default is selected; clicking another base color switches it.
    const blueSwatch = screen.getByRole("button", { name: /Цэнхэр/ });
    expect(blueSwatch).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(blueSwatch);
    expect(blueSwatch).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Zuiio/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("selects a radius preset and keeps non-preset values visible", () => {
    renderForm({ ...DEFAULT_BRAND_CONFIG, radius: 0.8 });

    // 0.8 is not a preset — show a hint instead of a false selection.
    expect(screen.getByText(/Одоогийн хэмжээ: 0\.800rem/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /0\.75/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: /0\.75/ }));
    expect(screen.getByRole("button", { name: /0\.75/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText(/Одоогийн хэмжээ/)).not.toBeInTheDocument();
  });

  it("renders the storefront live preview with theme colors", () => {
    renderForm();

    expect(screen.getByText("Таны дэлгүүр")).toBeInTheDocument();
    expect(screen.getByText("Бүтээгдэхүүн 1")).toBeInTheDocument();
    expect(screen.getAllByText("Дэлгэрэнгүй")).toHaveLength(2);
  });
});
