import type { StandingRow } from "@/app/lib/shared";
import { TeamLogo } from "@/components/team-logo";
import { cn } from "@/lib/utils";

interface FormResult {
  gameId: string;
  result: "W" | "L";
}

interface TeamHeaderProps {
  team: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    short_code: string;
    team_season_id: string;
    social_links: Record<string, string>;
  };
  standings: StandingRow | undefined;
  form: FormResult[];
  averagePoints: number | null;
  pointDifference: number | null;
}

/**
 * Team identity header with logo, name, W–L record, form guide dots,
 * and team color accent band.
 */
export function TeamHeader({
  team,
  standings,
  form,
  averagePoints,
  pointDifference,
}: TeamHeaderProps) {
  return (
    <section
      className="team-showcase-hero relative overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground sm:p-8 lg:p-10"
      aria-label={`${team.name} багийн мэдээлэл`}
    >
      {/* Color accent band */}
      {team.primary_color && (
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ backgroundColor: team.primary_color }}
          aria-hidden="true"
        />
      )}

      <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="flex items-center gap-5 lg:col-span-7">
          <TeamLogo
            logoUrl={team.logo_url}
            shortCode={team.short_code}
            primaryColor={team.primary_color}
            size="xl"
            className="ring-4 ring-sidebar-border"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wider text-warning">
              {team.short_code}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-6xl">
              {team.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sidebar-foreground/70">
              {standings ? (
                <>
                  <span>
                    {standings.w}-{standings.l}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{((standings.win_pct ?? 0) * 100).toFixed(1)}%</span>
                  <span aria-hidden="true">·</span>
                  <span>{standings.competition_name}</span>
                </>
              ) : (
                <span>Баталгаажсан улирлын бүртгэл хүлээгдэж байна</span>
              )}
            </div>
            {/* Form guide dots */}
            {form.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="mr-1 text-xs text-muted-foreground">
                  Форм:
                </span>
                {form.map(({ gameId, result }) => (
                  <span
                    key={gameId}
                    className={cn(
                      "inline-block size-2.5 rounded-full",
                      result === "W" ? "bg-emerald-500" : "bg-red-400",
                    )}
                    title={result === "W" ? "Ялалт" : "Ялагдал"}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Social links */}
          {Object.keys(team.social_links).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(team.social_links).map(([platform, url]) => {
                if (!url) return null;
                const labels: Record<string, string> = {
                  instagram: "Instagram",
                  facebook: "Facebook",
                  twitter: "Twitter / X",
                  youtube: "YouTube",
                  tiktok: "TikTok",
                  website: "Вэб",
                };
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-1 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    {labels[platform] ?? platform}
                  </a>
                );
              })}
            </div>
          )}
          </div>

        <div className="grid grid-cols-3 gap-3 lg:col-span-5">
          <StatBlock
            label="ЯЛАЛТ"
            value={standings ? String(standings.w) : "—"}
          />
          <StatBlock label="ФОРМ" value={standings?.last10 ?? "—"} />
          <StatBlock
            label="ЗӨРҮҮ"
            value={
              pointDifference === null
                ? "—"
                : `${pointDifference > 0 ? "+" : ""}${pointDifference}`
            }
          />
        </div>
      </div>
    </section>
  );
}

interface StatBlockProps {
  label: string;
  value: string;
}

function StatBlock({ label, value }: StatBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-background/10 p-4 text-center backdrop-blur-sm">
      <span className="stat-number text-xl font-bold sm:text-2xl">{value}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
        {label}
      </span>
    </div>
  );
}
