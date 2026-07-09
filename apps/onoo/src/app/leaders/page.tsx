import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Тэргүүлэгчид</h1>
        <p className="text-muted-foreground">Шилдэг тоглогчид бүх ангилалд</p>
      </header>

      <LeaderTabs leaders={leaders} />
    </main>
  );
}
