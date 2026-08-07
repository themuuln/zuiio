/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const Icon = ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  );
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) mocked[key] = Icon;
  return mocked;
});

vi.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button type="button" data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

import type { NewsArticle } from "../../lib/data";
import { HomeLatestNews } from "../home-latest-news";

const mockArticles = [
  {
    id: "news-1",
    title: "Улирлын нээлтийн тоглолт амжилттай боллоо",
    excerpt: "Хүрээлэн буй орчны товч агуулга",
    body: "",
    cover_image_url: null,
    published_at: "2026-08-05T10:00:00Z",
    created_at: "2026-08-05T09:00:00Z",
  },
  {
    id: "news-2",
    title: "Залуучуудын лиг эхэллээ",
    excerpt: null,
    body: "",
    cover_image_url: null,
    published_at: "2026-08-01T10:00:00Z",
    created_at: "2026-08-01T09:00:00Z",
  },
] as unknown as NewsArticle[];

describe("HomeLatestNews", () => {
  it("renders section heading and article titles", () => {
    render(<HomeLatestNews articles={mockArticles} />);
    expect(screen.getByText("Сүүлийн мэдээ")).toBeInTheDocument();
    expect(
      screen.getByText("Улирлын нээлтийн тоглолт амжилттай боллоо"),
    ).toBeInTheDocument();
    expect(screen.getByText("Залуучуудын лиг эхэллээ")).toBeInTheDocument();
  });

  it("links each article to its detail page", () => {
    render(<HomeLatestNews articles={mockArticles} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/news/news-1")).toBe(
      true,
    );
    expect(links.some((l) => l.getAttribute("href") === "/news/news-2")).toBe(
      true,
    );
  });

  it("links the header action to the news archive", () => {
    render(<HomeLatestNews articles={mockArticles} />);
    const archive = screen
      .getAllByRole("link")
      .find((l) => l.getAttribute("href") === "/news");
    expect(archive).toBeTruthy();
  });

  it("shows excerpt when present and omits it when absent", () => {
    render(<HomeLatestNews articles={mockArticles} />);
    expect(
      screen.getByText("Хүрээлэн буй орчны товч агуулга"),
    ).toBeInTheDocument();
  });
});
