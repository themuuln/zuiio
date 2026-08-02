import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { BlogContent } from "./blog-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: posts } = await withDbCapture(
    "page:blog posts",
    supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, content, cover_image_url, is_published, published_at, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  );

  const blogRows: BlogRow[] = (posts ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt,
    content: d.content,
    cover_image_url: d.cover_image_url,
    is_published: d.is_published,
    published_at: d.published_at,
    created_at: d.created_at ?? new Date().toISOString(),
  }));

  return <BlogContent posts={blogRows} />;
}

export type BlogRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export default async function BlogPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
