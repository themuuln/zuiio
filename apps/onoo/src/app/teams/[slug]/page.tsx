import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeamBySlug } from "../../lib/data";

type TeamPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTeamBySlug(slug);
  if (!data) return { title: "Баг олдсонгүй — Оноо" };

  return {
    title: `${data.team.name} — Оноо`,
    description: `${data.team.name} багийн мэдээлэл, бүрэлдэхүүн, статистик.`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;
  const data = await getTeamBySlug(slug);
  if (!data) notFound();

  const { team, players, standings } = data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Team header */}
      <Card>
        <CardContent className="flex items-center gap-6 py-8 px-6">
          <span
            className="inline-block size-16 rounded-full border-2 shrink-0"
            style={{
              backgroundColor: team.primary_color ?? "oklch(0.5 0 0)",
            }}
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{team.short_code}</span>
              {standings && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {standings.wins}-{standings.losses}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{standings.win_pct.toFixed(3)}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standings card */}
      {standings && (
        <section aria-labelledby="team-standings">
          <h2 id="team-standings" className="sr-only">
            Шалгуур
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Ялагдал" value={`${standings.wins}`} />
            <StatCard label="Оноотой" value={`${standings.losses}`} />
            <StatCard label="Хувь" value={standings.win_pct.toFixed(3)} />
            <StatCard
              label="Зөрүү"
              value={`${standings.gb ?? 0}`}
            />
          </div>
        </section>
      )}

      {/* Roster */}
      <section aria-labelledby="roster-heading" className="space-y-3">
        <h2 id="roster-heading" className="text-xl font-semibold">
          Бүрэлдэхүүн
        </h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium" scope="col">#</th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Тоглогч
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Байрлал
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    Нэр (латин)
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 transition-colors hover:bg-accent/30"
                  >
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {p.jersey_number}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/players/${p.id}`}
                        className="hover:underline"
                      >
                        {p.canonical_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.position}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.name_latin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <div>
        <Link
          href="/standings"
          className="text-sm text-primary hover:underline"
        >
          ← Шалгуур руу буцах
        </Link>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
