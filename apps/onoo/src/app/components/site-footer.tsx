"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Оноо</span>
        <div className="flex gap-4">
          <Link href="/games" className="hover:underline">
            Тоглолтууд
          </Link>
          <Link href="/standings" className="hover:underline">
            Шалгуур
          </Link>
          <Link href="/leaders" className="hover:underline">
            Тэргүүлэгчид
          </Link>
        </div>
      </div>
    </footer>
  );
}
