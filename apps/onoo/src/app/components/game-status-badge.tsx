import { Badge } from "@/components/ui/badge";
import type { GameWithTeams } from "../lib/data";
import { statusLabel, statusVariant } from "../lib/data";

interface GameStatusBadgeProps {
  game: Pick<GameWithTeams, "status" | "is_provisional">;
  className?: string;
}

// Display primitive: loading and empty states are not applicable.
export function GameStatusBadge({ game, className }: GameStatusBadgeProps) {
  const label = game.is_provisional
    ? `${statusLabel(game.status)} · Урьдчилсан`
    : statusLabel(game.status);

  return (
    <Badge variant={statusVariant(game.status)} className={className}>
      {label}
    </Badge>
  );
}
