import type { Metadata } from "next";
import { InteractiveDemo } from "./components/interactive-demo";

export const metadata: Metadata = {
  title: "Интерактив UI — Демо",
  robots: { index: false },
};

/**
 * Demo page for verifying all 10 interactive UI components.
 * Not linked from navigation — accessed directly at /interactive-demo.
 */
export default function InteractiveDemoPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Хөгжүүлэгчийн демо
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Интерактив UI бүрэлдэхүүн
        </h1>
        <p className="mt-2 text-muted-foreground">
          10 интерактив бүрэлдэхүүнийг энд туршиж үзнэ. Энэ хуудас навигацид
          байхгүй.
        </p>
      </header>

      <InteractiveDemo />
    </main>
  );
}
