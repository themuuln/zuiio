import { Shield, Swords, Trophy, Users } from "lucide-react";

// Placeholder team entries for the blurred preview grid
const PLACEHOLDER_TEAMS = [
  { name: "Хасууд", short: "ХАС", color: "bg-red-600" },
  { name: "Арслангууд", short: "АРС", color: "bg-blue-600" },
  { name: "Монгол шувууд", short: "МШВ", color: "bg-green-600" },
  { name: "Цасан тугал", short: "ЦСТ", color: "bg-orange-600" },
  { name: "Талын баатар", short: "ТЛБ", color: "bg-purple-600" },
  { name: "Хүчит шонхор", short: "ХШН", color: "bg-teal-600" },
];

export default function VsHubPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Баг хоорондын түүх</h1>
        <p className="mt-1 max-w-lg text-muted-foreground">
          Багуудын хоорондын тулааны түүх, ялалт, ялагдлын харьцааг нэг дороос
          харна уу.
        </p>
      </div>

      {/* ── Blurred team grid ── */}
      <div className="relative overflow-hidden rounded-xl border">
        <div className="blur-[2px]">
          <div className="divide-y">
            {/* Grid header */}
            <div className="grid grid-cols-12 gap-4 bg-muted/50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">Баг</div>
              <div className="col-span-3 text-center">Тоглолт</div>
              <div className="col-span-2 text-center">Ялалт</div>
              <div className="col-span-2 text-center">Ялагдал</div>
              <div className="col-span-1 text-center">Win%</div>
            </div>

            {/* Placeholder team rows */}
            {PLACEHOLDER_TEAMS.map((team) => (
              <div
                key={team.short}
                className="grid grid-cols-12 gap-4 px-6 py-4"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div
                    className={`size-3 shrink-0 rounded-full ${team.color}`}
                  />
                  <span className="font-medium">{team.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {team.short}
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-center gap-2 text-muted-foreground">
                  <Shield className="size-4" />
                  <span>—</span>
                </div>
                <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                  <span>—</span>
                </div>
                <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                  <span>—</span>
                </div>
                <div className="col-span-1 flex items-center justify-center text-muted-foreground">
                  <span>—</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Blur overlay with coming-soon badge ── */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <div className="rounded-lg border bg-background px-5 py-3 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Тун удахгүй
              </p>
              <p className="text-xs text-muted-foreground/60">Coming Soon</p>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              &quot;Өрсөлдөгчид&quot; эсвэл баг бүрийн профайл хуудаснаас
              тулааны түүхийг харж болно.
            </p>
          </div>
        </div>
      </div>

      {/* ── Feature explanation cards ── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Swords className="size-5" />
          </div>
          <h3 className="mb-1 text-sm font-semibold">Тулааны түүх</h3>
          <p className="text-xs text-muted-foreground">
            Тухайн хоёр багийн хооронд болсон бүх тоглолтын дэлгэрэнгүй түүх.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Trophy className="size-5" />
          </div>
          <h3 className="mb-1 text-sm font-semibold">Статистик харьцуулалт</h3>
          <p className="text-xs text-muted-foreground">
            Багуудын ялалт, ялагдал, онооны дундаж болон бусад үзүүлэлтүүд.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <h3 className="mb-1 text-sm font-semibold">Тоглогчийн гүйцэтгэл</h3>
          <p className="text-xs text-muted-foreground">
            Тулаанууд дахь тоглогч бүрийн хувийн гүйцэтгэлийн харьцуулалт.
          </p>
        </div>
      </div>
    </div>
  );
}
