import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Админ — Zuiio ID",
};

/** PPR: static nav shell renders immediately, auth guard streams in. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-4 border-b border-border px-4 py-3">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Буцах
        </Link>
        <h1 className="text-sm font-semibold text-foreground">Админ</h1>
        <nav className="ml-auto flex gap-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Хэрэглэгчид
          </Link>
          <Link
            href="/admin/audit"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Аудит лог
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-4 py-6">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
