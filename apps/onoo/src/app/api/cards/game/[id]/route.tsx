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
    loadFont("Oswald", 800),
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
            weight: 800 as const,
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
      }}
    >
      {/* Top gradient bar — home → away team colors */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${homeColor}, ${awayColor})`,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "40px 48px",
          justifyContent: "center",
        }}
      >
        {/* Status badge + date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {isLive && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
          )}
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: statusBadgeColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {statusText}
          </span>
          <span
            style={{
              fontSize: 14,
              color: "#52525b",
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {formatGameDate(game.scheduled_at)}
          </span>
        </div>

        {/* Competition / league info */}
        <div
          style={{
            fontSize: 13,
            color: "#71717a",
            marginBottom: 20,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {game.competition_name} · {game.league_name}
        </div>

        {/* Scoreboard — 3-column grid */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Home team */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: homeWon ? "#ffffff" : "#71717a",
                textAlign: "right",
                lineHeight: 1.2,
              }}
            >
              {homeName}
            </div>
            {homeScore != null && (
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  color: homeWon ? "#ffffff" : "#52525b",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                {homeScore}
              </div>
            )}
          </div>

          {/* VS / divider */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              minWidth: 48,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "#52525b",
                fontWeight: 700,
              }}
            >
              VS
            </div>
          </div>

          {/* Away team */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: !homeWon ? "#ffffff" : "#71717a",
                textAlign: "left",
                lineHeight: 1.2,
              }}
            >
              {awayName}
            </div>
            {awayScore != null && (
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  color: !homeWon ? "#ffffff" : "#52525b",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                {awayScore}
              </div>
            )}
          </div>
        </div>

        {/* Winner highlight */}
        {isFinal && homeScore != null && awayScore != null && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 16,
            }}
          >
            <div
              style={{
                fontSize: 16,
                color: winnerColor,
                fontWeight: 700,
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {homeWon ? homeName : awayName} ялсан
            </div>
          </div>
        )}

        {/* Venue */}
        {game.venue_name && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 6,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "#52525b",
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {game.venue_name}
            </div>
          </div>
        )}

        {/* Top performer */}
        {topPerformer && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 24,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 10,
              padding: "14px 24px",
              alignSelf: "center",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#a1a1aa",
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Шилдэг тоглогч:{" "}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: '"Oswald", sans-serif',
                marginLeft: 6,
              }}
            >
              {topPerformer.player_name}
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#f97316",
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                marginLeft: 10,
              }}
            >
              {topPerformer.pts} PTS · {topPerformer.oreb + topPerformer.dreb}{" "}
              REB · {topPerformer.ast} AST
            </span>
          </div>
        )}
      </div>

      {/* Branding — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 40,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Onoo logo"
        >
          <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="white" />
        </svg>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Оноо
        </span>
      </div>
    </div>,
    {
      width: 800,
      height: 400,
      fonts,
    },
  );
}
