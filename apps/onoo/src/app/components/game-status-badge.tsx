import { cn } from "@/lib/utils";
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
    <Badge
      variant={statusVariant(game.status)}
      className={cn(
        game.status === "live_provisional" && "animate-pulse",
        className,
      )}
    >
      {game.status === "live_provisional" && (
        <span className="mr-1 inline-block size-1.5 rounded-full bg-destructive" aria-hidden="true" />
      )}
      {label}
    </Badge>
  );
}
