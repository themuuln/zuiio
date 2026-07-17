import type { Metadata } from "next";
import { getLeaders } from "../lib/data";
import { LeaderTabs } from "./components/leader-tabs";

export const metadata: Metadata = {
  title: "Тэргүүлэгчид — Оноо",
  description:
    "Сагсан бөмбөгийн лигийн шилдэг тоглогчид бүх ангилалд: оноо, давсан, олгосон, булаасан, хаасан.",
};

export default async function LeadersPage() {
  const leaders = await getLeaders();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Лигийн шилдгүүд
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Тэргүүлэгчид
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Ангилал бүрийн шилдэг тоглогчдыг зураг, баг, тоглолтын тоо болон
          шалгуурын төлөвтэй нь харьцуулна.
        </p>
      </header>

      <LeaderTabs leaders={leaders} />
    </main>
  );
}
