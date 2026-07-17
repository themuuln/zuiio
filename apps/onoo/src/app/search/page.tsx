import type { Metadata } from "next";
import { searchAll } from "../lib/data";
import { SearchResults } from "./components/search-results";

export const metadata: Metadata = {
  title: "Хайлт — Оноо",
  description:
    "Тоглогч, баг, тоглолт — бүх мэдээллийг нэг дороос хайгаарай.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await searchAll(q);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Хайлт
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Бүх зүйлийг хайх
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Тоглогч, баг эсвэл тоглолтыг нэрээр хайж олоорой.
        </p>
      </header>

      <SearchResults
        initialQuery={q}
        initialResults={results}
      />
    </main>
  );
}
