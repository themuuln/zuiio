import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StorefrontBaseProvider } from "@/components/storefront/storefront-base-provider";
import { BlogClient } from "./blog-client";
import type { PublicBlogPost } from "./page";

vi.mock("@/components/ui/optimized-image", () => ({
  OptimizedImage: () => <div data-testid="opt-img" />,
}));

function makePosts(count: number): PublicBlogPost[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i + 1}`,
    title: `Нийтлэл ${i + 1}`,
    slug: `post-${i + 1}`,
    excerpt: `Товч агуулга ${i + 1}`,
    cover_image_url: null,
    published_at: "2026-08-01T12:00:00Z",
  }));
}

function renderBlog(ui: React.ReactElement) {
  return render(
    <StorefrontBaseProvider basePath="/storefront-e2e-test">
      {ui}
    </StorefrontBaseProvider>,
  );
}

describe("BlogClient", () => {
  it("shows the empty state when there are no posts", () => {
    renderBlog(<BlogClient posts={[]} />);
    expect(screen.getByText("Одоогоор нийтлэл байхгүй.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("paginates 8 posts per page", () => {
    renderBlog(<BlogClient posts={makePosts(10)} />);

    // Page 1: posts 1–8, counter shows range + total
    expect(screen.getByText("Нийтлэл 1")).toBeInTheDocument();
    expect(screen.getByText("Нийтлэл 8")).toBeInTheDocument();
    expect(screen.queryByText("Нийтлэл 9")).toBeNull();
    expect(screen.getByText("1 – 8 / 10")).toBeInTheDocument();
    // Prev is disabled on the first page
    expect(screen.getByRole("button", { name: /Өмнөх/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Дараах/ }));

    // Page 2: posts 9–10
    expect(screen.getByText("Нийтлэл 9")).toBeInTheDocument();
    expect(screen.getByText("Нийтлэл 10")).toBeInTheDocument();
    expect(screen.queryByText("Нийтлэл 1")).toBeNull();
    expect(screen.getByText("9 – 10 / 10")).toBeInTheDocument();
    // Next is disabled on the last page
    expect(screen.getByRole("button", { name: /Дараах/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Өмнөх/ }));
    expect(screen.getByText("1 – 8 / 10")).toBeInTheDocument();
  });

  it("renders exactly 8 posts when the total is a multiple of 8", () => {
    renderBlog(<BlogClient posts={makePosts(16)} />);
    expect(screen.getByText("1 – 8 / 16")).toBeInTheDocument();
  });

  it("links each post to its public detail page", () => {
    renderBlog(<BlogClient posts={makePosts(2)} />);
    const link = screen.getByRole("link", { name: /Нийтлэл 1/ });
    expect(link).toHaveAttribute("href", "/storefront-e2e-test/blog/post-1");
    // Published date is formatted and rendered for each post
    expect(screen.getAllByText("2026-08-01")).toHaveLength(2);
  });

  it("clamps the page counter when posts is empty of extras (1 post)", () => {
    renderBlog(<BlogClient posts={makePosts(1)} />);
    expect(screen.getByText("1 – 1 / 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Дараах/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Өмнөх/ })).toBeDisabled();
  });
});
