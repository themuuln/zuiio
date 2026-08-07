import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicEmptyState } from "../components/public-empty-state";
import { getNewsList } from "../lib/data";

export const metadata: Metadata = {
  title: "Мэдээ — Оноо",
  description:
    "Сагсан бөмбөгийн лигийн мэдээ: тоглолтын тойм, зарлал, шинэчлэлтүүд.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function NewsPage() {
  const articles = await getNewsList();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Лигийн мэдээ
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Мэдээ
        </h1>
      </div>

      {articles.length === 0 ? (
        <PublicEmptyState
          icon={Newspaper}
          title="Мэдээ байхгүй байна"
          description="Мэдээ нийтлэгдэхэд энд харагдана."
          actionHref="/"
          actionLabel="Нүүр хуудас руу буцах"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-[box-shadow,transform] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {article.cover_image_url ? (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={article.cover_image_url}
                    alt={article.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center bg-muted/40">
                  <Newspaper
                    className="size-10 text-muted-foreground/40"
                    aria-hidden="true"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <time
                  dateTime={article.published_at ?? article.created_at}
                  className="text-xs text-muted-foreground"
                >
                  {formatDate(article.published_at ?? article.created_at)}
                </time>
                <h2 className="font-display text-xl leading-tight tracking-tight group-hover:text-warning transition-colors">
                  {article.title}
                </h2>
                {article.excerpt ? (
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {article.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
