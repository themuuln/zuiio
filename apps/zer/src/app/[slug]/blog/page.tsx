import { Article } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  requestHost,
  storefrontCanonical,
  storefrontSocialMetadata,
} from "@/lib/storefront-seo";
import { createClient } from "@/lib/supabase/server";
import { BlogClient } from "./blog-client";

export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

export default function PublicBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<BlogSkeleton />}>
      <BlogDataFetcher params={params} />
    </Suspense>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("slug", slug)
    .single();

  const canonical = storefrontCanonical(await requestHost(), slug, "/blog");
  const title = org ? `${org.name} — Блог` : "Блог";
  const description = org ? `${org.name}-ийн блог, нийтлэлүүд` : "Блог";

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    ...storefrontSocialMetadata({
      title,
      description,
      canonical,
      siteName: org?.name ?? null,
    }),
  };
}

async function BlogDataFetcher({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_blog_posts", {
    p_slug: slug,
  });

  if (error) {
    notFound();
  }

  const posts = (data ?? []) as PublicBlogPost[];

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/${slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Буцах
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Article className="size-6" />
            Блог
          </h1>
          <p className="text-sm text-muted-foreground">Мэдээ, нийтлэлүүд</p>
        </div>

        <BlogClient slug={slug} posts={posts} />
      </div>
    </div>
  );
}

function BlogSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="overflow-hidden rounded-xl border border-border/80 bg-card"
            >
              <div className="aspect-[16/9] animate-pulse bg-muted" />
              <div className="space-y-2 p-5">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
