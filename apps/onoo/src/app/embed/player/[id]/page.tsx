import { notFound } from "next/navigation";
import { getPlayerById } from "@/app/lib/data";
import { PlayerAvatar } from "@/components/player-avatar";

interface Props {
  params: Promise<{ id: string }>;
}

function avg(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1);
}

export default async function PlayerEmbedPage({ params }: Props) {
  const { id } = await params;
  const result = await getPlayerById(id);

  if (!result?.player) notFound();

  const p = result.player;
  const rpg = (p.oreb_per_game ?? 0) + (p.dreb_per_game ?? 0);

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <PlayerAvatar
          photoUrl={p.photo_url}
          name={p.player_name}
          primaryColor={p.team_logo_url}
          size="lg"
        />
        <div>
          <h1 className="text-lg font-bold leading-tight">{p.player_name}</h1>
          {p.player_name_latin && (
            <p className="text-xs text-muted-foreground">
              {p.player_name_latin}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-xl font-bold tabular-nums">
            {avg(p.points_per_game)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            PPG
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold tabular-nums">{avg(rpg)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            RPG
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold tabular-nums">
            {avg(p.ast_per_game)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            APG
          </div>
        </div>
      </div>

      <footer className="text-right text-xs text-muted-foreground">
        <a
          href="https://onoo.mn"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          onoo.mn &uarr;
        </a>
      </footer>
    </div>
  );
}
