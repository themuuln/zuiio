import { ChevronRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { NewsArticle } from "../lib/data";

interface HomeLatestNewsProps {
  /** Latest published articles, newest first. */
  articles: NewsArticle[];
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("mn-MN", {
    month: "numeric",
    day: "numeric",
  });
}

/**
 * Latest news strip — the three most recent published articles.
 * Rendered only when at least one article exists.
 */
export function HomeLatestNews({ articles }: HomeLatestNewsProps) {
  return (
    <section
      aria-labelledby="news-heading"
      className="border-b bg-[var(--surface-1)]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2
            id="news-heading"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"
          >
            <Newspaper className="size-4" aria-hidden="true" />
            Сүүлийн мэдээ
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/news">
              Бүгд
              <ChevronRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.id}`}
              className="group flex flex-col gap-1.5 rounded-xl border bg-card px-4 py-3 transition-[box-shadow,transform] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <time
                dateTime={article.published_at ?? article.created_at}
                className="text-xs text-muted-foreground"
              >
                {shortDate(article.published_at ?? article.created_at)}
              </time>
              <h3 className="line-clamp-2 font-display text-base leading-snug tracking-tight group-hover:text-warning transition-colors">
                {article.title}
              </h3>
              {article.excerpt ? (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
