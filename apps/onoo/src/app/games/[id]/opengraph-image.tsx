import { ImageResponse } from "next/og";
import { getGameById, statusLabel } from "../../lib/data";

export const alt = "Оноо — Тоглолтын үр дүн";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(
  family: string,
  weight: 400 | 500 | 600 | 700 | 800,
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    ).then((r) => r.text());

    const match = css.match(
      /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/,
    );
    if (!match?.[1]) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGameById(id);

  const homeName = game?.home_team_name ?? "Эхлэх баг";
  const awayName = game?.away_team_name ?? "Зочин баг";
  const homeScore = game?.home_score;
  const awayScore = game?.away_score;
  const homeColor = game?.home_team_primary_color ?? "#3b82f6";
  const awayColor = game?.away_team_primary_color ?? "#ef4444";
  const status = game?.status ?? "scheduled";
  const statusText = statusLabel(status);

  const isFinal =
    status === "official" ||
    status === "league_verified" ||
    status === "final_pending_review";
  const isLive = status === "live_provisional";
  const statusBadgeColor = isLive ? "#ef4444" : isFinal ? "#22c55e" : "#71717a";

  const [barlowRegular, barlowBold, interRegular] = await Promise.all([
    loadFont("Oswald", 600),
    loadFont("Oswald", 800),
    loadFont("Inter", 400),
  ]);

  const fonts = [
    ...(barlowRegular
      ? [
          {
            name: "Oswald",
            data: barlowRegular,
            weight: 600 as const,
            style: "normal" as const,
          },
        ]
      : []),
    ...(barlowBold
      ? [
          {
            name: "Oswald",
            data: barlowBold,
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
          height: 8,
          background: `linear-gradient(90deg, ${homeColor}, ${awayColor})`,
        }}
      />

      {/* Main content — centered matchup */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "0 64px",
        }}
      >
        {/* Status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {isLive && (
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
          )}
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: statusBadgeColor,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {statusText}
          </span>
        </div>

        {/* Matchup row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            width: "100%",
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
                fontSize: 42,
                fontWeight: 700,
                color: "#ffffff",
                textAlign: "right",
                lineHeight: 1.2,
              }}
            >
              {homeName}
            </div>
            {homeScore != null && (
              <div
                style={{
                  fontSize: 96,
                  fontWeight: 700,
                  color: homeColor,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  marginTop: 8,
                }}
              >
                {homeScore}
              </div>
            )}
          </div>

          {/* VS divider */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 20,
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
                fontSize: 42,
                fontWeight: 700,
                color: "#ffffff",
                textAlign: "left",
                lineHeight: 1.2,
              }}
            >
              {awayName}
            </div>
            {awayScore != null && (
              <div
                style={{
                  fontSize: 96,
                  fontWeight: 700,
                  color: awayColor,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  marginTop: 8,
                }}
              >
                {awayScore}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Branding — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 48,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Оноо logo"
        >
          <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="white" />
        </svg>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Оноо
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts,
    },
  );
}
