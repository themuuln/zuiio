import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PublicBlogPostDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
};

export default function PublicBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostDataFetcher params={params} />
    </Suspense>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { slug, postSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_blog_post", {
    p_slug: slug,
    p_post_slug: postSlug,
  });

  const post = data as PublicBlogPostDetail | null;
  if (!post) {
    return { title: "Нийтлэл" };
  }

  // Canonical host: use the request host when a custom domain served the
  // page (rewrites preserve it); fall back to the configured site URL.
  const host = (await headers()).get("host") ?? "";
  const configuredHost = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://zuiio.mn"
  ).replace(/^https?:\/\//, "");
  const canonicalBase =
    host && host !== configuredHost
      ? `https://${host}`
      : process.env.NEXT_PUBLIC_SITE_URL || "https://zuiio.mn";
  const postUrl = `${canonicalBase}/${slug}/blog/${postSlug}`;

  return {
    title: post.title,
    description: post.excerpt ?? post.title,
    robots: { index: true, follow: true },
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? post.title,
      ...(post.cover_image_url
        ? { images: [{ url: post.cover_image_url, width: 1200, height: 630 }] }
        : {}),
      type: "article",
      url: postUrl,
    },
  };
}

async function PostDataFetcher({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = await params;
  const supabase = await createClient();

  const [{ data, error }, { data: org }] = await Promise.all([
    supabase.rpc("get_public_blog_post", {
      p_slug: slug,
      p_post_slug: postSlug,
    }),
    supabase.from("organizations").select("name").eq("slug", slug).single(),
  ]);

  if (error || !data) {
    notFound();
  }

  const post = data as PublicBlogPostDetail;
  const publisherName = org?.name ?? null;

  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.cover_image_url ? { image: [post.cover_image_url] } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(publisherName
      ? { publisher: { "@type": "Organization", name: publisherName } }
      : {}),
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/${slug}/blog`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Блог руу буцах
        </Link>

        <article>
          {post.cover_image_url && (
            <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
              <OptimizedImage
                src={post.cover_image_url}
                alt={post.title}
                className="h-full w-full object-cover"
                width={1024}
                height={576}
                priority
              />
            </div>
          )}

          {post.published_at && (
            <p className="mb-3 text-sm text-muted-foreground">
              {formatDate(post.published_at)}
            </p>
          )}

          <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mb-8 text-lg text-muted-foreground">{post.excerpt}</p>
          )}

          <div className="prose prose-sm max-w-none text-muted-foreground sm:prose-base">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-4 whitespace-pre-line last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="aspect-[16/9] animate-pulse rounded-2xl bg-muted" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-4 w-full animate-pulse rounded bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
