import { Badge } from "@zuiio/ui";
import { cn } from "@/lib/utils";
import type { GameWithTeams } from "../lib/shared";
import { statusLabel } from "../lib/shared";

interface GameStatusBadgeProps {
  game: Pick<GameWithTeams, "status" | "is_provisional">;
  className?: string;
}

function badgeVariantForStatus(
  status: string,
):
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "live"
  | "verified"
  | "provisional" {
  if (status === "live_provisional") return "live";
  if (status === "league_verified") return "verified";
  if (status === "final_pending_review") return "provisional";
  return "outline";
}

// Display primitive: loading and empty states are not applicable.
export function GameStatusBadge({ game, className }: GameStatusBadgeProps) {
  const label = game.is_provisional
    ? `${statusLabel(game.status)} · Урьдчилсан`
    : statusLabel(game.status);

  return (
    <Badge
      variant={badgeVariantForStatus(game.status)}
      className={cn(
        game.status === "live_provisional" && "animate-live-pulse",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
