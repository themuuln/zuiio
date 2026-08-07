import { ImageResponse } from "next/og";
import { getBoxScore, getGameById, statusLabel } from "@/app/lib/data";
import type { BoxScoreRow } from "@/app/lib/shared";
import { loadFont } from "../../_load-font";

/** Weighted performance score matching the existing page formula. */
function calculateWeightedScore(row: BoxScoreRow): number {
  return row.pts + (row.oreb + row.dreb) * 1.2 + row.ast * 1.5;
}

/** Sort a box score by weighted score, return top performer. */
function getTopPerformer(rows: BoxScoreRow[]): BoxScoreRow | null {
  if (rows.length === 0) return null;
  return [...rows].sort(
    (a, b) => calculateWeightedScore(b) - calculateWeightedScore(a),
  )[0];
}

function formatGameDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) {
    return new Response("Game not found", { status: 404 });
  }

  const homeName = game.home_team_name ?? "Эхлэх";
  const awayName = game.away_team_name ?? "Зочин";
  const homeScore = game.home_score;
  const awayScore = game.away_score;
  const homeColor = game.home_team_primary_color ?? "#3b82f6";
  const awayColor = game.away_team_primary_color ?? "#ef4444";
  const status = game.status ?? "scheduled";
  const statusText = statusLabel(status);

  const isFinal =
    status === "official" ||
    status === "league_verified" ||
    status === "final_pending_review";
  const isLive = status === "live_provisional";
  const statusBadgeColor = isLive ? "#ef4444" : isFinal ? "#22c55e" : "#71717a";

  const homeWon = (homeScore ?? 0) > (awayScore ?? 0);
  const winnerColor = homeWon ? homeColor : awayColor;

  // Fetch box score for top performer
  let topPerformer: BoxScoreRow | null = null;
  if (isFinal) {
    const boxScore = await getBoxScore(game.id);
    topPerformer = getTopPerformer(boxScore);
  }

  const [oswaldSemiBold, oswaldBold, interRegular] = await Promise.all([
    loadFont("Oswald", 600),
    loadFont("Oswald", 700),
    loadFont("Inter", 400),
  ]);

  const fonts = [
    ...(oswaldSemiBold
      ? [
          {
            name: "Oswald",
            data: oswaldSemiBold,
            weight: 600 as const,
            style: "normal" as const,
          },
        ]
      : []),
    ...(oswaldBold
      ? [
          {
            name: "Oswald",
            data: oswaldBold,
            weight: 700 as const,
            style: "normal" as const,
          },
        ]
      : []),
    ...(interRegular
      ? [
          {
            name: "Inter",
            data: interRegular,
            weight: 400 as const,
            style: "normal" as const,
          },
        ]
      : []),
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: '"Oswald", sans-serif',
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 800, color: "#ffffff" }}>
        {homeScore ?? "–"} : {awayScore ?? "–"}
      </div>
      <div style={{ fontSize: 20, color: "#a1a1aa", marginTop: 12 }}>
        {homeName} vs {awayName}
      </div>
    </div>,
    {
      width: 800,
      height: 400,
      fonts,
    },
  );
}
