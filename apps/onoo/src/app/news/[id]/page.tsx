import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { getNewsById } from "../../lib/data";

interface NewsArticlePageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: NewsArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getNewsById(id);
  if (!article) return { title: "Мэдээ олдсонгүй — Оноо" };
  return {
    title: `${article.title} — Оноо`,
    description: article.excerpt ?? article.title,
  };
}

export default async function NewsArticlePage({
  params,
}: NewsArticlePageProps) {
  const { id } = await params;
  const article = await getNewsById(id);

  if (!article) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <Link
        href="/news"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Бүх мэдээ
      </Link>

      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <time
            dateTime={article.published_at ?? article.created_at}
            className="text-sm text-muted-foreground"
          >
            {formatDate(article.published_at ?? article.created_at)}
          </time>
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p className="text-lg leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          ) : null}
        </header>

        {article.cover_image_url ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="prose-sm">
          <Markdown content={article.body} />
        </div>
      </article>
    </main>
  );
}
