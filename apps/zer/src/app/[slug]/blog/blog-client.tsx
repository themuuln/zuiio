"use client";

import { Article, CaretLeft, CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatDate } from "@/lib/format";
import type { PublicBlogPost } from "./page";

const PAGE_SIZE = 8;

export function BlogClient({
  slug,
  posts,
}: {
  slug: string;
  posts: PublicBlogPost[];
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visiblePosts = posts.slice(startIndex, startIndex + PAGE_SIZE);
  const endIndex = Math.min(startIndex + PAGE_SIZE, posts.length);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-10 text-center text-sm text-muted-foreground">
        Одоогоор нийтлэл байхгүй.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {visiblePosts.map((post) => (
          <Link
            key={post.id}
            href={`/${slug}/blog/${post.slug}`}
            className="group overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-colors hover:border-primary/30"
          >
            {post.cover_image_url ? (
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <OptimizedImage
                  src={post.cover_image_url}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  width={640}
                  height={360}
                />
              </div>
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center bg-muted/50">
                <Article className="size-10 text-muted-foreground/20" />
              </div>
            )}
            <div className="space-y-2 p-5">
              {post.published_at && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.published_at)}
                </p>
              )}
              <h2 className="text-lg font-semibold leading-snug group-hover:text-primary">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <CaretLeft />
          Өмнөх
        </Button>
        <p className="text-sm text-muted-foreground">
          {startIndex + 1} – {endIndex} / {posts.length}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Дараах
          <CaretRight />
        </Button>
      </div>
    </>
  );
}
