/**
 * ShareCard — stat snapshot card for player profile
 */
export function ShareCard({
  playerName,
  statLine,
}: {
  playerName: string;
  statLine: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm font-semibold">{playerName}</p>
      <p className="mt-1 text-xs text-muted-foreground">{statLine}</p>
    </div>
  );
}
