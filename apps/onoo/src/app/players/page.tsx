import type { Metadata } from "next";
import { SuspendedPlayerGrid } from "./components/player-grid-section";

export const metadata: Metadata = {
  title: "Тоглогчид — Оноо",
  description: "Сагсан бөмбөгийн лигийн бүх тоглогчид — нэр, баг, статистик.",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* ── Hero header — streams immediately, no data dependency ── */}
      <header className="court-accent relative overflow-hidden rounded-xl bg-sidebar px-6 py-6 sm:px-10 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage: [
              "linear-gradient(to right, transparent 49.8%, var(--color-sidebar-border) 50%, transparent 50.2%)",
              "radial-gradient(circle at 50% 50%, transparent 0 14%, var(--color-sidebar-border) 14.2% 14.5%, transparent 14.7%)",
            ].join(", "),
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Тамирчдын түүх
          </p>
          <h1 className="mt-1 font-display text-3xl leading-tight tracking-tight text-sidebar-foreground sm:text-4xl">
            Тоглогчид
          </h1>
          <p className="mt-1.5 max-w-xl leading-relaxed text-sidebar-foreground/70">
            Тоглогчоо нэр, баг, байрлалаар олж улирлын гүйцэтгэл болон тоглолтын
            түүхийг нь үзээрэй.
          </p>
        </div>
      </header>

      {/* ── Player grid — streams via Suspense while data fetches ── */}
      <SuspendedPlayerGrid searchQuery={q} />
    </main>
  );
}
